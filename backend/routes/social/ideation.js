import { getDb } from "../../db.js";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

const IDEATION_COLLECTION = "IdeationEngine";
const PLATFORM = "youtube";
const MAX_TRACKED_CHANNELS = 20;
const RECENT_VIDEOS_PER_CHANNEL = 6;
const SUGGESTION_LIMIT = 12;
const SEARCH_LIMIT = 15;
const FEED_LIMIT = 60;

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "you",
  "your",
  "our",
  "are",
  "was",
  "were",
  "how",
  "why",
  "what",
  "when",
  "where",
  "about",
  "into",
  "onto",
  "new",
  "best",
  "top",
  "more",
  "video",
  "videos",
  "shorts",
  "youtube",
]);

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function cloneForStorage(value) {
  if (value == null) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
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
    if (rawText) message = `YouTube API error: ${status} - ${String(rawText).slice(0, 250)}`;
  }
  const err = new Error(message);
  err.statusCode = status;
  return err;
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHandle(channelCustomUrl) {
  const custom = normalizeText(channelCustomUrl);
  if (!custom) return "";
  if (custom.startsWith("@")) return custom;
  return "";
}

function toUtcMeta(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      publishedAt: null,
      postingHourUtc: null,
      postingWeekdayUtc: null,
      postingDateUtc: null,
      postingTimeUtc: null,
    };
  }
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  return {
    publishedAt: date.toISOString(),
    postingHourUtc: date.getUTCHours(),
    postingWeekdayUtc: weekdays[date.getUTCDay()] || null,
    postingDateUtc: `${yyyy}-${mm}-${dd}`,
    postingTimeUtc: `${hh}:${mi}`,
  };
}

function average(numbers) {
  const values = Array.isArray(numbers) ? numbers.filter((n) => Number.isFinite(Number(n))) : [];
  if (!values.length) return 0;
  const sum = values.reduce((acc, item) => acc + Number(item), 0);
  return Number((sum / values.length).toFixed(2));
}

function chunkArray(items, chunkSize) {
  const list = Array.isArray(items) ? items : [];
  const size = Math.max(1, Number(chunkSize) || 1);
  const chunks = [];
  for (let idx = 0; idx < list.length; idx += size) {
    chunks.push(list.slice(idx, idx + size));
  }
  return chunks;
}

function resolveYouTubeAccount(accounts, requestedChannelId) {
  const list = Array.isArray(accounts) ? accounts : [];
  if (!list.length) return null;
  const requested = normalizeText(requestedChannelId);
  if (!requested) return list.find((acc) => !!acc?.accessToken) || list[0] || null;

  return (
    list.find((acc) => {
      if (String(acc?.platformUserId || "") === requested) return true;
      const channels = Array.isArray(acc?.channels) ? acc.channels : [];
      return channels.some((channel) => String(channel?.channelId || "") === requested);
    }) || null
  );
}

