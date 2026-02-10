import crypto from "crypto";
import { getDb } from "../../db.js";
import { upsertUser } from "../../lib/users.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
// Request both Data API and Analytics API scopes so we can fetch Studio-level metrics.
const YOUTUBE_SCOPE =
  "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_ANALYTICS_BASE = "https://youtubeanalytics.googleapis.com/v2";
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

/** Fetch channels for the authenticated user, then for each channel fetch profile + videos. */
async function fetchYouTubeData(accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const channelsRes = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=snippet,statistics,contentDetails&mine=true`,
    { headers }
  );
  if (!channelsRes.ok) return null;
  const channelsData = await channelsRes.json();
  const channelItems = channelsData.items || [];
  if (channelItems.length === 0) return { channels: [] };

  const result = [];
  for (const ch of channelItems) {
    const channelId = ch.id;
    const snippet = ch.snippet || {};
    const statistics = ch.statistics || {};
    const contentDetails = ch.contentDetails || {};
    const uploadsPlaylistId = contentDetails.relatedPlaylists?.uploads;

    const profile = {
      id: channelId,
      title: snippet.title || "",
      description: snippet.description || "",
      publishedAt: snippet.publishedAt || null,
      thumbnails: snippet.thumbnails || {},
      statistics: {
        subscriberCount: Number(statistics.subscriberCount) || 0,
        videoCount: Number(statistics.videoCount) || 0,
        viewCount: Number(statistics.viewCount) || 0,
      },
    };

    let videos = [];
    if (uploadsPlaylistId) {
      const playlistRes = await fetch(
        `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50`,
        { headers }
      );
      if (playlistRes.ok) {
        const playlistData = await playlistRes.json();
        const videoIds = (playlistData.items || [])
          .map((i) => i.contentDetails?.videoId)
          .filter(Boolean);
        if (videoIds.length > 0) {
          const videosRes = await fetch(
            `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(",")}`,
            { headers }
          );
          if (videosRes.ok) {
            const videosData = await videosRes.json();
            videos = (videosData.items || []).map((v) => ({
              id: v.id,
              title: v.snippet?.title || "",
              description: v.snippet?.description || "",
              publishedAt: v.snippet?.publishedAt || null,
              thumbnails: v.snippet?.thumbnails || {},
              statistics: {
                viewCount: Number(v.statistics?.viewCount) || 0,
                likeCount: Number(v.statistics?.likeCount) || 0,
                commentCount: Number(v.statistics?.commentCount) || 0,
              },
              duration: v.contentDetails?.duration || null,
            }));
          }
        }
      }
    }
    result.push({ profile, videos });
  }
  return { channels: result };
}

function mapAnalyticsRows(resp) {
  if (!resp || !Array.isArray(resp.rows) || !Array.isArray(resp.columnHeaders)) return [];
  const headers = resp.columnHeaders.map((h) => h.name);
  return resp.rows.map((row) => {
    const obj = {};
    headers.forEach((name, idx) => {
      obj[name] = row[idx];
    });
    return obj;
  });
}

async function ytAnalyticsGet(params, accessToken) {
  const search = new URLSearchParams(params);
  const url = `${YOUTUBE_ANALYTICS_BASE}/reports?${search.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("YouTube Analytics error:", res.status, text);
    return null;
  }
  return res.json();
}

/** Fetch richer analytics for a given channel (Studio-like data). */
async function fetchYouTubeAnalytics(accessToken, channelId) {
  if (!channelId) return null;
  const today = new Date();
  const endDate = today.toISOString().slice(0, 10);
  const start30 = new Date(today);
  start30.setDate(start30.getDate() - 30);
  const start30Str = start30.toISOString().slice(0, 10);
  const start28 = new Date(today);
  start28.setDate(start28.getDate() - 28);
  const start28Str = start28.toISOString().slice(0, 10);

  const ids = `channel==${channelId}`;

  // 1) Per-day channel metrics (last 30 days)
  const channelDailyResp = await ytAnalyticsGet(
    {
      ids,
      startDate: start30Str,
      endDate,
      metrics:
        "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,subscribersGained,subscribersLost",
      dimensions: "day",
      sort: "day",
    },
    accessToken
  );

  // 2) Top videos last 28 days by watch time
  const topVideosResp = await ytAnalyticsGet(
    {
      ids,
      startDate: start28Str,
      endDate,
      metrics:
        "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained,subscribersLost",
      dimensions: "video",
      sort: "-estimatedMinutesWatched",
      maxResults: "10",
    },
    accessToken
  );

  // 3) Traffic sources (last 30 days)
  const trafficSourcesResp = await ytAnalyticsGet(
    {
      ids,
      startDate: start30Str,
      endDate,
      metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage",
      dimensions: "insightTrafficSourceType",
      sort: "-views",
    },
    accessToken
  );

  // 4) Geography (top countries, last 30 days)
  const geographyResp = await ytAnalyticsGet(
    {
      ids,
      startDate: start30Str,
      endDate,
      metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage",
      dimensions: "country",
      sort: "-views",
      maxResults: "10",
    },
    accessToken
  );

  // 5) Device types (last 30 days)
  const devicesResp = await ytAnalyticsGet(
    {
      ids,
      startDate: start30Str,
      endDate,
      metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage",
      dimensions: "deviceType",
      sort: "-views",
    },
    accessToken
  );

  return {
    channelDaily: mapAnalyticsRows(channelDailyResp),
    topVideos: mapAnalyticsRows(topVideosResp),
    trafficSources: mapAnalyticsRows(trafficSourcesResp),
    geography: mapAnalyticsRows(geographyResp),
    devices: mapAnalyticsRows(devicesResp),
  };
}

