import crypto from "crypto";
import { getDb } from "../../db.js";
import { upsertUser } from "../../lib/users.js";

const FB_OAUTH_BASE = "https://www.facebook.com/v21.0/dialog/oauth";
const FB_GRAPH_BASE = "https://graph.facebook.com/v21.0";
const STATE_TTL_MS = 10 * 60 * 1000;

const SCOPES = [
  "public_profile",
  "pages_show_list",
  "pages_read_engagement",
  "pages_read_user_content",
  "pages_manage_posts", // Required for posting to Facebook pages
  "instagram_basic",
  "instagram_manage_insights",
];

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

/** Exchange code for short-lived user access token */
async function exchangeCodeForToken(code, clientId, clientSecret, redirectUri) {
  const url = `${FB_GRAPH_BASE}/oauth/access_token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token || null;
}

/** Exchange short-lived for long-lived user token (optional but recommended) */
async function getLongLivedToken(shortLivedToken, clientId, clientSecret) {
  const url = `${FB_GRAPH_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`;
  const res = await fetch(url);
  if (!res.ok) return shortLivedToken;
  const data = await res.json();
  return data.access_token || shortLivedToken;
}

/** GET graph with query params */
async function graphGet(path, params, accessToken) {
  const q = new URLSearchParams(params || {});
  if (accessToken) q.set("access_token", accessToken);
  const url = `${FB_GRAPH_BASE}${path}?${q.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

/** Fetch Facebook user profile */
async function fetchMe(userAccessToken) {
  const data = await graphGet("/me", { fields: "id,name,picture" }, userAccessToken);
  if (!data) return null;
  const pic = data.picture?.data?.url ?? data.picture;
  return {
    id: data.id,
    name: data.name ?? null,
    picture: pic ?? null,
  };
}

/** Fetch list of pages with access_token and optional instagram_business_account */
async function fetchAccounts(userAccessToken) {
  const data = await graphGet(
    "/me/accounts",
    { fields: "id,name,access_token,picture,instagram_business_account{id,username,profile_picture_url}" },
    userAccessToken
  );
  const list = data?.data;
  if (!Array.isArray(list)) return [];
  return list.map((p) => ({
    id: p.id,
    name: p.name ?? "",
    access_token: p.access_token ?? null,
    picture: p.picture?.data?.url ?? p.picture ?? null,
    instagram_business_account: p.instagram_business_account || null,
  }));
}

/** Fetch page feed (posts) */
async function fetchPageFeed(pageId, pageAccessToken, limit = 25) {
  const data = await graphGet(
    `/${pageId}/feed`,
    {
      fields: "id,message,created_time,full_picture,permalink_url,attachments{media},likes.summary(true),comments.summary(true)",
      limit: String(limit),
    },
    pageAccessToken
  );
  const list = data?.data;
  if (!Array.isArray(list)) return [];
  return list.map((p) => ({
    id: p.id,
    message: p.message ?? "",
    created_time: p.created_time ?? null,
    full_picture: p.full_picture ?? null,
    permalink_url: p.permalink_url ?? null,
    attachments: p.attachments?.data ?? null,
    likes: p.likes?.summary?.total_count ?? 0,
    comments: p.comments?.summary?.total_count ?? 0,
  }));
}

/** Fetch page insights (aggregate metrics) */
async function fetchPageInsights(pageId, pageAccessToken) {
  const data = await graphGet(
    `/${pageId}/insights`,
    {
      metric: "page_impressions,page_engaged_users,page_fans",
      period: "day",
      limit: "30",
    },
    pageAccessToken
  );
  const list = data?.data;
  if (!Array.isArray(list)) return {};
  const out = {};
  for (const m of list) {
    const name = m.name;
    const values = m.values;
    if (name && Array.isArray(values) && values.length > 0) {
      out[name] = values.map((v) => ({ end_time: v.end_time, value: v.value }));
    }
  }
  return out;
}

/** Fetch Instagram Business profile */
async function fetchIgProfile(igUserId, pageAccessToken) {
  const data = await graphGet(
    `/${igUserId}`,
    { fields: "username,profile_picture_url,biography,followers_count,follows_count,media_count" },
    pageAccessToken
  );
  if (!data || data.error) return null;
  return {
    id: igUserId,
    username: data.username ?? null,
    profile_picture_url: data.profile_picture_url ?? null,
    biography: data.biography ?? null,
    followers_count: data.followers_count ?? 0,
    follows_count: data.follows_count ?? 0,
    media_count: data.media_count ?? 0,
  };
}

/** Fetch Instagram media (posts/reels) */
async function fetchIgMedia(igUserId, pageAccessToken, limit = 25) {
  const data = await graphGet(
    `/${igUserId}/media`,
    {
      fields: "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count",
      limit: String(limit),
    },
    pageAccessToken
  );
  const list = data?.data;
  if (!Array.isArray(list)) return [];
  return list.map((m) => ({
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

/** Fetch Instagram account insights */
async function fetchIgInsights(igUserId, pageAccessToken) {
  const data = await graphGet(
    `/${igUserId}/insights`,
    {
      metric: "impressions,reach,profile_views",
      period: "day",
    },
    pageAccessToken
  );
  const list = data?.data;
  if (!Array.isArray(list)) return {};
  const out = {};
  for (const m of list) {
    const name = m.name;
    const values = m.values;
    if (name && Array.isArray(values) && values.length > 0) {
      out[name] = values.map((v) => ({ end_time: v.end_time, value: v.value }));
    }
  }
  return out;
}

/**
 * Fetch all Meta data: FB user, pages (feed + insights), and linked IG (profile + media + insights).
 * Returns { fbUser, channels: [ { type: 'facebook', pageId, name, picture, posts, insights }, { type: 'instagram', pageId, igId, profile, media, insights } ] }
 */
async function fetchMetaData(userAccessToken) {
  const fbUser = await fetchMe(userAccessToken);
  if (!fbUser) return null;

  const accounts = await fetchAccounts(userAccessToken);
  const channels = [];

  for (const page of accounts) {
    const pageToken = page.access_token;
    if (!pageToken) continue;

    const pageId = page.id;
    const pageName = page.name || "Facebook Page";
    const pagePicture = page.picture;

    const [posts, insights] = await Promise.all([
      fetchPageFeed(pageId, pageToken),
      fetchPageInsights(pageId, pageToken),
    ]);

    channels.push({
      type: "facebook",
      pageId,
      name: pageName,
      picture: pagePicture,
      posts,
      insights,
    });

    const igAccount = page.instagram_business_account;
    if (igAccount && igAccount.id) {
      const igId = igAccount.id;
      const [profile, media, igInsights] = await Promise.all([
        fetchIgProfile(igId, pageToken),
        fetchIgMedia(igId, pageToken),
        fetchIgInsights(igId, pageToken),
      ]);
      if (profile) {
        channels.push({
          type: "instagram",
          pageId,
          igId,
          profile,
          media,
          insights: igInsights,
        });
      }
    }
  }

  return { fbUser, channels };
}

export function getMetaAuthUrl(req, res) {
  const userId = req.query.userId;
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" });
  }
  const clientId = process.env.FACEBOOK_APP_ID || process.env.META_APP_ID;
  const redirectUri = process.env.FACEBOOK_CALLBACK_URL || process.env.META_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return res.status(503).json({
      error: "Meta integration is not configured. Set FACEBOOK_APP_ID and FACEBOOK_CALLBACK_URL.",
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
  });
  res.json({ url: `${FB_OAUTH_BASE}?${params.toString()}` });
}

export async function metaCallback(req, res) {
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
  const clientId = process.env.FACEBOOK_APP_ID || process.env.META_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET;
  const redirectUri = process.env.FACEBOOK_CALLBACK_URL || process.env.META_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return res.redirect(`${frontendBase}/accounts?error=server_config`);
  }
  try {
    let accessToken = await exchangeCodeForToken(code, clientId, clientSecret, redirectUri);
    if (!accessToken) {
      console.error("Meta token exchange failed");
      return res.redirect(`${frontendBase}/accounts?error=token_exchange`);
    }
    if (clientSecret) {
      accessToken = await getLongLivedToken(accessToken, clientId, clientSecret);
    }
    const metaData = await fetchMetaData(accessToken);
    if (!metaData || !metaData.fbUser) {
      return res.redirect(`${frontendBase}/accounts?error=user_fetch`);
    }
    const db = await getDb();
    const accountsColl = db.collection("SocialAccounts");
    const socialColl = db.collection("SocialMedia");
    const usersColl = db.collection("Users");
    const now = new Date();
    const displayName = metaData.fbUser.name || "Facebook";
    await upsertUser({ userId, username: displayName });
    const channelsForAccount = metaData.channels.map((ch) => {
      if (ch.type === "facebook") {
        return {
          platform: "facebook",
          channelId: String(ch.pageId),
          name: ch.name || "Facebook Page",
          picture: ch.picture ?? null,
        };
      }
      if (ch.type === "instagram") {
        return {
          platform: "instagram",
          channelId: String(ch.igId),
          pageId: String(ch.pageId),
          username: ch.profile?.username ?? null,
          picture: ch.profile?.profile_picture_url ?? null,
        };
      }
      return null;
    }).filter(Boolean);
    await accountsColl.updateOne(
      { userId, platform: "facebook", platformUserId: metaData.fbUser.id },
      {
        $set: {
          userId,
          platform: "facebook",
          accessToken,
          platformUserId: metaData.fbUser.id,
          username: displayName,
          displayName: "Facebook",
          profileImageUrl: metaData.fbUser.picture ?? null,
          channels: channelsForAccount,
          updatedAt: now,
        },
        $setOnInsert: { connectedAt: now },
      },
      { upsert: true }
    );
    const userDoc = await usersColl.findOne({ userId });
    const appUsername = userDoc?.username || displayName;
    for (const ch of metaData.channels) {
      if (ch.type === "facebook") {
        await socialColl.updateOne(
          { userId, platform: "facebook", channelId: ch.pageId },
          {
            $set: {
              userId,
              username: appUsername,
              platform: "facebook",
              channelId: ch.pageId,
              profile: { id: ch.pageId, name: ch.name, picture: ch.picture },
              posts: ch.posts,
              insights: ch.insights,
              lastFetchedAt: now,
              updatedAt: now,
            },
          },
          { upsert: true }
        );
      } else if (ch.type === "instagram") {
        await socialColl.updateOne(
          { userId, platform: "instagram", channelId: ch.igId },
          {
            $set: {
              userId,
              username: appUsername,
              platform: "instagram",
              channelId: ch.igId,
              profile: ch.profile,
              media: ch.media,
              insights: ch.insights,
              lastFetchedAt: now,
              updatedAt: now,
            },
          },
          { upsert: true }
        );
      }
    }
    return res.redirect(`${frontendBase}/accounts?connected=facebook`);
  } catch (err) {
    console.error("Meta callback error:", err);
    return res.redirect(`${frontendBase}/accounts?error=callback`);
  }
}

/** POST /api/social/meta/sync — re-fetch all pages and IG channels */
export async function syncMeta(req, res) {
  const userId = (req.body?.userId ?? req.query?.userId)?.trim();
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const accounts = await accountsColl.find({ userId, platform: "facebook" }).toArray();
  if (!accounts?.length) {
    return res.status(404).json({ error: "Facebook account not connected for this user" });
  }
  const socialColl = db.collection("SocialMedia");
  const usersColl = db.collection("Users");
  const userDoc = await usersColl.findOne({ userId });
  const now = new Date();
  let totalChannels = 0;
  for (const account of accounts) {
    if (!account?.accessToken) continue;
    const metaData = await fetchMetaData(account.accessToken);
    if (!metaData || !metaData.fbUser) continue;
    totalChannels += metaData.channels.length;
    const appUsername = userDoc?.username || metaData.fbUser.name || "Facebook";

    const channelsForAccount = metaData.channels.map((ch) => {
      if (ch.type === "facebook") {
        return {
          platform: "facebook",
          channelId: String(ch.pageId),
          name: ch.name || "Facebook Page",
          picture: ch.picture ?? null,
        };
      }
      if (ch.type === "instagram") {
        return {
          platform: "instagram",
          channelId: String(ch.igId),
          pageId: String(ch.pageId),
          username: ch.profile?.username ?? null,
          picture: ch.profile?.profile_picture_url ?? null,
        };
      }
      return null;
    }).filter(Boolean);
    await accountsColl.updateOne(
      { _id: account._id },
      {
        $set: {
          platformUserId: account.platformUserId || metaData.fbUser.id,
          username: metaData.fbUser.name || account.username || "Facebook",
          profileImageUrl: metaData.fbUser.picture ?? account.profileImageUrl ?? null,
          channels: channelsForAccount,
          updatedAt: now,
        },
      }
    );

    for (const ch of metaData.channels) {
      if (ch.type === "facebook") {
        await socialColl.updateOne(
          { userId, platform: "facebook", channelId: ch.pageId },
          {
            $set: {
              userId,
              username: appUsername,
              platform: "facebook",
              channelId: ch.pageId,
              profile: { id: ch.pageId, name: ch.name, picture: ch.picture },
              posts: ch.posts,
              insights: ch.insights,
              lastFetchedAt: now,
              updatedAt: now,
            },
          },
          { upsert: true }
        );
      } else if (ch.type === "instagram") {
        await socialColl.updateOne(
          { userId, platform: "instagram", channelId: ch.igId },
          {
            $set: {
              userId,
              username: appUsername,
              platform: "instagram",
              channelId: ch.igId,
              profile: ch.profile,
              media: ch.media,
              insights: ch.insights,
              lastFetchedAt: now,
              updatedAt: now,
            },
          },
          { upsert: true }
        );
      }
    }
  }
  return res.json({ ok: true, platform: "facebook", accounts: accounts.length, channels: totalChannels });
}
