import crypto from "crypto";
import { getDb } from "../../db.js";
import { upsertUser } from "../../lib/users.js";
import { runCommonChat } from "../../services/commonChat.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
// Request Data + Analytics read scopes, plus reply scope for posting comment replies.
const YOUTUBE_SCOPE =
  "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.force-ssl";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_ANALYTICS_BASE = "https://youtubeanalytics.googleapis.com/v2";
const STATE_TTL_MS = 10 * 60 * 1000;
const AUTO_REPLY_LIMIT = 3;
const COMMENT_THREAD_PAGE_SIZE = 50;
const REPLIES_PAGE_SIZE = 100;
const COMMENT_SCAN_MAX_PAGES = 4;
const REPLY_LOOKUP_MAX_PAGES = 5;
const AUTO_REPLY_MIN_DELAY_MS = 30 * 1000;
const AUTO_REPLY_MAX_DELAY_MS = 91 * 1000;
const WAIT_PROGRESS_TICK_MS = 1000;
const YOUTUBE_COMMENTS_COLLECTION = "YouTubeComments";
const YOUTUBE_COMMENT_RUNS_COLLECTION = "YouTubeCommentRuns";
const FALLBACK_REPLY_TEMPLATES = Object.freeze([
  "{viewerPrefix}Thanks for watching. If you enjoyed this, please subscribe to {channelName} for more.",
  "{viewerPrefix}Really appreciate your comment. Subscribe to {channelName} if you want more videos like this.",
  "{viewerPrefix}Glad you stopped by. A quick subscribe to {channelName} helps us keep posting.",
  "{viewerPrefix}Thanks for the support. Hit subscribe to {channelName} and stay tuned for the next one.",
  "{viewerPrefix}Love the energy in your comment. Subscribe to {channelName} for more fun moments.",
  "{viewerPrefix}Happy you are here. If this made your day, subscribe to {channelName}.",
  "{viewerPrefix}Thanks for spending time with us. Subscribe to {channelName} so you do not miss uploads.",
  "{viewerPrefix}You made our day with this comment. Please subscribe to {channelName} for more.",
  "{viewerPrefix}Appreciate you watching. Tap subscribe on {channelName} for the next video.",
  "{viewerPrefix}Big thanks for the love. Subscribe to {channelName} and join the community.",
  "{viewerPrefix}Great to see you here. Subscribe to {channelName} for more fresh videos.",
  "{viewerPrefix}Thanks for the comment and support. A subscribe to {channelName} means a lot.",
  "{viewerPrefix}We are glad you watched this one. Please subscribe to {channelName} for more.",
  "{viewerPrefix}Your support helps a lot. Hit subscribe to {channelName} for upcoming uploads.",
  "{viewerPrefix}Thanks for being here. If you liked it, subscribe to {channelName}.",
  "{viewerPrefix}Awesome comment. Subscribe to {channelName} so we can keep these coming.",
  "{viewerPrefix}Really grateful for your support. Please subscribe to {channelName} for more content.",
  "{viewerPrefix}Thanks for watching and commenting. Subscribe to {channelName} for your daily dose.",
  "{viewerPrefix}Glad this reached you. Hit subscribe to {channelName} and stay with us.",
  "{viewerPrefix}Your feedback is gold. Subscribe to {channelName} if you want more videos.",
  "{viewerPrefix}We appreciate you a lot. Please subscribe to {channelName} to support the channel.",
  "{viewerPrefix}Thanks for joining in. Subscribe to {channelName} and catch the next upload.",
  "{viewerPrefix}Happy to have you here. A quick subscribe to {channelName} goes a long way.",
  "{viewerPrefix}Thanks for showing love. Subscribe to {channelName} for more moments like this.",
  "{viewerPrefix}Great to read your comment. Please subscribe to {channelName} and stay tuned.",
  "{viewerPrefix}Appreciate you stopping by. Hit subscribe to {channelName} for what comes next.",
  "{viewerPrefix}Thanks for hanging out with us. Subscribe to {channelName} for more highlights.",
  "{viewerPrefix}Love that you watched this. Subscribe to {channelName} if you want more.",
  "{viewerPrefix}Your support means everything. Please subscribe to {channelName} for future videos.",
  "{viewerPrefix}Thanks for being part of this. Hit subscribe to {channelName} for more updates.",
  "{viewerPrefix}Really nice comment, thank you. Subscribe to {channelName} to keep the momentum going.",
  "{viewerPrefix}Glad you enjoyed this one. Subscribe to {channelName} and come back for more.",
  "{viewerPrefix}Thanks for watching till the end. Subscribe to {channelName} for the next drop.",
  "{viewerPrefix}You are the best. Please subscribe to {channelName} and keep supporting us.",
  "{viewerPrefix}We see you and appreciate you. Hit subscribe to {channelName} for more.",
  "{viewerPrefix}Thanks for this awesome comment. Subscribe to {channelName} for new videos soon.",
  "{viewerPrefix}So glad you are here with us. Subscribe to {channelName} and stay connected.",
  "{viewerPrefix}Thank you for the support. Please subscribe to {channelName} for more content.",
  "{viewerPrefix}Great to hear from you. Hit subscribe to {channelName} for future uploads.",
  "{viewerPrefix}Thanks for vibing with this video. Subscribe to {channelName} for more.",
  "{viewerPrefix}Your comment made us smile. Please subscribe to {channelName} and join us again.",
  "{viewerPrefix}We appreciate your time. Subscribe to {channelName} to help us grow.",
  "{viewerPrefix}Thanks for watching and sharing your thoughts. Hit subscribe to {channelName}.",
  "{viewerPrefix}Glad this connected with you. Subscribe to {channelName} for more episodes.",
  "{viewerPrefix}Huge thanks for your support. Please subscribe to {channelName} for upcoming videos.",
  "{viewerPrefix}Love your feedback. Subscribe to {channelName} if you want to see more.",
  "{viewerPrefix}Thanks for being part of our journey. Hit subscribe to {channelName}.",
  "{viewerPrefix}You are amazing for commenting. Please subscribe to {channelName} for more drops.",
  "{viewerPrefix}We are happy you enjoyed this. Subscribe to {channelName} and stay tuned.",
  "{viewerPrefix}Thanks again for watching. Hit subscribe to {channelName} and see you in the next one.",
]);

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