export function getYoutubeAuthUrl(req, res) {
  const userId = req.query.userId;
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" });
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.YOUTUBE_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return res.status(503).json({
      error: "YouTube integration is not configured. Set GOOGLE_CLIENT_ID and YOUTUBE_CALLBACK_URL.",
    });
  }
  pruneStates();
  const state = crypto.randomUUID();
  stateStore.set(state, { userId: userId.trim(), createdAt: Date.now() });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: YOUTUBE_SCOPE,
    state,
    access_type: "offline",
    prompt: "consent",
  });
  res.json({ url: `${GOOGLE_AUTH_URL}?${params.toString()}` });
}

export async function youtubeCallback(req, res) {
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
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return res.redirect(`${frontendBase}/accounts?error=server_config`);
  }
  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("YouTube token exchange failed:", tokenRes.status, errText);
      return res.redirect(`${frontendBase}/accounts?error=token_exchange`);
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;
    const ytData = await fetchYouTubeData(accessToken);
    if (!ytData || ytData.channels.length === 0) {
      return res.redirect(`${frontendBase}/accounts?error=no_channels`);
    }
    const db = await getDb();
    const usersColl = db.collection("Users");
    const firstChannelTitle = ytData.channels[0]?.profile?.title || "YouTube";
    await upsertUser({ userId, username: firstChannelTitle });
    const accountsColl = db.collection("SocialAccounts");
    const now = new Date();
    // Use the first channel id as a stable identity for this Google login in our DB.
    const platformUserId = String(ytData.channels[0]?.profile?.id || "youtube");
    const channelsForAccount = ytData.channels.map((c) => ({
      channelId: c.profile.id,
      title: c.profile.title,
      thumbnail: c.profile.thumbnails?.default?.url || null,
    }));
    await accountsColl.updateOne(
      { userId, platform: "youtube", platformUserId },
      {
        $set: {
          userId,
          platform: "youtube",
          accessToken,
          refreshToken,
          platformUserId,
          username: channelsForAccount[0]?.title || "YouTube",
          displayName: "YouTube",
          profileImageUrl: channelsForAccount[0]?.thumbnail || null,
          channels: channelsForAccount,
          updatedAt: now,
        },
        $setOnInsert: { connectedAt: now },
      },
      { upsert: true }
    );
    const socialColl = db.collection("SocialMedia");
    const userDoc = await usersColl.findOne({ userId });
    const appUsername = userDoc?.username || firstChannelTitle;
    for (const { profile, videos } of ytData.channels) {
      const analytics = await fetchYouTubeAnalytics(accessToken, profile.id).catch(() => null);
      await socialColl.updateOne(
        { userId, platform: "youtube", channelId: profile.id },
        {
          $set: {
            userId,
            username: appUsername,
            platform: "youtube",
            channelId: profile.id,
            profile,
            videos,
            insights: analytics || null,
            lastFetchedAt: now,
            updatedAt: now,
          },
        },
        { upsert: true }
      );
    }
    return res.redirect(`${frontendBase}/accounts?connected=youtube`);
  } catch (err) {
    console.error("YouTube callback error:", err);
    return res.redirect(`${frontendBase}/accounts?error=callback`);
  }
}

/** POST /api/social/youtube/sync — re-fetch all channels and videos. */
export async function syncYoutube(req, res) {
  const userId = (req.body?.userId ?? req.query?.userId)?.trim();
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const accounts = await accountsColl.find({ userId, platform: "youtube" }).toArray();
  if (!accounts?.length) {
    return res.status(404).json({ error: "YouTube account not connected for this user" });
  }
  const usersColl = db.collection("Users");
  const userDoc = await usersColl.findOne({ userId });
  const appUsername = userDoc?.username || "YouTube";
  const socialColl = db.collection("SocialMedia");
  const now = new Date();
  let totalChannels = 0;
  for (const account of accounts) {
    if (!account?.accessToken) continue;
    const ytData = await fetchYouTubeData(account.accessToken);
    if (!ytData) continue;
    totalChannels += ytData.channels.length;

    const channelsForAccount = ytData.channels.map((c) => ({
      channelId: c.profile.id,
      title: c.profile.title,
      thumbnail: c.profile.thumbnails?.default?.url || null,
    }));
    // Keep the SocialAccounts doc fresh (channels list and basic display info).
    await accountsColl.updateOne(
      { _id: account._id },
      {
        $set: {
          platformUserId: account.platformUserId || String(channelsForAccount[0]?.channelId || "youtube"),
          username: channelsForAccount[0]?.title || account.username || "YouTube",
          profileImageUrl: channelsForAccount[0]?.thumbnail || account.profileImageUrl || null,
          channels: channelsForAccount,
          updatedAt: now,
        },
      }
    );

    for (const { profile, videos } of ytData.channels) {
      const analytics = await fetchYouTubeAnalytics(account.accessToken, profile.id).catch(() => null);
      await socialColl.updateOne(
        { userId, platform: "youtube", channelId: profile.id },
        {
          $set: {
            userId,
            username: appUsername,
            platform: "youtube",
            channelId: profile.id,
            profile,
            videos,
            insights: analytics || null,
            lastFetchedAt: now,
            updatedAt: now,
          },
        },
        { upsert: true }
      );
    }
  }
  return res.json({ ok: true, platform: "youtube", accounts: accounts.length, channels: totalChannels });
}
