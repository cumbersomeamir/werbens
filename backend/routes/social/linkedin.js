import crypto from "crypto";
import { getDb } from "../../db.js";
import { upsertUser } from "../../lib/users.js";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const SCOPES = ["openid", "profile", "email"];
const STATE_TTL_MS = 10 * 60 * 1000;

function getFrontendBase() {
  const raw = process.env.FRONTEND_URL || "http://localhost:3000";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/app") ? trimmed : `${trimmed}/app`;
}

const stateStore = new Map();

function pruneStates() {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > STATE_TTL_MS) stateStore.delete(state);
  }
}

/** Fetch profile from LinkedIn OpenID Connect userinfo. */
async function fetchLinkedInUserInfo(accessToken) {
  const res = await fetch(LINKEDIN_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}

export function getLinkedInAuthUrl(req, res) {
  const userId = req.query.userId;
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" });
  }
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return res.status(503).json({
      error: "LinkedIn integration is not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CALLBACK_URL.",
    });
  }
  pruneStates();
  const state = crypto.randomUUID();
  stateStore.set(state, { userId: userId.trim(), createdAt: Date.now() });
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES.join(" "),
    state,
  });
  res.json({ url: `${LINKEDIN_AUTH_URL}?${params.toString()}` });
}

export async function linkedinCallback(req, res) {
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
  const userId = data.userId;
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return res.redirect(`${frontendBase}/accounts?error=server_config`);
  }
  try {
    const tokenRes = await fetch(LINKEDIN_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret || "",
      }).toString(),
    });
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("LinkedIn token exchange failed:", tokenRes.status, errText);
      return res.redirect(`${frontendBase}/accounts?error=token_exchange`);
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;
    const userInfo = await fetchLinkedInUserInfo(accessToken);
    if (!userInfo || !userInfo.sub) {
      return res.redirect(`${frontendBase}/accounts?error=user_fetch`);
    }
    const db = await getDb();
    const displayName = userInfo.name || [userInfo.given_name, userInfo.family_name].filter(Boolean).join(" ") || "LinkedIn";
    await upsertUser({ userId, username: displayName });
    const accountsColl = db.collection("SocialAccounts");
    const now = new Date();
    await accountsColl.updateOne(
      { userId, platform: "linkedin", platformUserId: userInfo.sub },
      {
        $set: {
          userId,
          platform: "linkedin",
          accessToken,
          refreshToken,
          platformUserId: userInfo.sub,
          username: displayName,
          displayName: "LinkedIn",
          profileImageUrl: userInfo.picture || null,
          updatedAt: now,
        },
        $setOnInsert: { connectedAt: now },
      },
      { upsert: true }
    );
    const profile = {
      sub: userInfo.sub,
      name: userInfo.name || null,
      given_name: userInfo.given_name || null,
      family_name: userInfo.family_name || null,
      picture: userInfo.picture || null,
      locale: userInfo.locale || null,
      email: userInfo.email || null,
      email_verified: userInfo.email_verified ?? null,
    };
    const socialColl = db.collection("SocialMedia");
    const usersColl = db.collection("Users");
    const userDoc = await usersColl.findOne({ userId });
    const appUsername = userDoc?.username || displayName;
    await socialColl.updateOne(
      { userId, platform: "linkedin", channelId: userInfo.sub },
      {
        $set: {
          userId,
          username: appUsername,
          platform: "linkedin",
          channelId: userInfo.sub,
          profile,
          posts: [],
          lastFetchedAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
    return res.redirect(`${frontendBase}/accounts?connected=linkedin`);
  } catch (err) {
    console.error("LinkedIn callback error:", err);
    return res.redirect(`${frontendBase}/accounts?error=callback`);
  }
}

/** POST /api/social/linkedin/sync — re-fetch profile from userinfo. */
export async function syncLinkedIn(req, res) {
  const userId = (req.body?.userId ?? req.query?.userId)?.trim();
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const usersColl = db.collection("Users");
  const userDoc = await usersColl.findOne({ userId });
  const socialColl = db.collection("SocialMedia");
  const accounts = await accountsColl.find({ userId, platform: "linkedin" }).toArray();
  if (!accounts?.length) {
    return res.status(404).json({ error: "LinkedIn account not connected for this user" });
  }
  const now = new Date();
  for (const account of accounts) {
    if (!account?.accessToken) continue;
    const userInfo = await fetchLinkedInUserInfo(account.accessToken);
    if (!userInfo || !userInfo.sub) continue;
    const profile = {
      sub: userInfo.sub,
      name: userInfo.name || null,
      given_name: userInfo.given_name || null,
      family_name: userInfo.family_name || null,
      picture: userInfo.picture || null,
      locale: userInfo.locale || null,
      email: userInfo.email || null,
      email_verified: userInfo.email_verified ?? null,
    };
    const appUsername = userDoc?.username || profile.name || "LinkedIn";
    await socialColl.updateOne(
      { userId, platform: "linkedin", channelId: userInfo.sub },
      {
        $set: {
          userId,
          username: appUsername,
          platform: "linkedin",
          channelId: userInfo.sub,
          profile,
          posts: [],
          lastFetchedAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
  }
  return res.json({ ok: true, platform: "linkedin", accounts: accounts.length });
}