function resolveYouTubeAccount(accounts, { channelId, platformUserId }) {
  if (!Array.isArray(accounts) || accounts.length === 0) return null;
  const targetId = (platformUserId || channelId || "").trim();
  if (!targetId) return accounts[0];
  return (
    accounts.find(
      (acc) =>
        String(acc?.platformUserId || "") === targetId ||
        (Array.isArray(acc?.channels) && acc.channels.some((c) => String(c?.channelId || "") === targetId))
    ) || null
  );
}

function resolveYouTubeAccounts(accounts, { channelId, platformUserId }) {
  if (!Array.isArray(accounts) || accounts.length === 0) return [];
  const targetId = (platformUserId || channelId || "").trim();
  if (!targetId) return [...accounts];
  return accounts.filter(
    (acc) =>
      String(acc?.platformUserId || "") === targetId ||
      (Array.isArray(acc?.channels) && acc.channels.some((c) => String(c?.channelId || "") === targetId))
  );
}

function formatYouTubeApiError(status, rawText) {
  let message = `YouTube API error: ${status}`;
  try {
    const parsed = JSON.parse(rawText || "{}");
    const apiMessage = parsed?.error?.message;
    const reason = parsed?.error?.errors?.[0]?.reason;
    if (apiMessage) {
      message = `YouTube API error: ${apiMessage}`;
      if (reason) message += ` (${reason})`;
    }
  } catch {
    if (rawText) {
      message = `YouTube API error: ${status} - ${String(rawText).slice(0, 250)}`;
    }
  }
  if (status === 403) {
    message += " (missing reply scope likely. Reconnect YouTube to grant youtube.force-ssl)";
  }
  const err = new Error(message);
  err.statusCode = status;
  return err;
}

function isInsufficientPermissionError(err) {
  return Number(err?.statusCode) === 403 && /insufficientPermission/i.test(String(err?.message || ""));
}

async function refreshYouTubeAccessToken({ account, accountsColl }) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID not configured");
  if (!account?.refreshToken) throw new Error("No YouTube refresh token available; reconnect required");

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret || "",
      refresh_token: account.refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => "");
    throw formatYouTubeApiError(tokenRes.status, errText);
  }

  const tokenData = await tokenRes.json();
  const newAccessToken = tokenData.access_token;
  const newRefreshToken = tokenData.refresh_token || account.refreshToken;
  if (!newAccessToken) {
    throw new Error("YouTube refresh response missing access_token");
  }

  await accountsColl.updateOne(
    { _id: account._id },
    {
      $set: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        updatedAt: new Date(),
      },
    }
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

function buildReplyPrompt({ commentText, authorName, channelName }) {
  const clipped = commentText.length > 3000 ? commentText.slice(0, 3000) : commentText;
  return [
    "You are replying as a YouTube creator to a viewer comment.",
    "Write exactly one natural reply.",
    "",
    "Hard rules:",
    "- Reply in the same native language as the viewer comment.",
    "- First address the comment or question directly.",
    "- Keep the tone cool, friendly, and human.",
    "- Add a subtle call to subscribe to the channel.",
    "- Keep it short: 1-3 sentences and under 280 characters.",
    "- No markdown, no hashtags, no surrounding quotes.",
    "",
    `Channel name: ${channelName || "our channel"}`,
    `Viewer name: ${authorName || "viewer"}`,
    `Viewer comment: ${clipped}`,
    "",
    "Return only the final reply text.",
  ].join("\n");
}

function normalizeReplyText(text) {
  let value = typeof text === "string" ? text.trim() : "";
  value = value.replace(/^["'`]+/, "").replace(/["'`]+$/, "").trim();
  if (value.length > 280) {
    value = value.slice(0, 280).trim();
  }
  return value;
}

function buildViewerPrefix(authorName) {
  const value = String(authorName || "")
    .replace(/[\r\n\t]+/g, " ")
    .trim();
  if (!value) return "";
  return `${value.slice(0, 40)}, `;
}

function isLikelyLlmErrorText(text) {
  const value = String(text || "").trim();
  if (!value) return true;
  const lower = value.toLowerCase();
  if (lower.includes("resource exhausted") || lower.includes("quota") || lower.includes("rate limit")) {
    return true;
  }
  if (
    value.startsWith("{") &&
    (lower.includes("\"error\"") ||
      lower.includes("\"status\"") ||
      lower.includes("\"code\"") ||
      lower.includes("\"message\""))
  ) {
    return true;
  }
  return false;
}

function pickFallbackReply({ authorName, channelName }) {
  const templateIndex = randomIntInclusive(0, FALLBACK_REPLY_TEMPLATES.length - 1);
  const template = FALLBACK_REPLY_TEMPLATES[templateIndex] || FALLBACK_REPLY_TEMPLATES[0];
  const viewerPrefix = buildViewerPrefix(authorName);
  const rawReply = String(template || "")
    .replaceAll("{viewerPrefix}", viewerPrefix)
    .replaceAll("{channelName}", channelName || "our channel")
    .replace(/\s+/g, " ")
    .trim();
  const replyText = normalizeReplyText(rawReply);
  if (!replyText) {
    return {
      replyText: "Thanks for watching. Please subscribe for more videos.",
      templateIndex: 0,
      template: FALLBACK_REPLY_TEMPLATES[0],
    };
  }
  return {
    replyText,
    templateIndex,
    template,
  };
}

async function generateReplyWithFallback({ apiKey, prompt, authorName, channelName }) {
  try {
    const llmResult = await runCommonChat({
      apiKey,
      prompt,
    });
    const llmRawText = typeof llmResult?.text === "string" ? llmResult.text : "";
    if (isLikelyLlmErrorText(llmRawText)) {
      const fallback = pickFallbackReply({ authorName, channelName });
      return {
        replyText: fallback.replyText,
        source: "fallback",
        llmResult,
        llmError: serializeError(new Error("LLM returned error payload text")),
        fallbackTemplateIndex: fallback.templateIndex,
        fallbackTemplate: fallback.template,
      };
    }

    const replyText = normalizeReplyText(llmRawText);
    if (replyText) {
      return {
        replyText,
        source: "llm",
        llmResult,
        llmError: null,
        fallbackTemplateIndex: null,
        fallbackTemplate: null,
      };
    }

    const fallback = pickFallbackReply({ authorName, channelName });
    return {
      replyText: fallback.replyText,
      source: "fallback",
      llmResult,
      llmError: serializeError(new Error("LLM returned an empty reply")),
      fallbackTemplateIndex: fallback.templateIndex,
      fallbackTemplate: fallback.template,
    };
  } catch (err) {
    const fallback = pickFallbackReply({ authorName, channelName });
    return {
      replyText: fallback.replyText,
      source: "fallback",
      llmResult: null,
      llmError: serializeError(err),
      fallbackTemplateIndex: fallback.templateIndex,
      fallbackTemplate: fallback.template,
    };
  }
}

async function postYouTubeReply({ accessToken, parentCommentId, replyText }) {
  const res = await fetch(`${YOUTUBE_API_BASE}/comments?part=snippet`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      snippet: {
        parentId: parentCommentId,
        textOriginal: replyText,
      },
    }),
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    throw formatYouTubeApiError(res.status, raw);
  }

  return res.json();
}

