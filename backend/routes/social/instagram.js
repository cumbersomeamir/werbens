import crypto from "crypto";
import { getDb } from "../../db.js";
import { upsertUser } from "../../lib/users.js";

const IG_OAUTH_AUTHORIZE = "https://www.instagram.com/oauth/authorize";
const IG_OAUTH_ACCESS_TOKEN = "https://api.instagram.com/oauth/access_token";
const IG_GRAPH_BASE = "https://graph.instagram.com/v21.0";
const STATE_TTL_MS = 10 * 60 * 1000;

const SCOPES = ["instagram_business_basic", "instagram_business_manage_insights", "instagram_business_content_publish"];

const stateStore = new Map();

function getFrontendBase() {
  const raw = process.env.FRONTEND_URL || "http://localhost:3000";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/app") ? trimmed : `${trimmed}/app`;
}

function pruneStates() {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > STATE_TTL_MS) stateStore.delete(state);
  }
}

/** Exchange authorization code for short-lived token (POST form body) */
async function exchangeCodeForToken(code, clientId, clientSecret, redirectUri) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code: code.replace(/#_?$/, "").trim(),
  });
  const res = await fetch(IG_OAUTH_ACCESS_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const item = data?.data?.[0] ?? data;
  return item?.access_token ? { access_token: item.access_token, user_id: item.user_id } : null;
}

/** Exchange short-lived for long-lived token (60 days) */
async function getLongLivedToken(shortLivedToken, clientSecret) {
  const url = `${IG_GRAPH_BASE.replace("/v21.0", "")}/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(clientSecret)}&access_token=${encodeURIComponent(shortLivedToken)}`;
  const res = await fetch(url);
  if (!res.ok) return shortLivedToken;
  const data = await res.json();
  return data.access_token || shortLivedToken;
}

