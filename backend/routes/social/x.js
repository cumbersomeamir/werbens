import crypto from "crypto";
import { getDb } from "../../db.js";
import { upsertUser } from "../../lib/users.js";
import { generatePKCE, getCodeChallengeMethod } from "./pkce.js";

const X_AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_API_BASE = "https://api.x.com/2";

const SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];
const STATE_TTL_MS = 10 * 60 * 1000;

const USER_FIELDS = "id,name,username,profile_image_url,description,created_at,public_metrics,verified,location,url";
const TWEET_FIELDS = "created_at,public_metrics,text,entities,conversation_id,referenced_tweets";

function getFrontendBase() {
  const raw = process.env.FRONTEND_URL || "http://localhost:3000";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/app") ? trimmed : `${trimmed}/app`;
}

/** Fetch full profile + tweets from X API. Returns { profile, posts } for SocialMedia. */
export async function fetchXUserData(accessToken) {
  const userRes = await fetch(
    `${X_API_BASE}/users/me?user.fields=${USER_FIELDS}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!userRes.ok) return null;
  const userData = await userRes.json();
  const profile = userData.data || {};
  const platformUserId = profile.id;

  const tweetsRes = await fetch(
    `${X_API_BASE}/users/${platformUserId}/tweets?max_results=100&tweet.fields=${TWEET_FIELDS}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  let posts = [];
  if (tweetsRes.ok) {
    const tweetsData = await tweetsRes.json();
    posts = (tweetsData.data || []).map((t) => ({
      id: t.id,
      text: t.text || "",
      created_at: t.created_at,
      public_metrics: t.public_metrics || {},
      entities: t.entities || null,
      conversation_id: t.conversation_id || null,
      referenced_tweets: t.referenced_tweets || null,
    }));
  }
  return { profile, posts };
}

// In-memory: state -> { userId, codeVerifier, createdAt }. For production use Redis.
const stateStore = new Map();

function pruneStates() {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > STATE_TTL_MS) stateStore.delete(state);
  }
}

export function getXAuthUrl(req, res) {
  const userId = req.query.userId;
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" });
  }

  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = process.env.X_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return res.status(503).json({
      error: "X (Twitter) integration is not configured. Set X_CLIENT_ID and X_CALLBACK_URL.",
    });
  }

  pruneStates();
  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = crypto.randomUUID();
  stateStore.set(state, {
    userId: userId.trim(),
    codeVerifier,
    createdAt: Date.now(),
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: getCodeChallengeMethod(),
  });

  res.json({ url: `${X_AUTHORIZE_URL}?${params.toString()}` });
}

export async function xCallback(req, res) {
  const { code, state } = req.query;
  const frontendBase = getFrontendBase();

  if (!code || !state) {
    return res.redirect(`${frontendBase}/accounts?error=missing_params`);
  }

  const data = stateStore.get(state);
  stateStore.delete(state);
  if (!data) {
    return res.redirect(`${frontendBase}/accounts?error=invalid_state`);
  }

  const { userId, codeVerifier } = data;
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const redirectUri = process.env.X_CALLBACK_URL;

  if (!clientId || !redirectUri) {
    return res.redirect(`${frontendBase}/accounts?error=server_config`);
  }

  try {
    const body = new URLSearchParams({
      code: String(code),
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    if (clientSecret) {
      headers["Authorization"] =
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    } else {
      body.append("client_id", clientId);
    }

    const tokenRes = await fetch(X_TOKEN_URL, {
      method: "POST",
      headers,
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("X token exchange failed:", tokenRes.status, errText);
      return res.redirect(`${frontendBase}/accounts?error=token_exchange`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;

    const xData = await fetchXUserData(accessToken);
    if (!xData) {
      console.error("X user fetch failed");
      return res.redirect(`${frontendBase}/accounts?error=user_fetch`);
    }
    const { profile, posts } = xData;
    const platformUserId = profile.id;
    const username = profile.username || null;
    const displayName = profile.name || null;
    const profileImageUrl = profile.profile_image_url || null;

    const db = await getDb();
    await upsertUser({
      userId: userId.trim(),
      username: displayName || username || null,
    });

    const accountsColl = db.collection("SocialAccounts");
    const now = new Date();
    await accountsColl.updateOne(
      { userId, platform: "x", platformUserId },
      {
        $set: {
          userId,
          platform: "x",
          accessToken,
          refreshToken,
          platformUserId,
          username,
          displayName,
          profileImageUrl,
          updatedAt: now,
        },
        $setOnInsert: { connectedAt: now },
      },
      { upsert: true }
    );

    const socialColl = db.collection("SocialMedia");
    const appUsername = displayName || username || null;
    // Migrate legacy single-account doc (channelId="") if present.
    await socialColl.updateOne(
      { userId: userId.trim(), platform: "x", channelId: "" },
      { $set: { channelId: String(platformUserId) } }
    );
    await socialColl.updateOne(
      { userId, platform: "x", channelId: String(platformUserId) },
      {
        $set: {
          userId: userId.trim(),
          username: appUsername,
          platform: "x",
          channelId: String(platformUserId),
          profile: {
            id: profile.id,
            name: profile.name,
            username: profile.username,
            profile_image_url: profile.profile_image_url,
            description: profile.description || null,
            created_at: profile.created_at || null,
            public_metrics: profile.public_metrics || null,
            verified: profile.verified ?? false,
            location: profile.location || null,
            url: profile.url || null,
          },
          posts,
          lastFetchedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return res.redirect(`${frontendBase}/accounts?connected=x`);
  } catch (err) {
    console.error("X callback error:", err);
    return res.redirect(`${frontendBase}/accounts?error=callback`);
  }
}

/** POST /api/social/x/sync — re-fetch X profile + tweets and update SocialMedia. Body or query: userId (required). */
export async function syncX(req, res) {
  const userId = (req.body?.userId ?? req.query?.userId)?.trim();
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const accounts = await accountsColl.find({ userId, platform: "x" }).toArray();
  if (!accounts?.length) {
    return res.status(404).json({ error: "X account not connected for this user" });
  }
  const usersColl = db.collection("Users");
  const user = await usersColl.findOne({ userId });
  const socialColl = db.collection("SocialMedia");
  const now = new Date();
  for (const account of accounts) {
    if (!account?.accessToken) continue;
    const xData = await fetchXUserData(account.accessToken);
    if (!xData) continue;
    const { profile, posts } = xData;
    const platformUserId = String(account.platformUserId || profile.id || "");
    const appUsername = user?.username ?? profile.name ?? profile.username ?? null;
    if (!platformUserId) continue;
    await socialColl.updateOne(
      { userId, platform: "x", channelId: platformUserId },
      {
        $set: {
          userId,
          username: appUsername,
          platform: "x",
          channelId: platformUserId,
          profile: {
            id: profile.id,
            name: profile.name,
            username: profile.username,
            profile_image_url: profile.profile_image_url,
            description: profile.description || null,
            created_at: profile.created_at || null,
            public_metrics: profile.public_metrics || null,
            verified: profile.verified ?? false,
            location: profile.location || null,
            url: profile.url || null,
          },
          posts,
          lastFetchedAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
  }
  return res.json({ ok: true, platform: "x", accounts: accounts.length });
}