async function fetchYouTubeCommentById({ accessToken, commentId }) {
  const res = await fetch(
    `${YOUTUBE_API_BASE}/comments?part=snippet&id=${encodeURIComponent(commentId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    throw formatYouTubeApiError(res.status, raw);
  }

  const data = await res.json();
  const item = Array.isArray(data?.items) ? data.items[0] : null;
  const snippet = item?.snippet || null;
  if (!snippet) return null;

  return {
    text: snippet.textOriginal || snippet.textDisplay || "",
    authorName: snippet.authorDisplayName || "",
    parentId: snippet.parentId || null,
    rawItem: item,
    rawResponse: data,
  };
}

async function listYouTubeCommentThreads({ accessToken, channelId, pageToken = "", maxResults = COMMENT_THREAD_PAGE_SIZE }) {
  const params = new URLSearchParams({
    part: "snippet,replies",
    allThreadsRelatedToChannelId: channelId,
    order: "time",
    textFormat: "plainText",
    maxResults: String(maxResults),
  });
  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(`${YOUTUBE_API_BASE}/commentThreads?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    throw formatYouTubeApiError(res.status, raw);
  }
  return res.json();
}

async function listYouTubeRepliesByParentId({ accessToken, parentCommentId, pageToken = "", maxResults = REPLIES_PAGE_SIZE }) {
  const params = new URLSearchParams({
    part: "snippet",
    parentId: parentCommentId,
    textFormat: "plainText",
    maxResults: String(maxResults),
  });
  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(`${YOUTUBE_API_BASE}/comments?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    throw formatYouTubeApiError(res.status, raw);
  }
  return res.json();
}

function mapTopLevelCommentFromThread(thread) {
  const topLevelComment = thread?.snippet?.topLevelComment;
  const topSnippet = topLevelComment?.snippet;
  if (!topLevelComment?.id || !topSnippet) return null;
  return {
    commentId: String(topLevelComment.id),
    commentText: topSnippet.textOriginal || topSnippet.textDisplay || "",
    authorName: topSnippet.authorDisplayName || "",
    authorChannelId: String(topSnippet.authorChannelId?.value || ""),
    publishedAt: topSnippet.publishedAt || null,
    updatedAt: topSnippet.updatedAt || null,
    videoId: topSnippet.videoId || null,
    canReply: thread?.snippet?.canReply !== false,
    totalReplyCount: Number(thread?.snippet?.totalReplyCount) || 0,
    repliesPreview: Array.isArray(thread?.replies?.comments) ? thread.replies.comments : [],
  };
}

function threadHasReplyFromChannel(thread, ownerChannelId) {
  const owner = String(ownerChannelId || "");
  if (!owner) return false;
  const replies = Array.isArray(thread?.replies?.comments) ? thread.replies.comments : [];
  return replies.some((reply) => String(reply?.snippet?.authorChannelId?.value || "") === owner);
}

function resolveTargetChannel(account, requestedChannelId) {
  const requested = String(requestedChannelId || "").trim();
  const channels = Array.isArray(account?.channels) ? account.channels : [];
  const fallbackId = String(account?.platformUserId || "");
  const matched = requested ? channels.find((c) => String(c?.channelId || "") === requested) : channels[0] || null;
  if (requested && !matched && requested !== fallbackId) {
    return { channelId: "", channelName: account?.username || account?.displayName || "our channel" };
  }
  return {
    channelId: requested || String(matched?.channelId || fallbackId),
    channelName: matched?.title || account?.username || account?.displayName || "our channel",
  };
}

function cloneForStorage(value) {
  if (value === null || value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function randomIntInclusive(min, max) {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function serializeError(err) {
  if (!err) return { message: "Unknown error" };
  return {
    name: err?.name || "Error",
    message: err?.message || "Unknown error",
    stack: typeof err?.stack === "string" ? err.stack : null,
    statusCode: Number.isFinite(Number(err?.statusCode)) ? Number(err.statusCode) : null,
  };
}

function sendSseEvent(res, eventName, data) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function waitWithProgress(waitMs, onTick) {
  const start = Date.now();
  while (true) {
    const elapsedMs = Date.now() - start;
    const remainingMs = Math.max(waitMs - elapsedMs, 0);
    if (remainingMs <= 0) break;
    if (typeof onTick === "function") {
      onTick({
        waitMs,
        elapsedMs,
        remainingMs,
      });
    }
    await sleep(Math.min(WAIT_PROGRESS_TICK_MS, remainingMs));
  }
}

async function persistYouTubeCommentRecord({
  commentsColl,
  userId,
  account,
  target,
  runId,
  topLevel,
  threadRaw,
  repliesLookupPages = [],
  hasOwnerReply = null,
  selectedForReply = false,
}) {
  if (!commentsColl || !topLevel?.commentId) return;
  const now = new Date();
  const commentId = String(topLevel.commentId);
  const replyState =
    hasOwnerReply === true
      ? "already_replied"
      : selectedForReply
        ? "queued"
        : "unreplied";

  await commentsColl.updateOne(
    { userId, channelId: target.channelId, commentId },
    {
      $set: {
        userId,
        platform: "youtube",
        channelId: target.channelId,
        channelName: target.channelName,
        platformUserId: String(account?.platformUserId || ""),
        commentId,
        threadId: String(threadRaw?.id || ""),
        topLevelCommentId: commentId,
        videoId: topLevel.videoId || null,
        author: {
          displayName: topLevel.authorName || "",
          channelId: topLevel.authorChannelId || "",
        },
        text: {
          original: topLevel.commentText || "",
          display: topLevel.commentText || "",
        },
        metadata: {
          canReply: topLevel.canReply,
          totalReplyCount: Number(topLevel.totalReplyCount) || 0,
          publishedAt: topLevel.publishedAt || null,
          updatedAt: topLevel.updatedAt || null,
        },
        raw: {
          thread: cloneForStorage(threadRaw),
          repliesLookupPages: cloneForStorage(repliesLookupPages),
        },
        lastScanRunId: runId,
        selectedForReply,
        hasOwnerReply,
        replyState,
        lastSeenAt: now,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        replyAttempts: [],
      },
    },
    { upsert: true }
  );
}

async function runYouTubeReplyJob({
  db,
  apiKey,
  userId,
  commentId = "",
  commentText = "",
  authorName = "",
  channelId = "",
  platformUserId = "",
  onProgress = () => {},
}) {
  const requestStartMs = Date.now();
  const mode = commentId ? "single" : "auto";
  const runId = crypto.randomUUID();
  const startedAt = new Date();
  const accountsColl = db.collection("SocialAccounts");
  const commentsColl = db.collection(YOUTUBE_COMMENTS_COLLECTION);
  const runsColl = db.collection(YOUTUBE_COMMENT_RUNS_COLLECTION);

  function emitProgress(event, persist = true) {
    const payload = {
      runId,
      mode,
      ts: new Date().toISOString(),
      ...event,
    };
    try {
      onProgress(payload);
    } catch {
      // Keep route flow resilient even if progress callback fails.
    }
    if (persist) {
      runsColl
        .updateOne(
          { runId },
          {
            $push: {
              events: {
                ...payload,
                ts: new Date(),
              },
            },
          }
        )
        .catch(() => {});
    }
  }

  await runsColl.insertOne({
    runId,
    platform: "youtube",
    mode,
    userId,
    request: {
      channelId: channelId || null,
      platformUserId: platformUserId || null,
      commentId: commentId || null,
      commentTextProvided: !!commentText,
      authorName: authorName || null,
    },
    limits: {
      autoReplyLimit: AUTO_REPLY_LIMIT,
      commentThreadPageSize: COMMENT_THREAD_PAGE_SIZE,
      repliesPageSize: REPLIES_PAGE_SIZE,
      scanMaxPages: COMMENT_SCAN_MAX_PAGES,
      delayMinMs: AUTO_REPLY_MIN_DELAY_MS,
      delayMaxMs: AUTO_REPLY_MAX_DELAY_MS,
    },
    scan: {
      pagesScanned: 0,
      commentsConsidered: 0,
      selectedComments: 0,
    },
    status: "running",
    startedAt,
    updatedAt: startedAt,
    events: [],
  });

  try {
  emitProgress({
    type: "job_started",
    percent: 3,
    message: "Starting YouTube comment reply job",
  });

  const accounts = await accountsColl.find({ userId, platform: "youtube" }).sort({ updatedAt: -1 }).toArray();
  if (!accounts?.length) {
    const err = new Error("YouTube account not connected for this user");
    err.statusCode = 404;
    throw err;
  }

  const matchingAccounts = resolveYouTubeAccounts(accounts, { channelId, platformUserId });
  if (!matchingAccounts.length) {
    const err = new Error("Matching YouTube account/channel not found for this user");
    err.statusCode = 404;
    throw err;
  }
  let account = matchingAccounts.find((acc) => !!acc?.accessToken) || matchingAccounts[0];
  if (!account.accessToken) {
    const err = new Error("YouTube access token missing. Reconnect account.");
    err.statusCode = 400;
    throw err;
  }

  let target = resolveTargetChannel(account, channelId);
  if (!target.channelId) {
    const err = new Error("Unable to resolve YouTube channel for replying.");
    err.statusCode = 400;
    throw err;
  }

  await runsColl.updateOne(
    { runId },
    {
      $set: {
        channel: {
          channelId: target.channelId,
          channelName: target.channelName,
          accountPlatformUserId: String(account?.platformUserId || ""),
        },
        updatedAt: new Date(),
      },
    }
  );

  emitProgress({
    type: "account_ready",
    percent: 10,
    message: `Connected channel: ${target.channelName}`,
    channelId: target.channelId,
  });

  let activeAccessToken = account.accessToken;
  function applyAccountContext(nextAccount) {
    account = nextAccount;
    activeAccessToken = nextAccount?.accessToken || "";
    target = resolveTargetChannel(nextAccount, target.channelId);
  }

  async function switchToAnotherAccount(reason) {
    const currentKey = String(account?._id || account?.platformUserId || "");
    const nextAccount = matchingAccounts.find(
      (acc) =>
        String(acc?._id || acc?.platformUserId || "") !== currentKey &&
        !!acc?.accessToken &&
        resolveTargetChannel(acc, target.channelId).channelId === target.channelId
    );
    if (!nextAccount) return false;
    applyAccountContext(nextAccount);
    emitProgress({
      type: "account_switched",
      percent: 12,
      message: "Switched to another connected YouTube token for this channel",
      reason,
      accountPlatformUserId: String(account?.platformUserId || ""),
      channelId: target.channelId,
    });
    await runsColl.updateOne(
      { runId },
      {
        $set: {
          channel: {
            channelId: target.channelId,
            channelName: target.channelName,
            accountPlatformUserId: String(account?.platformUserId || ""),
          },
          updatedAt: new Date(),
        },
      }
    );
    return true;
  }

  async function runWithFreshToken(operation, options = {}) {
    const allowScopeFallback = options?.allowScopeFallback === true;
    let scopeFallbackTried = false;

    while (true) {
      try {
        return await operation(activeAccessToken);
      } catch (err) {
        if (err?.statusCode === 401) {
          const refreshed = await refreshYouTubeAccessToken({ account, accountsColl });
          activeAccessToken = refreshed.accessToken;
          account.accessToken = refreshed.accessToken;
          account.refreshToken = refreshed.refreshToken;
          emitProgress({
            type: "token_refreshed",
            percent: 12,
            message: "Refreshed YouTube access token",
          });
          continue;
        }

        if (allowScopeFallback && !scopeFallbackTried && isInsufficientPermissionError(err)) {
          scopeFallbackTried = true;
          const switched = await switchToAnotherAccount("insufficient_permission");
          if (switched) {
            continue;
          }
        }

        throw err;
      }
    }
  }

  if (mode === "single") {
    let effectiveCommentText = commentText;
    let effectiveAuthorName = authorName;
    let parentCommentId = commentId;
    let fetchedRawComment = null;

    emitProgress({
      type: "single_comment_fetch",
      percent: 20,
      message: "Preparing single comment reply",
      commentId,
    });

    if (!effectiveCommentText) {
      const fetchedComment = await runWithFreshToken((token) =>
        fetchYouTubeCommentById({
          accessToken: token,
          commentId,
        })
      );
      if (!fetchedComment?.text?.trim()) {
        const err = new Error("Could not fetch comment text from YouTube for the provided commentId");
        err.statusCode = 404;
        throw err;
      }
      effectiveCommentText = fetchedComment.text.trim();
      if (!effectiveAuthorName) effectiveAuthorName = fetchedComment.authorName || "";
      if (fetchedComment.parentId) parentCommentId = fetchedComment.parentId;
      fetchedRawComment = fetchedComment;
    }

    const prompt = buildReplyPrompt({
      commentText: effectiveCommentText,
      authorName: effectiveAuthorName,
      channelName: target.channelName,
    });

    emitProgress({
      type: "llm_generating",
      percent: 45,
      message: "Generating reply",
      commentId,
    });

    const generatedReply = await generateReplyWithFallback({
      apiKey,
      prompt,
      authorName: effectiveAuthorName,
      channelName: target.channelName,
    });
    const replyText = normalizeReplyText(generatedReply?.replyText || "");
    if (!replyText) {
      const err = new Error("LLM returned an empty reply");
      err.statusCode = 502;
      throw err;
    }
    if (generatedReply?.source === "fallback") {
      emitProgress({
        type: "llm_fallback_used",
        percent: 58,
        message: "Gemini unavailable, using fallback reply template",
        commentId,
        fallbackTemplateIndex: generatedReply.fallbackTemplateIndex,
      });
    }

    emitProgress({
      type: "youtube_posting",
      percent: 75,
      message: "Posting reply to YouTube",
      commentId: parentCommentId,
    });

    const replyResource = await runWithFreshToken(
      (token) =>
        postYouTubeReply({
          accessToken: token,
          parentCommentId,
          replyText,
        }),
      { allowScopeFallback: true }
    );

    const now = new Date();
    await commentsColl.updateOne(
      { userId, channelId: target.channelId, commentId: parentCommentId },
      {
        $set: {
          userId,
          platform: "youtube",
          channelId: target.channelId,
          channelName: target.channelName,
          platformUserId: String(account?.platformUserId || ""),
          commentId: parentCommentId,
          author: {
            displayName: effectiveAuthorName || "",
          },
          text: {
            original: effectiveCommentText,
            display: effectiveCommentText,
          },
          raw: {
            fetchedComment: cloneForStorage(fetchedRawComment?.rawItem || null),
            fetchedCommentResponse: cloneForStorage(fetchedRawComment?.rawResponse || null),
            replyResource: cloneForStorage(replyResource),
          },
          replyState: "replied",
          repliedAt: now,
          lastReply: {
            runId,
            replyId: replyResource?.id || null,
            parentCommentId,
            text: replyText,
            source: generatedReply?.source || "llm",
            fallbackTemplateIndex:
              Number.isInteger(Number(generatedReply?.fallbackTemplateIndex))
                ? Number(generatedReply.fallbackTemplateIndex)
                : null,
            usage: cloneForStorage(generatedReply?.llmResult?.usage || null),
            llmError: cloneForStorage(generatedReply?.llmError || null),
            prompt,
            postedAt: now,
          },
          lastSeenAt: now,
          updatedAt: now,
        },
        $push: {
          replyAttempts: {
            attemptId: crypto.randomUUID(),
            runId,
            mode: "single",
            parentCommentId,
            commentId: parentCommentId,
            startedAt: startedAt,
            endedAt: now,
            status: "posted",
            prompt,
            replySource: generatedReply?.source || "llm",
            fallbackTemplateIndex:
              Number.isInteger(Number(generatedReply?.fallbackTemplateIndex))
                ? Number(generatedReply.fallbackTemplateIndex)
                : null,
            llmRawText: generatedReply?.llmResult?.text || "",
            llmUsage: cloneForStorage(generatedReply?.llmResult?.usage || null),
            llmError: cloneForStorage(generatedReply?.llmError || null),
            replyText,
            replyResource: cloneForStorage(replyResource),
          },
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    const singleResult = {
      ok: true,
      runId,
      mode: "single",
      platform: "youtube",
      userId,
      channelId: target.channelId,
      sourceComment: {
        commentId,
        commentText: effectiveCommentText,
        authorName: effectiveAuthorName || null,
      },
      parentCommentId,
      replyId: replyResource?.id || null,
      replyText,
      replySource: generatedReply?.source || "llm",
      fallbackTemplateIndex:
        Number.isInteger(Number(generatedReply?.fallbackTemplateIndex))
          ? Number(generatedReply.fallbackTemplateIndex)
          : null,
      postedAt: now.toISOString(),
    };

    await runsColl.updateOne(
      { runId },
      {
        $set: {
          status: "completed",
          result: cloneForStorage(singleResult),
          completedAt: now,
          durationMs: Date.now() - requestStartMs,
          updatedAt: now,
        },
      }
    );

    emitProgress({
      type: "job_completed",
      percent: 100,
      message: "Reply posted",
      summary: {
        postedCount: 1,
        failedCount: 0,
      },
    });

    return singleResult;
  }

  // Auto mode: scan + select unreplied comments.
  const selectedComments = [];
  let pageToken = "";
  let pagesScanned = 0;
  let commentsConsidered = 0;

  while (selectedComments.length < AUTO_REPLY_LIMIT && pagesScanned < COMMENT_SCAN_MAX_PAGES) {
    const pageIndex = pagesScanned + 1;
    emitProgress({
      type: "scan_page_start",
      percent: Math.min(33, 12 + pageIndex * 5),
      message: `Scanning comments page ${pageIndex}/${COMMENT_SCAN_MAX_PAGES}`,
      pageIndex,
    });

    const threadResp = await runWithFreshToken((token) =>
      listYouTubeCommentThreads({
        accessToken: token,
        channelId: target.channelId,
        pageToken,
        maxResults: COMMENT_THREAD_PAGE_SIZE,
      })
    );
    const threads = Array.isArray(threadResp?.items) ? threadResp.items : [];
    if (!threads.length) break;

    await runsColl.updateOne(
      { runId },
      {
        $push: {
          scanPages: {
            pageIndex,
            requestedPageToken: pageToken || null,
            returnedNextPageToken: String(threadResp?.nextPageToken || "") || null,
            itemCount: threads.length,
            fetchedAt: new Date(),
            raw: cloneForStorage(threadResp),
          },
        },
      }
    );

    for (const thread of threads) {
      if (selectedComments.length >= AUTO_REPLY_LIMIT) break;
      const top = mapTopLevelCommentFromThread(thread);
      if (!top) continue;
      commentsConsidered += 1;
      if (!top.canReply) {
        await persistYouTubeCommentRecord({
          commentsColl,
          userId,
          account,
          target,
          runId,
          topLevel: top,
          threadRaw: thread,
          hasOwnerReply: null,
          selectedForReply: false,
        });
        continue;
      }
      if (!top.commentText.trim()) {
        await persistYouTubeCommentRecord({
          commentsColl,
          userId,
          account,
          target,
          runId,
          topLevel: top,
          threadRaw: thread,
          hasOwnerReply: null,
          selectedForReply: false,
        });
        continue;
      }
      if (top.authorChannelId && top.authorChannelId === target.channelId) {
        await persistYouTubeCommentRecord({
          commentsColl,
          userId,
          account,
          target,
          runId,
          topLevel: top,
          threadRaw: thread,
          hasOwnerReply: true,
          selectedForReply: false,
        });
        continue;
      }

      let hasOwnerReply = threadHasReplyFromChannel(thread, target.channelId);
      const repliesLookupPages = [];

      if (!hasOwnerReply && top.totalReplyCount > 0) {
        let replyPageToken = "";
        let replyPagesScanned = 0;
        while (!hasOwnerReply && replyPagesScanned < REPLY_LOOKUP_MAX_PAGES) {
          const repliesResp = await runWithFreshToken((token) =>
            listYouTubeRepliesByParentId({
              accessToken: token,
              parentCommentId: top.commentId,
              pageToken: replyPageToken,
              maxResults: REPLIES_PAGE_SIZE,
            })
          );
          const replies = Array.isArray(repliesResp?.items) ? repliesResp.items : [];
          repliesLookupPages.push({
            pageIndex: replyPagesScanned + 1,
            requestedPageToken: replyPageToken || null,
            returnedNextPageToken: String(repliesResp?.nextPageToken || "") || null,
            itemCount: replies.length,
            raw: cloneForStorage(repliesResp),
          });
          hasOwnerReply = replies.some(
            (reply) => String(reply?.snippet?.authorChannelId?.value || "") === target.channelId
          );
          replyPageToken = !hasOwnerReply ? String(repliesResp?.nextPageToken || "") : "";
          if (!replyPageToken) break;
          replyPagesScanned += 1;
        }
      }

      const selectedForReply = !hasOwnerReply;

      await persistYouTubeCommentRecord({
        commentsColl,
        userId,
        account,
        target,
        runId,
        topLevel: top,
        threadRaw: thread,
        repliesLookupPages,
        hasOwnerReply,
        selectedForReply,
      });

      if (hasOwnerReply) continue;

      selectedComments.push({
        commentId: top.commentId,
        commentText: top.commentText.trim(),
        authorName: top.authorName || "",
        publishedAt: top.publishedAt,
        videoId: top.videoId,
        rawThread: cloneForStorage(thread),
        repliesLookupPages,
      });
    }

    pageToken = String(threadResp?.nextPageToken || "");
    pagesScanned += 1;
    if (!pageToken) break;
  }

  await runsColl.updateOne(
    { runId },
    {
      $set: {
        scan: {
          pagesScanned,
          commentsConsidered,
          selectedComments: selectedComments.length,
        },
        selectedComments: cloneForStorage(
          selectedComments.map((c) => ({
            commentId: c.commentId,
            commentText: c.commentText,
            authorName: c.authorName,
            publishedAt: c.publishedAt,
            videoId: c.videoId,
            repliesLookupPages: c.repliesLookupPages,
          }))
        ),
        updatedAt: new Date(),
      },
    }
  );

  emitProgress({
    type: "scan_completed",
    percent: 35,
    message: `Found ${selectedComments.length} unreplied comments`,
    commentsConsidered,
    selectedCount: selectedComments.length,
  });

  if (!selectedComments.length) {
    const emptyResult = {
      ok: true,
      runId,
      mode: "auto",
      platform: "youtube",
      userId,
      channelId: target.channelId,
      limitApplied: AUTO_REPLY_LIMIT,
      commentsConsidered,
      postedCount: 0,
      items: [],
    };

    await runsColl.updateOne(
      { runId },
      {
        $set: {
          status: "completed",
          result: cloneForStorage(emptyResult),
          completedAt: new Date(),
          durationMs: Date.now() - requestStartMs,
          updatedAt: new Date(),
        },
      }
    );

    emitProgress({
      type: "job_completed",
      percent: 100,
      message: "No unreplied comments found",
      summary: { postedCount: 0, failedCount: 0, commentsConsidered },
    });

    return emptyResult;
  }

  const items = [];
  const totalToProcess = Math.min(selectedComments.length, AUTO_REPLY_LIMIT);

  for (let idx = 0; idx < totalToProcess; idx += 1) {
    const source = selectedComments[idx];
    const sequence = idx + 1;
    const progressStart = 35 + Math.round(((sequence - 1) / totalToProcess) * 55);
    const progressDone = 35 + Math.round((sequence / totalToProcess) * 55);

    emitProgress({
      type: "comment_started",
      percent: progressStart,
      message: `Replying to comment ${sequence}/${totalToProcess}`,
      currentIndex: sequence,
      total: totalToProcess,
      comment: {
        commentId: source.commentId,
        authorName: source.authorName || null,
        commentText: source.commentText,
        videoId: source.videoId || null,
      },
    });

    const attemptStartedAt = new Date();
    const prompt = buildReplyPrompt({
      commentText: source.commentText,
      authorName: source.authorName,
      channelName: target.channelName,
    });
    let generatedReply = null;
    let attemptedReplyText = "";

    try {
      generatedReply = await generateReplyWithFallback({
        apiKey,
        prompt,
        authorName: source.authorName,
        channelName: target.channelName,
      });
      const replyText = normalizeReplyText(generatedReply?.replyText || "");
      if (!replyText) {
        throw new Error("LLM returned an empty reply");
      }
      attemptedReplyText = replyText;
      if (generatedReply?.source === "fallback") {
        emitProgress({
          type: "llm_fallback_used",
          percent: Math.min(progressStart + 12, progressDone),
          message: `Gemini unavailable, using fallback template for comment ${sequence}/${totalToProcess}`,
          currentIndex: sequence,
          total: totalToProcess,
          commentId: source.commentId,
          fallbackTemplateIndex: generatedReply.fallbackTemplateIndex,
        });
      }

      const replyResource = await runWithFreshToken(
        (token) =>
          postYouTubeReply({
            accessToken: token,
            parentCommentId: source.commentId,
            replyText,
          }),
        { allowScopeFallback: true }
      );

      const postedAt = new Date();
      const postedItem = {
        commentId: source.commentId,
        commentText: source.commentText,
        authorName: source.authorName || "",
        publishedAt: source.publishedAt || null,
        videoId: source.videoId || null,
        status: "posted",
        replyId: replyResource?.id || null,
        replyText,
        replySource: generatedReply?.source || "llm",
        fallbackTemplateIndex:
          Number.isInteger(Number(generatedReply?.fallbackTemplateIndex))
            ? Number(generatedReply.fallbackTemplateIndex)
            : null,
        postedAt: postedAt.toISOString(),
      };
      items.push(postedItem);

      await commentsColl.updateOne(
        { userId, channelId: target.channelId, commentId: source.commentId },
        {
          $set: {
            userId,
            platform: "youtube",
            channelId: target.channelId,
            channelName: target.channelName,
            platformUserId: String(account?.platformUserId || ""),
            commentId: source.commentId,
            text: {
              original: source.commentText,
              display: source.commentText,
            },
            author: {
              displayName: source.authorName || "",
            },
            videoId: source.videoId || null,
            replyState: "replied",
            selectedForReply: false,
            repliedAt: postedAt,
            lastSeenAt: postedAt,
            lastReply: {
              runId,
              replyId: replyResource?.id || null,
              parentCommentId: source.commentId,
              text: replyText,
              source: generatedReply?.source || "llm",
              fallbackTemplateIndex:
                Number.isInteger(Number(generatedReply?.fallbackTemplateIndex))
                  ? Number(generatedReply.fallbackTemplateIndex)
                  : null,
              prompt,
              llmUsage: cloneForStorage(generatedReply?.llmResult?.usage || null),
              llmError: cloneForStorage(generatedReply?.llmError || null),
              rawReplyResource: cloneForStorage(replyResource),
              postedAt,
            },
            updatedAt: postedAt,
          },
          $push: {
            replyAttempts: {
              attemptId: crypto.randomUUID(),
              runId,
              mode: "auto",
              sequence,
              startedAt: attemptStartedAt,
              endedAt: postedAt,
              status: "posted",
              commentId: source.commentId,
              prompt,
              replySource: generatedReply?.source || "llm",
              fallbackTemplateIndex:
                Number.isInteger(Number(generatedReply?.fallbackTemplateIndex))
                  ? Number(generatedReply.fallbackTemplateIndex)
                  : null,
              llmRawText: generatedReply?.llmResult?.text || "",
              llmUsage: cloneForStorage(generatedReply?.llmResult?.usage || null),
              llmError: cloneForStorage(generatedReply?.llmError || null),
              replyText,
              rawReplyResource: cloneForStorage(replyResource),
            },
          },
          $setOnInsert: {
            createdAt: postedAt,
          },
        },
        { upsert: true }
      );

      emitProgress({
        type: "comment_completed",
        percent: progressDone,
        message: `Posted reply for comment ${sequence}/${totalToProcess}`,
        currentIndex: sequence,
        total: totalToProcess,
        item: postedItem,
      });
    } catch (err) {
      const failedAt = new Date();
      const failedItem = {
        commentId: source.commentId,
        commentText: source.commentText,
        authorName: source.authorName || "",
        publishedAt: source.publishedAt || null,
        videoId: source.videoId || null,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      };
      items.push(failedItem);

      await commentsColl.updateOne(
        { userId, channelId: target.channelId, commentId: source.commentId },
        {
          $set: {
            userId,
            platform: "youtube",
            channelId: target.channelId,
            channelName: target.channelName,
            platformUserId: String(account?.platformUserId || ""),
            commentId: source.commentId,
            text: {
              original: source.commentText,
              display: source.commentText,
            },
            author: {
              displayName: source.authorName || "",
            },
            videoId: source.videoId || null,
            replyState: "failed",
            selectedForReply: false,
            lastSeenAt: failedAt,
            lastReplyError: {
              runId,
              at: failedAt,
              error: serializeError(err),
            },
            updatedAt: failedAt,
          },
          $push: {
            replyAttempts: {
              attemptId: crypto.randomUUID(),
              runId,
              mode: "auto",
              sequence,
              startedAt: attemptStartedAt,
              endedAt: failedAt,
              status: "failed",
              commentId: source.commentId,
              prompt,
              replySource: generatedReply?.source || null,
              fallbackTemplateIndex:
                Number.isInteger(Number(generatedReply?.fallbackTemplateIndex))
                  ? Number(generatedReply.fallbackTemplateIndex)
                  : null,
              llmRawText: generatedReply?.llmResult?.text || "",
              llmUsage: cloneForStorage(generatedReply?.llmResult?.usage || null),
              llmError: cloneForStorage(generatedReply?.llmError || null),
              attemptedReplyText: attemptedReplyText || null,
              error: serializeError(err),
            },
          },
          $setOnInsert: {
            createdAt: failedAt,
          },
        },
        { upsert: true }
      );

      emitProgress({
        type: "comment_completed",
        percent: progressDone,
        message: `Failed to reply comment ${sequence}/${totalToProcess}`,
        currentIndex: sequence,
        total: totalToProcess,
        item: failedItem,
      });
    }

    if (sequence < totalToProcess) {
      const waitMs = randomIntInclusive(AUTO_REPLY_MIN_DELAY_MS, AUTO_REPLY_MAX_DELAY_MS);
      const waitStartedPercent = progressDone;
      emitProgress({
        type: "wait_started",
        percent: waitStartedPercent,
        message: "Waiting before next reply to look human",
        waitMs,
        currentIndex: sequence,
        total: totalToProcess,
      });
      await waitWithProgress(waitMs, ({ elapsedMs, remainingMs }) => {
        const nextPercent = Math.min(progressDone + 3, progressDone + Math.round((elapsedMs / waitMs) * 3));
        emitProgress(
          {
            type: "wait_tick",
            percent: nextPercent,
            message: "Taking longer to seem like a human",
            waitMs,
            elapsedMs,
            remainingMs,
            currentIndex: sequence,
            total: totalToProcess,
          },
          false
        );
      });
      emitProgress({
        type: "wait_completed",
        percent: Math.min(progressDone + 3, 95),
        message: "Proceeding to next comment",
        currentIndex: sequence,
        total: totalToProcess,
      });
    }
  }

  const postedCount = items.filter((item) => item.status === "posted").length;
  const failedCount = items.length - postedCount;
  const finalResult = {
    ok: true,
    runId,
    mode: "auto",
    platform: "youtube",
    userId,
    channelId: target.channelId,
    limitApplied: AUTO_REPLY_LIMIT,
    commentsConsidered,
    postedCount,
    failedCount,
    items,
  };

  await runsColl.updateOne(
    { runId },
    {
      $set: {
        status: "completed",
        result: cloneForStorage(finalResult),
        completedAt: new Date(),
        durationMs: Date.now() - requestStartMs,
        updatedAt: new Date(),
      },
    }
  );

  emitProgress({
    type: "job_completed",
    percent: 100,
    message: "YouTube reply job completed",
    summary: {
      postedCount,
      failedCount,
      commentsConsidered,
      selectedCount: totalToProcess,
    },
  });

  return finalResult;
  } catch (err) {
    const failedAt = new Date();
    await runsColl
      .updateOne(
        { runId },
        {
          $set: {
            status: "failed",
            failedAt,
            durationMs: Date.now() - requestStartMs,
            error: serializeError(err),
            updatedAt: failedAt,
          },
        }
      )
      .catch(() => {});
    emitProgress({
      type: "job_failed",
      percent: 100,
      message: err instanceof Error ? err.message : "Job failed",
      error: serializeError(err),
    });
    throw err;
  }
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
    const ytAnalyticsColl = db.collection("YouTubeAnalytics");
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
      if (analytics) {
        await ytAnalyticsColl.updateOne(
          { userId, channelId: profile.id },
          {
            $set: {
              userId,
              channelId: profile.id,
              username: appUsername,
              profileTitle: profile.title || null,
              analytics,
              lastFetchedAt: now,
              updatedAt: now,
            },
          },
          { upsert: true }
        );
      }
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
  const ytAnalyticsColl = db.collection("YouTubeAnalytics");
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
      if (analytics) {
        await ytAnalyticsColl.updateOne(
          { userId, channelId: profile.id },
          {
            $set: {
              userId,
              channelId: profile.id,
              username: appUsername,
              profileTitle: profile.title || null,
              analytics,
              lastFetchedAt: now,
              updatedAt: now,
            },
          },
          { upsert: true }
        );
      }
    }
  }
  return res.json({ ok: true, platform: "youtube", accounts: accounts.length, channels: totalChannels });
}

/** POST /api/social/youtube/reply — generate and post an LLM reply for a YouTube comment. */
export async function replyToYoutubeComment(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const userId = (req.body?.userId ?? req.query?.userId ?? "").trim();
  const commentId = (req.body?.commentId ?? "").trim();
  const commentTextRaw = req.body?.commentText ?? req.body?.comment ?? "";
  const commentText = typeof commentTextRaw === "string" ? commentTextRaw.trim() : "";
  const authorName = typeof req.body?.authorName === "string" ? req.body.authorName.trim() : "";
  const channelId = typeof req.body?.channelId === "string" ? req.body.channelId.trim() : "";
  const platformUserId = typeof req.body?.platformUserId === "string" ? req.body.platformUserId.trim() : "";

  if (!userId) {
    return res.status(400).json({
      error: "userId is required",
    });
  }

  try {
    const db = await getDb();
    const result = await runYouTubeReplyJob({
      db,
      apiKey,
      userId,
      commentId,
      commentText,
      authorName,
      channelId,
      platformUserId,
    });
    return res.json(result);
  } catch (err) {
    console.error("YouTube comment reply error:", err);
    const status = Number(err?.statusCode);
    const safeStatus = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
    return res.status(safeStatus).json({
      error: "Failed to create/post YouTube reply",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

/** GET /api/social/youtube/reply/stream — stream progress updates while running YouTube comment reply job. */
export async function replyToYoutubeCommentStream(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const userId = (req.query?.userId ?? "").trim();
  const commentId = (req.query?.commentId ?? "").trim();
  const commentText = typeof req.query?.commentText === "string" ? req.query.commentText.trim() : "";
  const authorName = typeof req.query?.authorName === "string" ? req.query.authorName.trim() : "";
  const channelId = typeof req.query?.channelId === "string" ? req.query.channelId.trim() : "";
  const platformUserId = typeof req.query?.platformUserId === "string" ? req.query.platformUserId.trim() : "";

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  let streamClosed = false;
  req.on("close", () => {
    streamClosed = true;
  });

  const keepAlive = setInterval(() => {
    if (streamClosed) return;
    try {
      sendSseEvent(res, "keepalive", { ts: new Date().toISOString() });
    } catch {
      // Ignore transport write errors.
    }
  }, 15000);

  const safeSend = (eventName, payload) => {
    if (streamClosed) return;
    try {
      sendSseEvent(res, eventName, payload);
    } catch {
      // Ignore transport write errors.
    }
  };

  try {
    const db = await getDb();
    safeSend("progress", {
      type: "stream_connected",
      ts: new Date().toISOString(),
      message: "Realtime progress stream connected",
      percent: 1,
    });

    const result = await runYouTubeReplyJob({
      db,
      apiKey,
      userId,
      commentId,
      commentText,
      authorName,
      channelId,
      platformUserId,
      onProgress: (event) => safeSend("progress", event),
    });

    safeSend("done", result);
  } catch (err) {
    safeSend("failed", {
      error: "Failed to create/post YouTube reply",
      message: err instanceof Error ? err.message : "Unknown error",
      details: serializeError(err),
    });
  } finally {
    clearInterval(keepAlive);
    if (!streamClosed) {
      res.end();
    }
  }
}