async function igGraphGet(path, params, accessToken) {
  const q = new URLSearchParams(params || {});
  if (accessToken) q.set("access_token", accessToken);
  const url = `${IG_GRAPH_BASE}${path}?${q.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

/** Fetch profile, media, and insights using Instagram Login token */
async function fetchInstagramData(accessToken) {
  const profileRes = await igGraphGet("/me", { fields: "username,profile_picture_url,biography,followers_count,follows_count,media_count" }, accessToken);
  if (!profileRes || profileRes.error) return null;
  const profile = {
    id: profileRes.id,
    username: profileRes.username ?? null,
    profile_picture_url: profileRes.profile_picture_url ?? null,
    biography: profileRes.biography ?? null,
    followers_count: profileRes.followers_count ?? 0,
    follows_count: profileRes.follows_count ?? 0,
    media_count: profileRes.media_count ?? 0,
  };
  const mediaRes = await igGraphGet("/me/media", { fields: "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count", limit: "25" }, accessToken);
  let media = [];
  if (mediaRes?.data && Array.isArray(mediaRes.data)) {
    media = mediaRes.data.map((m) => ({
      id: m.id,
      caption: m.caption ?? "",
      media_type: m.media_type ?? null,
      media_url: m.media_url ?? null,
      permalink: m.permalink ?? null,
      thumbnail_url: m.thumbnail_url ?? null,
      timestamp: m.timestamp ?? null,
      like_count: m.like_count ?? 0,
      comments_count: m.comments_count ?? 0,
    }));
  }
  const insightsRes = await igGraphGet("/me/insights", { metric: "impressions,reach,profile_views", period: "day" }, accessToken);
  let insights = {};
  if (insightsRes?.data && Array.isArray(insightsRes.data)) {
    for (const m of insightsRes.data) {
      if (m.name && Array.isArray(m.values) && m.values.length > 0) {
        insights[m.name] = m.values.map((v) => ({ end_time: v.end_time, value: v.value }));
      }
    }
  }
  return { profile, media, insights };
}

export function getInstagramAuthUrl(req, res) {
  const userId = req.query.userId;
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" });
  }
  const clientId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = process.env.INSTAGRAM_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return res.status(503).json({
      error: "Instagram integration is not configured. Set INSTAGRAM_APP_ID and INSTAGRAM_CALLBACK_URL.",
    });
  }
  pruneStates();
  const state = crypto.randomUUID();
  stateStore.set(state, { userId: userId.trim(), createdAt: Date.now() });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(","),
    state,
    auth_type: "reauthorize", // Force re-authorization to request new permissions
  });
  res.json({ url: `${IG_OAUTH_AUTHORIZE}?${params.toString()}` });
}

export async function instagramCallback(req, res) {
  const { code, state, error } = req.query;
  const frontendBase = getFrontendBase();
  if (error === "access_denied") {
    return res.redirect(`${frontendBase}/accounts?error=access_denied`);
  }
  if (!code || !state) {
    return res.redirect(`${frontendBase}/accounts?error=missing_params`);
  }
  const data = stateStore.get(state);
  stateStore.delete(state);
  if (!data) {
    return res.redirect(`${frontendBase}/accounts?error=invalid_state`);
  }
  const userId = data.userId;
  const clientId = process.env.INSTAGRAM_APP_ID;
  const clientSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_CALLBACK_URL;
  if (!clientId || !clientSecret || !redirectUri) {
    return res.redirect(`${frontendBase}/accounts?error=server_config`);
  }
  try {
    const tokenResult = await exchangeCodeForToken(String(code), clientId, clientSecret, redirectUri);
    if (!tokenResult?.access_token) {
      console.error("Instagram token exchange failed");
      return res.redirect(`${frontendBase}/accounts?error=token_exchange`);
    }
    let accessToken = tokenResult.access_token;
    const igUserId = String(tokenResult.user_id ?? "");
    accessToken = await getLongLivedToken(accessToken, clientSecret);
    const igData = await fetchInstagramData(accessToken);
    if (!igData || !igData.profile) {
      return res.redirect(`${frontendBase}/accounts?error=user_fetch`);
    }
    const channelId = igData.profile.id || igUserId;
    const db = await getDb();
    const accountsColl = db.collection("SocialAccounts");
    const socialColl = db.collection("SocialMedia");
    const usersColl = db.collection("Users");
    const now = new Date();
    const username = igData.profile.username || "Instagram";
    await upsertUser({ userId, username });
    await accountsColl.updateOne(
      { userId, platform: "instagram", platformUserId: channelId },
      {
        $set: {
          userId,
          platform: "instagram",
          accessToken,
          platformUserId: channelId,
          username: `@${username}`,
          displayName: "Instagram",
          profileImageUrl: igData.profile.profile_picture_url ?? null,
          updatedAt: now,
        },
        $setOnInsert: { connectedAt: now },
      },
      { upsert: true }
    );
    const userDoc = await usersColl.findOne({ userId });
    const appUsername = userDoc?.username || username;
    await socialColl.updateOne(
      { userId, platform: "instagram", channelId },
      {
        $set: {
          userId,
          username: appUsername,
          platform: "instagram",
          channelId,
          profile: igData.profile,
          media: igData.media,
          insights: igData.insights,
          lastFetchedAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
    return res.redirect(`${frontendBase}/accounts?connected=instagram`);
  } catch (err) {
    console.error("Instagram callback error:", err);
    return res.redirect(`${frontendBase}/accounts?error=callback`);
  }
}

/** POST /api/social/instagram/sync */
export async function syncInstagram(req, res) {
  const userId = (req.body?.userId ?? req.query?.userId)?.trim();
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const socialColl = db.collection("SocialMedia");
  const usersColl = db.collection("Users");
  const userDoc = await usersColl.findOne({ userId });
  const now = new Date();
  const accounts = await accountsColl.find({ userId, platform: "instagram" }).toArray();
  if (!accounts?.length) {
    return res.status(404).json({ error: "Instagram account not connected for this user" });
  }
  for (const account of accounts) {
    if (!account?.accessToken) continue;
    const igData = await fetchInstagramData(account.accessToken);
    if (!igData || !igData.profile) continue;
    const channelId = String(igData.profile.id);
    const appUsername = userDoc?.username || igData.profile.username || "Instagram";
    await socialColl.updateOne(
      { userId, platform: "instagram", channelId },
      {
        $set: {
          userId,
          username: appUsername,
          platform: "instagram",
          channelId,
          profile: igData.profile,
          media: igData.media,
          insights: igData.insights,
          lastFetchedAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
  }
  return res.json({ ok: true, platform: "instagram", accounts: accounts.length });
}