function resolveTargetChannel(account, requestedChannelId) {
  const requested = normalizeText(requestedChannelId);
  const channels = Array.isArray(account?.channels) ? account.channels : [];

  if (requested) {
    const match = channels.find((channel) => String(channel?.channelId || "") === requested);
    if (match) {
      return {
        channelId: requested,
        channelName: normalizeText(match?.title || account?.username || account?.displayName || requested),
      };
    }
    if (String(account?.platformUserId || "") === requested) {
      return {
        channelId: requested,
        channelName: normalizeText(account?.username || account?.displayName || requested),
      };
    }
    return null;
  }

  if (channels.length > 0) {
    return {
      channelId: String(channels[0]?.channelId || ""),
      channelName: normalizeText(channels[0]?.title || account?.username || account?.displayName || "YouTube"),
    };
  }

  if (account?.platformUserId) {
    return {
      channelId: String(account.platformUserId),
      channelName: normalizeText(account?.username || account?.displayName || account.platformUserId),
    };
  }

  return null;
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
  if (!newAccessToken) throw new Error("YouTube refresh response missing access_token");

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

async function runWithFreshToken({ account, accountsColl }, operation) {
  let activeAccessToken = account.accessToken;
  while (true) {
    try {
      return await operation(activeAccessToken);
    } catch (err) {
      if (Number(err?.statusCode) === 401) {
        const refreshed = await refreshYouTubeAccessToken({ account, accountsColl });
        activeAccessToken = refreshed.accessToken;
        account.accessToken = refreshed.accessToken;
        account.refreshToken = refreshed.refreshToken;
        continue;
      }
      throw err;
    }
  }
}

async function youtubeGet({ accessToken, path, params }) {
  const search = new URLSearchParams(params || {});
  const res = await fetch(`${YOUTUBE_API_BASE}${path}?${search.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    throw formatYouTubeApiError(res.status, raw);
  }
  return res.json();
}

async function getChannelDetailsByIds({ accessToken, channelIds }) {
  const ids = [];
  const seen = new Set();
  for (const id of channelIds || []) {
    const channelId = normalizeText(id);
    if (!channelId || seen.has(channelId)) continue;
    seen.add(channelId);
    ids.push(channelId);
  }

  const map = new Map();
  for (const batch of chunkArray(ids, 50)) {
    if (!batch.length) continue;
    const response = await youtubeGet({
      accessToken,
      path: "/channels",
      params: {
        part: "snippet,statistics,contentDetails,status",
        id: batch.join(","),
        maxResults: "50",
      },
    });

    const items = Array.isArray(response?.items) ? response.items : [];
    for (const item of items) {
      const channelId = normalizeText(item?.id);
      if (!channelId) continue;
      map.set(channelId, item);
    }
  }

  return map;
}

async function getRecentUploadsForChannel({ accessToken, uploadsPlaylistId, limit = RECENT_VIDEOS_PER_CHANNEL }) {
  if (!uploadsPlaylistId) return [];

  const playlist = await youtubeGet({
    accessToken,
    path: "/playlistItems",
    params: {
      part: "snippet,contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: String(Math.max(1, Math.min(50, limit))),
    },
  });

  const playlistItems = Array.isArray(playlist?.items) ? playlist.items : [];
  const videoIds = playlistItems
    .map((item) => normalizeText(item?.contentDetails?.videoId))
    .filter(Boolean);
  if (!videoIds.length) return [];

  const videosResponse = await youtubeGet({
    accessToken,
    path: "/videos",
    params: {
      part: "snippet,statistics,contentDetails,status",
      id: videoIds.join(","),
      maxResults: String(videoIds.length),
    },
  });

  const videos = Array.isArray(videosResponse?.items) ? videosResponse.items : [];
  const videoMap = new Map();
  for (const video of videos) {
    const videoId = normalizeText(video?.id);
    if (!videoId) continue;
    videoMap.set(videoId, video);
  }

  return playlistItems
    .map((item) => {
      const videoId = normalizeText(item?.contentDetails?.videoId);
      if (!videoId) return null;
      const video = videoMap.get(videoId) || null;
      const snippet = video?.snippet || {};
      const stats = video?.statistics || {};
      const publishedRaw = snippet?.publishedAt || item?.contentDetails?.videoPublishedAt || item?.snippet?.publishedAt || null;
      const utcMeta = toUtcMeta(publishedRaw);

      const views = safeNumber(stats?.viewCount);
      const likes = safeNumber(stats?.likeCount);
      const comments = safeNumber(stats?.commentCount);
      const engagement = likes + comments;

      return {
        videoId,
        title: normalizeText(snippet?.title || item?.snippet?.title || ""),
        description: normalizeText(snippet?.description || ""),
        channelId: normalizeText(snippet?.channelId || ""),
        channelTitle: normalizeText(snippet?.channelTitle || ""),
        thumbnail:
          snippet?.thumbnails?.medium?.url ||
          snippet?.thumbnails?.high?.url ||
          snippet?.thumbnails?.default?.url ||
          null,
        url: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
        duration: normalizeText(video?.contentDetails?.duration || ""),
        views,
        likes,
        comments,
        engagement,
        ...utcMeta,
      };
    })
    .filter(Boolean);
}

function computeAverageUploadGapDays(videos) {
  const sorted = (Array.isArray(videos) ? videos : [])
    .map((video) => new Date(video?.publishedAt || 0).getTime())
    .filter((time) => Number.isFinite(time) && time > 0)
    .sort((a, b) => b - a);

  if (sorted.length < 2) return 0;
  const gaps = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const diffDays = (sorted[i] - sorted[i + 1]) / (1000 * 60 * 60 * 24);
    if (diffDays > 0) gaps.push(diffDays);
  }
  return gaps.length ? Number((gaps.reduce((sum, item) => sum + item, 0) / gaps.length).toFixed(2)) : 0;
}

function mapChannelSummary(channel) {
  const snippet = channel?.snippet || {};
  const stats = channel?.statistics || {};
  return {
    channelId: normalizeText(channel?.id || ""),
    title: normalizeText(snippet?.title || ""),
    description: normalizeText(snippet?.description || ""),
    customUrl: normalizeText(snippet?.customUrl || ""),
    handle: extractHandle(snippet?.customUrl || ""),
    publishedAt: snippet?.publishedAt || null,
    thumbnail:
      snippet?.thumbnails?.medium?.url ||
      snippet?.thumbnails?.high?.url ||
      snippet?.thumbnails?.default?.url ||
      null,
    uploadsPlaylistId: normalizeText(channel?.contentDetails?.relatedPlaylists?.uploads || ""),
    stats: {
      subscriberCount: safeNumber(stats?.subscriberCount),
      viewCount: safeNumber(stats?.viewCount),
      videoCount: safeNumber(stats?.videoCount),
    },
  };
}

function computeChannelSnapshot(channelSummary, recentVideos) {
  const videos = Array.isArray(recentVideos) ? recentVideos : [];
  const views = videos.map((video) => safeNumber(video?.views));
  const engagement = videos.map((video) => safeNumber(video?.engagement));
  const avgViews = average(views);
  const avgEngagement = average(engagement);
  const totalViews = views.reduce((sum, value) => sum + value, 0);
  const totalEngagement = engagement.reduce((sum, value) => sum + value, 0);
  const engagementRate = avgViews > 0 ? Number(((avgEngagement / avgViews) * 100).toFixed(2)) : 0;
  const averageUploadGapDays = computeAverageUploadGapDays(videos);

  return {
    ...channelSummary,
    recent: {
      videoCount: videos.length,
      totalViews,
      totalEngagement,
      avgViews,
      avgEngagement,
      engagementRate,
      averageUploadGapDays,
      latestPublishedAt: videos[0]?.publishedAt || null,
    },
  };
}

function extractKeywordsFromText(text) {
  const words = normalizeText(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => word.length >= 3)
    .filter((word) => !STOPWORDS.has(word));
  return words;
}

function rankTokens(tokenGroups, limit = 20) {
  const frequency = new Map();
  const groups = Array.isArray(tokenGroups) ? tokenGroups : [];

  for (const group of groups) {
    const weight = Math.max(1, safeNumber(group?.weight || 1));
    const tokens = Array.isArray(group?.tokens) ? group.tokens : [];
    for (const token of tokens) {
      if (!token) continue;
      frequency.set(token, (frequency.get(token) || 0) + weight);
    }
  }

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(1, limit))
    .map((entry) => entry[0]);
}

function buildSuggestionSignals({ sourceChannelTitle, sourceVideos, userContext }) {
  const sourceTitleTokens = extractKeywordsFromText(sourceChannelTitle).slice(0, 8);
  const contextTokens = extractKeywordsFromText(userContext).slice(0, 24);
  const videoTitleTokens = [];
  const videos = Array.isArray(sourceVideos) ? sourceVideos : [];
  for (const video of videos.slice(0, 10)) {
    videoTitleTokens.push(...extractKeywordsFromText(video?.title));
  }

  const rankedTokens = rankTokens(
    [
      { tokens: contextTokens, weight: 5 },
      { tokens: videoTitleTokens, weight: 3 },
      { tokens: sourceTitleTokens, weight: 2 },
    ],
    20
  );

  const queries = [];
  if (contextTokens.length) {
    queries.push(rankTokens([{ tokens: contextTokens, weight: 1 }], 5).join(" "));
  }
  if (rankedTokens.length) {
    queries.push(rankedTokens.slice(0, 5).join(" "));
  }
  if (rankedTokens.length >= 2) {
    queries.push(`${rankedTokens[0]} ${rankedTokens[1]} creators`);
  }
  if (videoTitleTokens.length) {
    queries.push(rankTokens([{ tokens: videoTitleTokens, weight: 1 }], 4).join(" "));
  }

  const dedupedQueries = Array.from(new Set(queries.map((q) => normalizeText(q)).filter(Boolean))).slice(0, 4);
  if (!dedupedQueries.length) {
    const fallback = normalizeText(sourceChannelTitle).split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
    dedupedQueries.push(fallback || "youtube creators");
  }

  return {
    rankedTokens,
    queries: dedupedQueries,
  };
}

function scoreSuggestionCandidate({ candidate, relevanceTokens, sourceChannelTitle }) {
  const tokenSet = new Set(extractKeywordsFromText(`${candidate?.title || ""} ${candidate?.description || ""}`));
  const matchedTokens = [];
  for (const token of Array.isArray(relevanceTokens) ? relevanceTokens : []) {
    if (tokenSet.has(token)) matchedTokens.push(token);
  }

  const subscriberBoost = Math.min(3, Math.log10(safeNumber(candidate?.subscriberCount) + 1));
  const videoBoost = safeNumber(candidate?.videoCount) >= 25 ? 0.6 : 0;
  const identicalTitlePenalty =
    normalizeText(candidate?.title).toLowerCase() === normalizeText(sourceChannelTitle).toLowerCase() ? -1.5 : 0;

  const score = Number((matchedTokens.length * 5 + subscriberBoost + videoBoost + identicalTitlePenalty).toFixed(3));
  return {
    score,
    matchedTokens: matchedTokens.slice(0, 5),
  };
}

function buildSuggestionReason({ query, matchedTokens }) {
  const matches = Array.isArray(matchedTokens) ? matchedTokens.filter(Boolean).slice(0, 3) : [];
  if (matches.length) {
    return `Matched your context and recent topics: ${matches.join(", ")}`;
  }
  const normalizedQuery = normalizeText(query);
  if (normalizedQuery) {
    return `Discovered from context query: "${normalizedQuery}"`;
  }
  return "Related channel from context-aware discovery";
}

function rankSuggestionCandidates({
  discoveredCandidates,
  trackedSet,
  sourceChannelId,
  sourceChannelTitle,
  relevanceTokens,
}) {
  const deduped = new Map();

  for (const candidate of Array.isArray(discoveredCandidates) ? discoveredCandidates : []) {
    const channelId = normalizeText(candidate?.channelId);
    if (!channelId || channelId === sourceChannelId || trackedSet.has(channelId)) continue;

    const scored = scoreSuggestionCandidate({
      candidate,
      relevanceTokens,
      sourceChannelTitle,
    });

    const enriched = {
      ...candidate,
      relevanceScore: scored.score,
      matchedTokens: scored.matchedTokens,
    };

    const prev = deduped.get(channelId);
    if (!prev || safeNumber(enriched.relevanceScore) > safeNumber(prev.relevanceScore)) {
      deduped.set(channelId, enriched);
    }
  }

  return Array.from(deduped.values())
    .sort((a, b) => {
      const scoreDiff = safeNumber(b?.relevanceScore) - safeNumber(a?.relevanceScore);
      if (scoreDiff !== 0) return scoreDiff;
      return safeNumber(b?.subscriberCount) - safeNumber(a?.subscriberCount);
    })
    .slice(0, SUGGESTION_LIMIT);
}

async function searchChannels({ accessToken, query, limit = SEARCH_LIMIT }) {
  const q = normalizeText(query);
  if (!q) return [];

  const response = await youtubeGet({
    accessToken,
    path: "/search",
    params: {
      part: "snippet",
      type: "channel",
      q,
      maxResults: String(Math.max(1, Math.min(50, limit))),
      order: "relevance",
    },
  });

  const items = Array.isArray(response?.items) ? response.items : [];
  const ids = items
    .map((item) => normalizeText(item?.snippet?.channelId || item?.id?.channelId || ""))
    .filter(Boolean);

  const dedupedIds = Array.from(new Set(ids));
  if (!dedupedIds.length) return [];

  const detailsMap = await getChannelDetailsByIds({ accessToken, channelIds: dedupedIds });

  return dedupedIds
    .map((channelId) => {
      const channel = detailsMap.get(channelId);
      if (!channel) return null;
      const summary = mapChannelSummary(channel);
      return {
        channelId: summary.channelId,
        title: summary.title,
        description: summary.description,
        handle: summary.handle,
        thumbnail: summary.thumbnail,
        subscriberCount: summary.stats.subscriberCount,
        viewCount: summary.stats.viewCount,
        videoCount: summary.stats.videoCount,
        url: `https://www.youtube.com/channel/${encodeURIComponent(summary.channelId)}`,
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}

function sanitizeTrackedChannels(list) {
  const rows = Array.isArray(list) ? list : [];
  const seen = new Set();
  const normalized = [];

  for (const item of rows) {
    const channelId = normalizeText(item?.channelId);
    if (!channelId || seen.has(channelId)) continue;
    seen.add(channelId);
    normalized.push({
      channelId,
      title: normalizeText(item?.title || ""),
      thumbnail: item?.thumbnail || null,
      description: normalizeText(item?.description || ""),
      handle: normalizeText(item?.handle || ""),
      addedAt: item?.addedAt || null,
      addedBy: normalizeText(item?.addedBy || "manual") || "manual",
      notes: normalizeText(item?.notes || ""),
      stats: {
        subscriberCount: safeNumber(item?.stats?.subscriberCount),
        viewCount: safeNumber(item?.stats?.viewCount),
        videoCount: safeNumber(item?.stats?.videoCount),
      },
      lastSyncedAt: item?.lastSyncedAt || null,
    });
  }

  return normalized.slice(0, MAX_TRACKED_CHANNELS);
}

function buildTrackerFilter({ userId, sourceChannelId }) {
  return {
    userId,
    platform: PLATFORM,
    sourceChannelId,
  };
}

async function ensureTrackerDoc({ coll, userId, sourceChannelId, sourceChannelName }) {
  const now = new Date();
  const filter = buildTrackerFilter({ userId, sourceChannelId });
  const existing = await coll.findOne(filter);
  if (existing) {
    return existing;
  }

  const doc = {
    ...filter,
    sourceChannelName: normalizeText(sourceChannelName || ""),
    trackedChannels: [],
    suggestions: [],
    createdAt: now,
    updatedAt: now,
  };
  await coll.insertOne(doc);
  return doc;
}

function deriveTopPostingWindowUtc(videos) {
  const buckets = new Map();
  const rows = Array.isArray(videos) ? videos : [];

  for (const video of rows) {
    const weekday = normalizeText(video?.postingWeekdayUtc || "");
    const hour = Number(video?.postingHourUtc);
    const views = safeNumber(video?.views);
    if (!weekday || !Number.isInteger(hour) || hour < 0 || hour > 23) continue;

    const key = `${weekday}|${hour}`;
    const existing = buckets.get(key) || {
      weekdayUtc: weekday,
      hourUtc: hour,
      totalViews: 0,
      sampleSize: 0,
    };
    existing.totalViews += views;
    existing.sampleSize += 1;
    buckets.set(key, existing);
  }

  const ranked = Array.from(buckets.values())
    .map((bucket) => ({
      weekdayUtc: bucket.weekdayUtc,
      hourUtc: bucket.hourUtc,
      sampleSize: bucket.sampleSize,
      avgViews: Number((bucket.totalViews / Math.max(1, bucket.sampleSize)).toFixed(2)),
    }))
    .sort((a, b) => {
      const viewsDiff = safeNumber(b?.avgViews) - safeNumber(a?.avgViews);
      if (viewsDiff !== 0) return viewsDiff;
      return safeNumber(b?.sampleSize) - safeNumber(a?.sampleSize);
    });

  return ranked[0] || null;
}

function buildComparison({ ownSnapshot, trackedSnapshots, trackedVideos }) {
  const own = ownSnapshot || null;
  const tracked = Array.isArray(trackedSnapshots) ? trackedSnapshots : [];

  const trackedComparisons = tracked.map((item) => {
    const avgViewsDeltaPct = own?.recent?.avgViews
      ? Number((((item.recent.avgViews - own.recent.avgViews) / own.recent.avgViews) * 100).toFixed(2))
      : 0;

    const engagementDeltaPct = own?.recent?.engagementRate
      ? Number((((item.recent.engagementRate - own.recent.engagementRate) / own.recent.engagementRate) * 100).toFixed(2))
      : 0;

    const cadenceDeltaDays = Number(
      (safeNumber(item?.recent?.averageUploadGapDays) - safeNumber(own?.recent?.averageUploadGapDays)).toFixed(2)
    );

    return {
      ...item,
      deltaVsOwn: {
        avgViewsDeltaPct,
        engagementRateDeltaPct: engagementDeltaPct,
        subscribersDelta: safeNumber(item?.stats?.subscriberCount) - safeNumber(own?.stats?.subscriberCount),
        cadenceDeltaDays,
      },
    };
  });

  const trackedAvgViews = average(trackedComparisons.map((item) => item?.recent?.avgViews || 0));
  const trackedAvgEngagementRate = average(trackedComparisons.map((item) => item?.recent?.engagementRate || 0));
  const trackedAvgUploadGapDays = average(trackedComparisons.map((item) => item?.recent?.averageUploadGapDays || 0));
  const trackedAvgEngagement = average(trackedComparisons.map((item) => item?.recent?.avgEngagement || 0));

  const ownAvgViews = safeNumber(own?.recent?.avgViews);
  const ownEngagementRate = safeNumber(own?.recent?.engagementRate);
  const ownUploadGapDays = safeNumber(own?.recent?.averageUploadGapDays);

  const benchmark = {
    trackedCount: trackedComparisons.length,
    trackedAvgViews,
    trackedAvgEngagementRate,
    trackedAvgUploadGapDays,
    trackedAvgEngagement,
    ownVsBenchmark: {
      avgViewsGap: Number((trackedAvgViews - ownAvgViews).toFixed(2)),
      avgViewsGapPct:
        ownAvgViews > 0 ? Number((((trackedAvgViews - ownAvgViews) / ownAvgViews) * 100).toFixed(2)) : 0,
      engagementRateGap: Number((trackedAvgEngagementRate - ownEngagementRate).toFixed(2)),
      cadenceGapDays: Number((ownUploadGapDays - trackedAvgUploadGapDays).toFixed(2)),
    },
    bestPostingWindowUtc: deriveTopPostingWindowUtc(trackedVideos),
  };

  return {
    own,
    tracked: trackedComparisons,
    benchmark,
  };
}

function buildInsights({ ownSnapshot, trackedSnapshots, latestFeed }) {
  const own = ownSnapshot || null;
  const tracked = Array.isArray(trackedSnapshots) ? trackedSnapshots : [];
  const feed = Array.isArray(latestFeed) ? latestFeed : [];
  const insights = [];

  if (!tracked.length) {
    insights.push("Add channels to tracking to unlock comparative insights.");
    return insights;
  }

  const bestViews = tracked
    .slice()
    .sort((a, b) => (b?.recent?.avgViews || 0) - (a?.recent?.avgViews || 0))[0];
  if (bestViews) {
    insights.push(
      `${bestViews.title} leads tracked channels with ${bestViews.recent.avgViews} avg views on recent uploads.`
    );
  }

  const bestEngagement = tracked
    .slice()
    .sort((a, b) => (b?.recent?.engagementRate || 0) - (a?.recent?.engagementRate || 0))[0];
  if (bestEngagement) {
    insights.push(
      `${bestEngagement.title} has the strongest recent engagement rate at ${bestEngagement.recent.engagementRate}%.`
    );
  }

  const mostFrequent = tracked
    .slice()
    .filter((item) => Number(item?.recent?.averageUploadGapDays) > 0)
    .sort((a, b) => (a?.recent?.averageUploadGapDays || 0) - (b?.recent?.averageUploadGapDays || 0))[0];
  if (mostFrequent) {
    insights.push(
      `${mostFrequent.title} posts most frequently among tracked channels (about every ${mostFrequent.recent.averageUploadGapDays} days).`
    );
  }

  if (own) {
    const outperforming = tracked.filter((item) => (own?.recent?.avgViews || 0) >= (item?.recent?.avgViews || 0)).length;
    insights.push(`Your channel currently outperforms ${outperforming}/${tracked.length} tracked channels by recent avg views.`);

    const trackedAvgViews = average(tracked.map((item) => item?.recent?.avgViews || 0));
    const trackedAvgEngagement = average(tracked.map((item) => item?.recent?.engagementRate || 0));
    const trackedAvgCadence = average(tracked.map((item) => item?.recent?.averageUploadGapDays || 0));

    if (trackedAvgViews > safeNumber(own?.recent?.avgViews || 0)) {
      const gap = Number((trackedAvgViews - safeNumber(own?.recent?.avgViews || 0)).toFixed(2));
      insights.push(`Increase average views by ~${gap} per upload to match the current tracked benchmark.`);
    }
    if (trackedAvgEngagement > safeNumber(own?.recent?.engagementRate || 0)) {
      const gap = Number((trackedAvgEngagement - safeNumber(own?.recent?.engagementRate || 0)).toFixed(2));
      insights.push(`Lift engagement rate by ~${gap} percentage points to align with tracked channels.`);
    }
    if (trackedAvgCadence > 0 && safeNumber(own?.recent?.averageUploadGapDays || 0) > trackedAvgCadence) {
      insights.push(`Tracked creators post every ${trackedAvgCadence} days on average; consider tightening your cadence.`);
    }
  }

  const topFeed = feed
    .slice()
    .filter((video) => Number(video?.views) > 0)
    .sort((a, b) => (b?.views || 0) - (a?.views || 0))[0];
  if (topFeed) {
    insights.push(`Top recent tracked video: "${topFeed.title}" (${topFeed.views} views).`);
  }

  return insights.slice(0, 6);
}

async function fetchChannelBundle({ tokenContext, channelId }) {
  const detailMap = await runWithFreshToken(tokenContext, (accessToken) =>
    getChannelDetailsByIds({ accessToken, channelIds: [channelId] })
  );

  const channel = detailMap.get(channelId) || null;
  if (!channel) return null;

  const summary = mapChannelSummary(channel);
  const recentVideos = await runWithFreshToken(tokenContext, (accessToken) =>
    getRecentUploadsForChannel({
      accessToken,
      uploadsPlaylistId: summary.uploadsPlaylistId,
      limit: RECENT_VIDEOS_PER_CHANNEL,
    })
  );

  return {
    channel: summary,
    recentVideos,
    snapshot: computeChannelSnapshot(summary, recentVideos),
    raw: cloneForStorage(channel),
  };
}

function mapSuggestionForResponse(suggestion) {
  return {
    channelId: normalizeText(suggestion?.channelId),
    title: normalizeText(suggestion?.title),
    description: normalizeText(suggestion?.description),
    handle: normalizeText(suggestion?.handle),
    thumbnail: suggestion?.thumbnail || null,
    subscriberCount: safeNumber(suggestion?.subscriberCount),
    viewCount: safeNumber(suggestion?.viewCount),
    videoCount: safeNumber(suggestion?.videoCount),
    relevanceScore: safeNumber(suggestion?.relevanceScore),
    matchedTokens: Array.isArray(suggestion?.matchedTokens) ? suggestion.matchedTokens.slice(0, 5) : [],
    url: suggestion?.url || null,
    reason: normalizeText(suggestion?.reason || "Related channel from discovery search"),
  };
}

async function resolveUserContext({ userId, requestedChannelId }) {
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const ideationColl = db.collection(IDEATION_COLLECTION);
  const contextColl = db.collection("Context");

  const accounts = await accountsColl
    .find({ userId, platform: "youtube" })
    .sort({ updatedAt: -1 })
    .toArray();

  if (!accounts.length) {
    const err = new Error("YouTube account not connected for this user");
    err.statusCode = 404;
    throw err;
  }

  const account = resolveYouTubeAccount(accounts, requestedChannelId);
  if (!account) {
    const err = new Error("Matching YouTube account/channel not found for this user");
    err.statusCode = 404;
    throw err;
  }

  if (!account?.accessToken) {
    const err = new Error("YouTube access token missing. Reconnect account.");
    err.statusCode = 400;
    throw err;
  }

  const target = resolveTargetChannel(account, requestedChannelId);
  if (!target?.channelId) {
    const err = new Error("Unable to resolve YouTube channel context.");
    err.statusCode = 400;
    throw err;
  }

  let userYoutubeContext = "";
  try {
    const contextDoc = await contextColl.findOne(
      { userId },
      {
        projection: {
          youtube_context: 1,
        },
      }
    );
    userYoutubeContext = normalizeText(contextDoc?.youtube_context || "");
  } catch {
    userYoutubeContext = "";
  }

  return {
    db,
    accountsColl,
    ideationColl,
    account,
    target,
    userYoutubeContext,
    tokenContext: { account, accountsColl },
  };
}

export async function getYoutubeIdeationDashboard(req, res) {
  const userId = normalizeText(req.query?.userId || req.body?.userId || "");
  const channelId = normalizeText(req.query?.channelId || req.body?.channelId || "");

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const context = await resolveUserContext({ userId, requestedChannelId: channelId });
    const { ideationColl, target, tokenContext, userYoutubeContext } = context;

    const trackerDoc = await ensureTrackerDoc({
      coll: ideationColl,
      userId,
      sourceChannelId: target.channelId,
      sourceChannelName: target.channelName,
    });

    const trackedChannels = sanitizeTrackedChannels(trackerDoc?.trackedChannels || []);
    const trackedIds = trackedChannels.map((item) => item.channelId);

    const sourceBundle = await fetchChannelBundle({ tokenContext, channelId: target.channelId });
    if (!sourceBundle) {
      const err = new Error("Unable to fetch source channel data.");
      err.statusCode = 404;
      throw err;
    }

    const trackedBundles = [];
    for (const trackedChannelId of trackedIds) {
      try {
        const bundle = await fetchChannelBundle({ tokenContext, channelId: trackedChannelId });
        if (bundle) trackedBundles.push(bundle);
      } catch {
        // Keep dashboard resilient if one tracked channel fails.
      }
    }

    const latestFeed = trackedBundles
      .flatMap((bundle) =>
        (bundle?.recentVideos || []).map((video) => ({
          ...video,
          channelId: bundle?.channel?.channelId,
          channelTitle: bundle?.channel?.title || video?.channelTitle || "",
          channelThumbnail: bundle?.channel?.thumbnail || null,
        }))
      )
      .sort((a, b) => {
        const at = new Date(a?.publishedAt || 0).getTime();
        const bt = new Date(b?.publishedAt || 0).getTime();
        return bt - at;
      })
      .slice(0, FEED_LIMIT);

    const comparison = buildComparison({
      ownSnapshot: sourceBundle.snapshot,
      trackedSnapshots: trackedBundles.map((bundle) => bundle.snapshot),
      trackedVideos: trackedBundles.flatMap((bundle) => bundle?.recentVideos || []),
    });

    const suggestionSignals = buildSuggestionSignals({
      sourceChannelTitle: sourceBundle?.channel?.title,
      sourceVideos: sourceBundle?.recentVideos || [],
      userContext: userYoutubeContext,
    });
    const suggestionQueries = suggestionSignals?.queries || [];
    const suggestionQuery = suggestionQueries[0] || "";

    const trackedSet = new Set(trackedIds);
    const discoveredCandidates = [];
    for (let queryIndex = 0; queryIndex < suggestionQueries.length; queryIndex += 1) {
      const query = suggestionQueries[queryIndex];
      try {
        const results = await runWithFreshToken(tokenContext, (accessToken) =>
          searchChannels({
            accessToken,
            query,
            limit: 20,
          })
        );

        for (const item of results) {
          discoveredCandidates.push({
            ...item,
            _query: query,
            _queryIndex: queryIndex,
          });
        }
      } catch {
        // Keep suggestions resilient if one discovery query fails.
      }
    }

    const suggestionCandidates = rankSuggestionCandidates({
      discoveredCandidates,
      trackedSet,
      sourceChannelId: target.channelId,
      sourceChannelTitle: sourceBundle?.channel?.title || target.channelName,
      relevanceTokens: suggestionSignals?.rankedTokens || [],
    });

    const suggestions = suggestionCandidates
      .map((item) =>
        mapSuggestionForResponse({
          ...item,
          reason: buildSuggestionReason({
            query: item?._query,
            matchedTokens: item?.matchedTokens,
          }),
        })
      );

    const insights = buildInsights({
      ownSnapshot: sourceBundle.snapshot,
      trackedSnapshots: trackedBundles.map((bundle) => bundle.snapshot),
      latestFeed,
    });

    const now = new Date();
    const syncedTracked = trackedChannels.map((item) => {
      const match = trackedBundles.find((bundle) => bundle?.channel?.channelId === item.channelId);
      if (!match) return item;
      return {
        ...item,
        title: match.channel.title || item.title,
        description: match.channel.description || item.description,
        thumbnail: match.channel.thumbnail || item.thumbnail,
        handle: match.channel.handle || item.handle,
        stats: {
          subscriberCount: safeNumber(match.channel?.stats?.subscriberCount),
          viewCount: safeNumber(match.channel?.stats?.viewCount),
          videoCount: safeNumber(match.channel?.stats?.videoCount),
        },
        lastSyncedAt: now,
      };
    });

    await ideationColl.updateOne(
      buildTrackerFilter({ userId, sourceChannelId: target.channelId }),
      {
        $set: {
          userId,
          platform: PLATFORM,
          sourceChannelId: target.channelId,
          sourceChannelName: sourceBundle.channel.title || target.channelName,
          trackedChannels: syncedTracked,
          suggestions: suggestions.map((item) => ({ ...item, suggestedAt: now })),
          latestSuggestionQuery: suggestionQuery,
          latestSuggestionQueries: suggestionQueries,
          usedAccountContext: Boolean(userYoutubeContext),
          lastRefreshedAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    return res.json({
      ok: true,
      platform: "youtube",
      context: {
        sourceChannelId: sourceBundle.channel.channelId,
        sourceChannelName: sourceBundle.channel.title,
        sourceHandle: sourceBundle.channel.handle,
        maxTrackedChannels: MAX_TRACKED_CHANNELS,
        suggestionQuery,
        suggestionQueries,
        usedAccountContext: Boolean(userYoutubeContext),
        lastRefreshedAt: now.toISOString(),
      },
      trackedChannels: syncedTracked,
      suggestions,
      latestFeed,
      comparison,
      insights,
    });
  } catch (err) {
    console.error("getYoutubeIdeationDashboard error:", err);
    const status = Number(err?.statusCode);
    const safeStatus = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
    return res.status(safeStatus).json({
      error: "Failed to load ideation engine dashboard",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

export async function searchYoutubeIdeationChannels(req, res) {
  const userId = normalizeText(req.query?.userId || "");
  const channelId = normalizeText(req.query?.channelId || "");
  const query = normalizeText(req.query?.q || "");

  if (!userId) return res.status(400).json({ error: "userId is required" });
  if (!query) return res.status(400).json({ error: "q is required" });

  try {
    const context = await resolveUserContext({ userId, requestedChannelId: channelId });
    const { target, tokenContext, ideationColl } = context;

    const trackerDoc = await ensureTrackerDoc({
      coll: ideationColl,
      userId,
      sourceChannelId: target.channelId,
      sourceChannelName: target.channelName,
    });

    const trackedSet = new Set(
      sanitizeTrackedChannels(trackerDoc?.trackedChannels || []).map((item) => item.channelId)
    );

    const results = await runWithFreshToken(tokenContext, (accessToken) =>
      searchChannels({
        accessToken,
        query,
        limit: SEARCH_LIMIT,
      })
    );

    const filtered = results
      .filter((item) => item.channelId !== target.channelId)
      .map((item) => ({
        ...item,
        isTracked: trackedSet.has(item.channelId),
      }));

    return res.json({ ok: true, results: filtered });
  } catch (err) {
    console.error("searchYoutubeIdeationChannels error:", err);
    const status = Number(err?.statusCode);
    const safeStatus = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
    return res.status(safeStatus).json({
      error: "Failed to search channels",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

export async function addYoutubeIdeationTrackedChannel(req, res) {
  const userId = normalizeText(req.body?.userId || req.query?.userId || "");
  const sourceChannelId = normalizeText(req.body?.channelId || req.query?.channelId || "");
  const trackedChannelId = normalizeText(req.body?.trackedChannelId || "");
  const addedBy = normalizeText(req.body?.addedBy || "manual") || "manual";

  if (!userId) return res.status(400).json({ error: "userId is required" });
  if (!trackedChannelId) return res.status(400).json({ error: "trackedChannelId is required" });

  try {
    const context = await resolveUserContext({ userId, requestedChannelId: sourceChannelId });
    const { ideationColl, target, tokenContext } = context;

    if (trackedChannelId === target.channelId) {
      return res.status(400).json({ error: "You cannot track your own channel" });
    }

    const trackerDoc = await ensureTrackerDoc({
      coll: ideationColl,
      userId,
      sourceChannelId: target.channelId,
      sourceChannelName: target.channelName,
    });

    const trackedChannels = sanitizeTrackedChannels(trackerDoc?.trackedChannels || []);
    if (trackedChannels.some((item) => item.channelId === trackedChannelId)) {
      return res.json({ ok: true, alreadyTracked: true, trackedChannels });
    }

    if (trackedChannels.length >= MAX_TRACKED_CHANNELS) {
      return res.status(400).json({
        error: `Tracked channels limit reached (${MAX_TRACKED_CHANNELS}). Remove one before adding another.`,
      });
    }

    const detailMap = await runWithFreshToken(tokenContext, (accessToken) =>
      getChannelDetailsByIds({ accessToken, channelIds: [trackedChannelId] })
    );

    const channel = detailMap.get(trackedChannelId);
    if (!channel) {
      return res.status(404).json({ error: "Tracked channel not found on YouTube" });
    }

    const summary = mapChannelSummary(channel);
    const now = new Date();
    const nextTrackedChannels = sanitizeTrackedChannels([
      ...trackedChannels,
      {
        channelId: summary.channelId,
        title: summary.title,
        thumbnail: summary.thumbnail,
        description: summary.description,
        handle: summary.handle,
        addedAt: now,
        addedBy,
        notes: "",
        stats: {
          subscriberCount: safeNumber(summary?.stats?.subscriberCount),
          viewCount: safeNumber(summary?.stats?.viewCount),
          videoCount: safeNumber(summary?.stats?.videoCount),
        },
        lastSyncedAt: now,
      },
    ]);

    await ideationColl.updateOne(
      buildTrackerFilter({ userId, sourceChannelId: target.channelId }),
      {
        $set: {
          userId,
          platform: PLATFORM,
          sourceChannelId: target.channelId,
          sourceChannelName: target.channelName,
          trackedChannels: nextTrackedChannels,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    return res.json({ ok: true, trackedChannels: nextTrackedChannels });
  } catch (err) {
    console.error("addYoutubeIdeationTrackedChannel error:", err);
    const status = Number(err?.statusCode);
    const safeStatus = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
    return res.status(safeStatus).json({
      error: "Failed to add tracked channel",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

export async function removeYoutubeIdeationTrackedChannel(req, res) {
  const userId = normalizeText(req.query?.userId || req.body?.userId || "");
  const sourceChannelId = normalizeText(req.query?.channelId || req.body?.channelId || "");
  const trackedChannelId = normalizeText(req.query?.trackedChannelId || req.body?.trackedChannelId || "");

  if (!userId) return res.status(400).json({ error: "userId is required" });
  if (!trackedChannelId) return res.status(400).json({ error: "trackedChannelId is required" });

  try {
    const context = await resolveUserContext({ userId, requestedChannelId: sourceChannelId });
    const { ideationColl, target } = context;

    const filter = buildTrackerFilter({ userId, sourceChannelId: target.channelId });
    const trackerDoc = await ideationColl.findOne(filter);
    if (!trackerDoc) {
      return res.json({ ok: true, trackedChannels: [] });
    }

    const trackedChannels = sanitizeTrackedChannels(trackerDoc?.trackedChannels || []);
    const nextTrackedChannels = trackedChannels.filter((item) => item.channelId !== trackedChannelId);

    await ideationColl.updateOne(
      filter,
      {
        $set: {
          trackedChannels: nextTrackedChannels,
          updatedAt: new Date(),
        },
      }
    );

    return res.json({ ok: true, trackedChannels: nextTrackedChannels });
  } catch (err) {
    console.error("removeYoutubeIdeationTrackedChannel error:", err);
    const status = Number(err?.statusCode);
    const safeStatus = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
    return res.status(safeStatus).json({
      error: "Failed to remove tracked channel",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
