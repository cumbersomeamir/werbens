import crypto from "crypto";
import ExcelJS from "exceljs";
import { getDb } from "../../db.js";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

const REPORT_COLLECTION = "Report";
const REPORT_PLATFORM = "Youtube";
const REPORT_SECTION = "Youtube Time of Posting";
const REPORT_TYPE = "youtube_time_of_posting";
const VIDEO_BATCH_SIZE = 50;
const PLAYLIST_PAGE_SIZE = 50;
const MAX_PLAYLIST_PAGES = 300;

const WEEKDAY_NAMES = Object.freeze([
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]);

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
  const err = new Error(message);
  err.statusCode = status;
  return err;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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

function sanitizeFileNamePart(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || "channel";
}

function cloneForStorage(value) {
  if (value == null) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function toExcelUtcDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: "", time: "", hour: null, weekday: "", iso: "" };
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const weekday = WEEKDAY_NAMES[d.getUTCDay()] || "";
  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${mi}`,
    hour: d.getUTCHours(),
    weekday,
    iso: d.toISOString(),
  };
}

function resolveYouTubeAccount(accounts, requestedChannelId) {
  const list = Array.isArray(accounts) ? accounts : [];
  if (!list.length) return null;
  const requested = String(requestedChannelId || "").trim();
  if (!requested) {
    return list.find((acc) => !!acc?.accessToken) || list[0] || null;
  }

  const directMatch = list.find((account) => {
    const channels = Array.isArray(account?.channels) ? account.channels : [];
    if (String(account?.platformUserId || "") === requested) return true;
    return channels.some((channel) => String(channel?.channelId || "") === requested);
  });

  return directMatch || null;
}

function resolveTargetChannel(account, requestedChannelId) {
  const requested = String(requestedChannelId || "").trim();
  const channels = Array.isArray(account?.channels) ? account.channels : [];

  if (requested) {
    const exact = channels.find((channel) => String(channel?.channelId || "") === requested);
    if (exact) {
      return {
        channelId: requested,
        channelName: String(exact?.title || account?.username || account?.displayName || requested),
      };
    }
    if (String(account?.platformUserId || "") === requested) {
      return {
        channelId: requested,
        channelName: String(account?.username || account?.displayName || requested),
      };
    }
    return null;
  }

  if (channels.length > 0) {
    const first = channels[0];
    return {
      channelId: String(first?.channelId || ""),
      channelName: String(first?.title || account?.username || account?.displayName || "YouTube"),
    };
  }

  if (account?.platformUserId) {
    return {
      channelId: String(account.platformUserId),
      channelName: String(account?.username || account?.displayName || account.platformUserId),
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
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    throw formatYouTubeApiError(res.status, raw);
  }

  return res.json();
}

async function fetchChannelPayload({ accessToken, channelId }) {
  const response = await youtubeGet({
    accessToken,
    path: "/channels",
    params: {
      part: "snippet,statistics,contentDetails,status,brandingSettings,topicDetails",
      id: channelId,
      maxResults: "50",
    },
  });

  const items = Array.isArray(response?.items) ? response.items : [];
  const matched = items.find((item) => String(item?.id || "") === String(channelId || "")) || items[0] || null;

  if (!matched) {
    const err = new Error("Channel data not found from YouTube API");
    err.statusCode = 404;
    throw err;
  }

  return {
    channel: matched,
    rawResponse: response,
  };
}

async function fetchAllPlaylistItems({ accessToken, uploadsPlaylistId }) {
  let pageToken = "";
  let pageIndex = 0;
  const pages = [];
  const items = [];

  while (pageIndex < MAX_PLAYLIST_PAGES) {
    const page = await youtubeGet({
      accessToken,
      path: "/playlistItems",
      params: {
        part: "id,snippet,contentDetails,status",
        playlistId: uploadsPlaylistId,
        maxResults: String(PLAYLIST_PAGE_SIZE),
        ...(pageToken ? { pageToken } : {}),
      },
    });

    const pageItems = Array.isArray(page?.items) ? page.items : [];
    pages.push({
      pageIndex: pageIndex + 1,
      requestedPageToken: pageToken || null,
      returnedNextPageToken: String(page?.nextPageToken || "") || null,
      itemCount: pageItems.length,
      raw: cloneForStorage(page),
    });

    items.push(...pageItems);
    const nextToken = String(page?.nextPageToken || "");
    pageIndex += 1;
    if (!nextToken) break;
    pageToken = nextToken;
  }

  return { items, pages };
}

async function fetchVideoDetails({ accessToken, videoIds }) {
  const uniqueIds = [];
  const seen = new Set();
  for (const id of videoIds || []) {
    const value = String(id || "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    uniqueIds.push(value);
  }

  const batches = chunkArray(uniqueIds, VIDEO_BATCH_SIZE);
  const pages = [];
  const items = [];

  for (let idx = 0; idx < batches.length; idx += 1) {
    const batch = batches[idx];
    if (!batch.length) continue;

    const page = await youtubeGet({
      accessToken,
      path: "/videos",
      params: {
        part: "id,snippet,statistics,contentDetails,status,topicDetails,recordingDetails,liveStreamingDetails,player",
        id: batch.join(","),
      },
    });

    const pageItems = Array.isArray(page?.items) ? page.items : [];
    pages.push({
      pageIndex: idx + 1,
      videoIds: batch,
      itemCount: pageItems.length,
      raw: cloneForStorage(page),
    });
    items.push(...pageItems);
  }

  const map = new Map();
  for (const item of items) {
    const id = String(item?.id || "").trim();
    if (!id) continue;
    map.set(id, item);
  }

  return { items, pages, map };
}

function buildVideoRows({ playlistItems, videoMap, channelName }) {
  const rows = [];
  const missingVideoIds = [];

  for (let idx = 0; idx < playlistItems.length; idx += 1) {
    const playlistItem = playlistItems[idx];
    const videoId = String(playlistItem?.contentDetails?.videoId || "").trim();
    if (!videoId) continue;

    const video = videoMap.get(videoId) || null;
    if (!video) missingVideoIds.push(videoId);

    const snippet = video?.snippet || {};
    const stats = video?.statistics || {};
    const contentDetails = video?.contentDetails || {};
    const status = video?.status || {};

    const publishedRaw = snippet?.publishedAt || playlistItem?.contentDetails?.videoPublishedAt || playlistItem?.snippet?.publishedAt || null;
    const publishedMeta = toExcelUtcDateTime(publishedRaw);

    const views = safeNumber(stats?.viewCount);
    const likes = safeNumber(stats?.likeCount);
    const comments = safeNumber(stats?.commentCount);
    const favorites = safeNumber(stats?.favoriteCount);
    const engagementTotal = likes + comments + favorites;
    const engagementRatePct = views > 0 ? Number(((engagementTotal / views) * 100).toFixed(2)) : 0;

    rows.push({
      index: idx + 1,
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      title: String(snippet?.title || playlistItem?.snippet?.title || "").trim(),
      description: String(snippet?.description || "").trim(),
      channelTitle: String(snippet?.channelTitle || channelName || "").trim(),
      publishedAt: publishedMeta.iso || null,
      postingDateUtc: publishedMeta.date || null,
      postingTimeUtc: publishedMeta.time || null,
      postingHourUtc: Number.isInteger(publishedMeta.hour) ? publishedMeta.hour : null,
      postingWeekdayUtc: publishedMeta.weekday || null,
      views,
      likes,
      comments,
      favorites,
      engagementTotal,
      engagementRatePct,
      duration: String(contentDetails?.duration || ""),
      privacyStatus: String(status?.privacyStatus || ""),
      madeForKids: status?.madeForKids === true,
      tagsCount: Array.isArray(snippet?.tags) ? snippet.tags.length : 0,
      categoryId: String(snippet?.categoryId || ""),
      language: String(snippet?.defaultLanguage || snippet?.defaultAudioLanguage || ""),
      playlistItemId: String(playlistItem?.id || ""),
      playlistPosition: safeNumber(playlistItem?.snippet?.position),
      playlistPublishedAt: String(playlistItem?.snippet?.publishedAt || "") || null,
      rawPlaylistItem: cloneForStorage(playlistItem),
      rawVideoItem: cloneForStorage(video),
    });
  }

  return { rows, missingVideoIds: Array.from(new Set(missingVideoIds)) };
}

function computeHourlyBuckets(rows) {
  const buckets = Array.from({ length: 24 }).map((_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00-${String(hour).padStart(2, "0")}:59 UTC`,
    posts: 0,
    totalViews: 0,
    totalEngagement: 0,
    totalLikes: 0,
    totalComments: 0,
    avgViews: 0,
    avgEngagement: 0,
  }));

  for (const row of rows) {
    const hour = Number(row?.postingHourUtc);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) continue;
    const bucket = buckets[hour];
    bucket.posts += 1;
    bucket.totalViews += safeNumber(row?.views);
    bucket.totalEngagement += safeNumber(row?.engagementTotal);
    bucket.totalLikes += safeNumber(row?.likes);
    bucket.totalComments += safeNumber(row?.comments);
  }

  for (const bucket of buckets) {
    if (bucket.posts > 0) {
      bucket.avgViews = Number((bucket.totalViews / bucket.posts).toFixed(2));
      bucket.avgEngagement = Number((bucket.totalEngagement / bucket.posts).toFixed(2));
    }
  }

  return buckets;
}

function computeWeekdayBuckets(rows) {
  const buckets = WEEKDAY_NAMES.map((weekday, dayIndex) => ({
    dayIndex,
    weekday,
    posts: 0,
    totalViews: 0,
    totalEngagement: 0,
    avgViews: 0,
    avgEngagement: 0,
  }));

  for (const row of rows) {
    const weekday = String(row?.postingWeekdayUtc || "");
    const idx = WEEKDAY_NAMES.indexOf(weekday);
    if (idx < 0) continue;
    const bucket = buckets[idx];
    bucket.posts += 1;
    bucket.totalViews += safeNumber(row?.views);
    bucket.totalEngagement += safeNumber(row?.engagementTotal);
  }

  for (const bucket of buckets) {
    if (bucket.posts > 0) {
      bucket.avgViews = Number((bucket.totalViews / bucket.posts).toFixed(2));
      bucket.avgEngagement = Number((bucket.totalEngagement / bucket.posts).toFixed(2));
    }
  }

  return buckets;
}

function pearsonCorrelation(points) {
  const list = Array.isArray(points)
    ? points.filter((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y))
    : [];

  if (list.length < 2) return null;

  const n = list.length;
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;

  for (const point of list) {
    const x = Number(point.x);
    const y = Number(point.y);
    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumYY += y * y;
    sumXY += x * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  if (denominator === 0) return null;
  return Number((numerator / denominator).toFixed(4));
}

function describeCorrelation(value) {
  if (!Number.isFinite(value)) return "insufficient data";
  const abs = Math.abs(value);
  if (abs >= 0.7) return "strong";
  if (abs >= 0.4) return "moderate";
  if (abs >= 0.2) return "weak";
  return "very weak";
}

function buildSummary(rows, generatedAtIso) {
  const summary = {
    generatedAt: generatedAtIso,
    videoCount: rows.length,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalFavorites: 0,
    totalEngagement: 0,
    avgViewsPerVideo: 0,
    avgEngagementPerVideo: 0,
    firstPublishedAt: null,
    lastPublishedAt: null,
  };

  for (const row of rows) {
    summary.totalViews += safeNumber(row?.views);
    summary.totalLikes += safeNumber(row?.likes);
    summary.totalComments += safeNumber(row?.comments);
    summary.totalFavorites += safeNumber(row?.favorites);
    summary.totalEngagement += safeNumber(row?.engagementTotal);
  }

  if (rows.length > 0) {
    summary.avgViewsPerVideo = Number((summary.totalViews / rows.length).toFixed(2));
    summary.avgEngagementPerVideo = Number((summary.totalEngagement / rows.length).toFixed(2));

    const dated = rows
      .map((row) => row?.publishedAt)
      .filter((value) => !!value)
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dated.length > 0) {
      summary.firstPublishedAt = dated[0].toISOString();
      summary.lastPublishedAt = dated[dated.length - 1].toISOString();
    }
  }

  return summary;
}

function buildAnalysis(rows, hourlyBuckets, weekdayBuckets) {
  const viewCorr = pearsonCorrelation(rows.map((row) => ({ x: Number(row?.postingHourUtc), y: Number(row?.views) })));
  const engagementCorr = pearsonCorrelation(
    rows.map((row) => ({ x: Number(row?.postingHourUtc), y: Number(row?.engagementTotal) }))
  );

  const topViewHours = hourlyBuckets
    .filter((bucket) => bucket.posts > 0)
    .slice()
    .sort((a, b) => {
      if (b.avgViews !== a.avgViews) return b.avgViews - a.avgViews;
      if (b.posts !== a.posts) return b.posts - a.posts;
      return a.hour - b.hour;
    })
    .slice(0, 3)
    .map((bucket) => ({
      hour: bucket.hour,
      label: bucket.label,
      posts: bucket.posts,
      avgViews: bucket.avgViews,
      avgEngagement: bucket.avgEngagement,
    }));

  const topEngagementHours = hourlyBuckets
    .filter((bucket) => bucket.posts > 0)
    .slice()
    .sort((a, b) => {
      if (b.avgEngagement !== a.avgEngagement) return b.avgEngagement - a.avgEngagement;
      if (b.posts !== a.posts) return b.posts - a.posts;
      return a.hour - b.hour;
    })
    .slice(0, 3)
    .map((bucket) => ({
      hour: bucket.hour,
      label: bucket.label,
      posts: bucket.posts,
      avgViews: bucket.avgViews,
      avgEngagement: bucket.avgEngagement,
    }));

  const topWeekdaysByViews = weekdayBuckets
    .filter((bucket) => bucket.posts > 0)
    .slice()
    .sort((a, b) => {
      if (b.avgViews !== a.avgViews) return b.avgViews - a.avgViews;
      if (b.posts !== a.posts) return b.posts - a.posts;
      return a.dayIndex - b.dayIndex;
    })
    .slice(0, 3)
    .map((bucket) => ({
      weekday: bucket.weekday,
      posts: bucket.posts,
      avgViews: bucket.avgViews,
      avgEngagement: bucket.avgEngagement,
    }));

  const topWeekdaysByEngagement = weekdayBuckets
    .filter((bucket) => bucket.posts > 0)
    .slice()
    .sort((a, b) => {
      if (b.avgEngagement !== a.avgEngagement) return b.avgEngagement - a.avgEngagement;
      if (b.posts !== a.posts) return b.posts - a.posts;
      return a.dayIndex - b.dayIndex;
    })
    .slice(0, 3)
    .map((bucket) => ({
      weekday: bucket.weekday,
      posts: bucket.posts,
      avgViews: bucket.avgViews,
      avgEngagement: bucket.avgEngagement,
    }));

  const relationship = {
    postingHourVsViews: {
      value: viewCorr,
      strength: describeCorrelation(viewCorr),
    },
    postingHourVsEngagement: {
      value: engagementCorr,
      strength: describeCorrelation(engagementCorr),
    },
  };

  const keyFindings = [
    topViewHours[0]
      ? `Best average views are around ${topViewHours[0].label} with ${topViewHours[0].avgViews} avg views/video.`
      : "Insufficient posts to rank best posting hour by views.",
    topEngagementHours[0]
      ? `Best average engagement is around ${topEngagementHours[0].label} with ${topEngagementHours[0].avgEngagement} avg engagement/video.`
      : "Insufficient posts to rank best posting hour by engagement.",
    Number.isFinite(viewCorr)
      ? `Hour-to-view relationship is ${describeCorrelation(viewCorr)} (correlation ${viewCorr}).`
      : "Not enough variation to compute hour-to-view correlation.",
    Number.isFinite(engagementCorr)
      ? `Hour-to-engagement relationship is ${describeCorrelation(engagementCorr)} (correlation ${engagementCorr}).`
      : "Not enough variation to compute hour-to-engagement correlation.",
  ];

  return {
    relationship,
    topViewHours,
    topEngagementHours,
    topWeekdaysByViews,
    topWeekdaysByEngagement,
    keyFindings,
  };
}

function formatExcelValue(value) {
  if (value == null) return "";
  return String(value);
}

function styleSheetHeader(row) {
  row.font = { bold: true, color: { argb: "FF0A3D62" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE7F5F4" },
  };
  row.alignment = { vertical: "middle" };
}

async function buildExcelBuffer({ channelName, summary, analysis, rows, hourlyBuckets, weekdayBuckets }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Werbens";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 38 },
    { header: "Value", key: "value", width: 48 },
  ];
  styleSheetHeader(summarySheet.getRow(1));

  const summaryRows = [
    ["Channel", channelName || ""],
    ["Generated At (UTC)", summary.generatedAt || ""],
    ["Videos Analysed", summary.videoCount],
    ["Total Views", summary.totalViews],
    ["Total Engagement", summary.totalEngagement],
    ["Total Likes", summary.totalLikes],
    ["Total Comments", summary.totalComments],
    ["Average Views / Video", summary.avgViewsPerVideo],
    ["Average Engagement / Video", summary.avgEngagementPerVideo],
    ["First Published At (UTC)", summary.firstPublishedAt || ""],
    ["Last Published At (UTC)", summary.lastPublishedAt || ""],
    [
      "Correlation (Posting Hour vs Views)",
      analysis?.relationship?.postingHourVsViews?.value ?? "insufficient data",
    ],
    [
      "Correlation (Posting Hour vs Engagement)",
      analysis?.relationship?.postingHourVsEngagement?.value ?? "insufficient data",
    ],
  ];

  for (const [metric, value] of summaryRows) {
    summarySheet.addRow({ metric, value: formatExcelValue(value) });
  }

  const findingsSheet = workbook.addWorksheet("Insights");
  findingsSheet.columns = [
    { header: "Insight", key: "insight", width: 120 },
  ];
  styleSheetHeader(findingsSheet.getRow(1));
  const findings = Array.isArray(analysis?.keyFindings) ? analysis.keyFindings : [];
  for (const finding of findings) {
    findingsSheet.addRow({ insight: finding });
  }

  const hourlySheet = workbook.addWorksheet("Hourly Analysis");
  hourlySheet.columns = [
    { header: "Hour (UTC)", key: "hour", width: 12 },
    { header: "Range", key: "label", width: 24 },
    { header: "Posts", key: "posts", width: 10 },
    { header: "Total Views", key: "totalViews", width: 14 },
    { header: "Avg Views", key: "avgViews", width: 14 },
    { header: "Total Engagement", key: "totalEngagement", width: 18 },
    { header: "Avg Engagement", key: "avgEngagement", width: 16 },
  ];
  styleSheetHeader(hourlySheet.getRow(1));
  for (const bucket of hourlyBuckets) {
    hourlySheet.addRow({
      hour: bucket.hour,
      label: bucket.label,
      posts: bucket.posts,
      totalViews: bucket.totalViews,
      avgViews: bucket.avgViews,
      totalEngagement: bucket.totalEngagement,
      avgEngagement: bucket.avgEngagement,
    });
  }

  const weekdaySheet = workbook.addWorksheet("Weekday Analysis");
  weekdaySheet.columns = [
    { header: "Weekday", key: "weekday", width: 18 },
    { header: "Posts", key: "posts", width: 10 },
    { header: "Total Views", key: "totalViews", width: 14 },
    { header: "Avg Views", key: "avgViews", width: 14 },
    { header: "Total Engagement", key: "totalEngagement", width: 18 },
    { header: "Avg Engagement", key: "avgEngagement", width: 16 },
  ];
  styleSheetHeader(weekdaySheet.getRow(1));
  for (const bucket of weekdayBuckets) {
    weekdaySheet.addRow({
      weekday: bucket.weekday,
      posts: bucket.posts,
      totalViews: bucket.totalViews,
      avgViews: bucket.avgViews,
      totalEngagement: bucket.totalEngagement,
      avgEngagement: bucket.avgEngagement,
    });
  }

  const videosSheet = workbook.addWorksheet("Video Data");
  videosSheet.columns = [
    { header: "Video ID", key: "videoId", width: 18 },
    { header: "Title", key: "title", width: 48 },
    { header: "Published At (UTC)", key: "publishedAt", width: 26 },
    { header: "Posting Date (UTC)", key: "postingDateUtc", width: 18 },
    { header: "Posting Time (UTC)", key: "postingTimeUtc", width: 16 },
    { header: "Posting Hour (UTC)", key: "postingHourUtc", width: 18 },
    { header: "Posting Weekday (UTC)", key: "postingWeekdayUtc", width: 22 },
    { header: "Views", key: "views", width: 12 },
    { header: "Likes", key: "likes", width: 12 },
    { header: "Comments", key: "comments", width: 12 },
    { header: "Favorites", key: "favorites", width: 12 },
    { header: "Total Engagement", key: "engagementTotal", width: 18 },
    { header: "Engagement Rate (%)", key: "engagementRatePct", width: 20 },
    { header: "Duration", key: "duration", width: 16 },
    { header: "Privacy", key: "privacyStatus", width: 16 },
    { header: "Video URL", key: "videoUrl", width: 54 },
  ];
  styleSheetHeader(videosSheet.getRow(1));
  videosSheet.views = [{ state: "frozen", ySplit: 1 }];

  for (const row of rows) {
    videosSheet.addRow({
      videoId: row.videoId,
      title: row.title,
      publishedAt: row.publishedAt,
      postingDateUtc: row.postingDateUtc,
      postingTimeUtc: row.postingTimeUtc,
      postingHourUtc: row.postingHourUtc,
      postingWeekdayUtc: row.postingWeekdayUtc,
      views: row.views,
      likes: row.likes,
      comments: row.comments,
      favorites: row.favorites,
      engagementTotal: row.engagementTotal,
      engagementRatePct: row.engagementRatePct,
      duration: row.duration,
      privacyStatus: row.privacyStatus,
      videoUrl: row.videoUrl,
    });
  }

  const written = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(written) ? written : Buffer.from(written);
}

function mapRowForResponse(row) {
  return {
    index: row.index,
    videoId: row.videoId,
    videoUrl: row.videoUrl,
    title: row.title,
    channelTitle: row.channelTitle,
    publishedAt: row.publishedAt,
    postingDateUtc: row.postingDateUtc,
    postingTimeUtc: row.postingTimeUtc,
    postingHourUtc: row.postingHourUtc,
    postingWeekdayUtc: row.postingWeekdayUtc,
    views: row.views,
    likes: row.likes,
    comments: row.comments,
    favorites: row.favorites,
    engagementTotal: row.engagementTotal,
    engagementRatePct: row.engagementRatePct,
    duration: row.duration,
    privacyStatus: row.privacyStatus,
    tagsCount: row.tagsCount,
    categoryId: row.categoryId,
    language: row.language,
  };
}

async function persistReportData({
  reportsColl,
  userId,
  channelId,
  channelName,
  platformUserId,
  generatedAt,
  reportId,
  summary,
  analysis,
  hourlyBuckets,
  weekdayBuckets,
  rows,
  channelRaw,
  playlistPages,
  videoPages,
  missingVideoIds,
  excel,
}) {
  const now = new Date();
  const summaryDoc = {
    reportId,
    kind: "summary",
    userId,
    platform: REPORT_PLATFORM,
    reportSection: REPORT_SECTION,
    reportType: REPORT_TYPE,
    channelId,
    channelName,
    platformUserId: platformUserId || null,
    generatedAt,
    summary,
    analysis,
    hourlyBuckets,
    weekdayBuckets,
    dataCounts: {
      videoRows: rows.length,
      missingVideoIds: missingVideoIds.length,
      playlistPages: playlistPages.length,
      videoPages: videoPages.length,
    },
    missingVideoIds,
    excel: {
      fileName: excel.fileName,
      mimeType: excel.mimeType,
      sizeBytes: excel.sizeBytes,
      generatedAt,
      base64: excel.base64,
    },
    updatedAt: now,
    createdAt: now,
  };

  await reportsColl.insertOne(summaryDoc);

  if (rows.length > 0) {
    const rowOps = rows.map((row) => ({
      insertOne: {
        document: {
          reportId,
          kind: "video_row",
          userId,
          platform: REPORT_PLATFORM,
          reportSection: REPORT_SECTION,
          reportType: REPORT_TYPE,
          channelId,
          channelName,
          generatedAt,
          row: mapRowForResponse(row),
          rawPlaylistItem: row.rawPlaylistItem,
          rawVideoItem: row.rawVideoItem,
          updatedAt: now,
          createdAt: now,
        },
      },
    }));

    for (const chunk of chunkArray(rowOps, 200)) {
      await reportsColl.bulkWrite(chunk, { ordered: false });
    }
  }

  const rawDocs = [];
  if (channelRaw) {
    rawDocs.push({
      reportId,
      kind: "raw_channel_response",
      userId,
      platform: REPORT_PLATFORM,
      reportSection: REPORT_SECTION,
      reportType: REPORT_TYPE,
      channelId,
      generatedAt,
      payload: channelRaw,
      updatedAt: now,
      createdAt: now,
    });
  }
  for (const page of playlistPages) {
    rawDocs.push({
      reportId,
      kind: "raw_playlist_page",
      userId,
      platform: REPORT_PLATFORM,
      reportSection: REPORT_SECTION,
      reportType: REPORT_TYPE,
      channelId,
      generatedAt,
      pageIndex: page.pageIndex,
      requestedPageToken: page.requestedPageToken,
      returnedNextPageToken: page.returnedNextPageToken,
      itemCount: page.itemCount,
      payload: page.raw,
      updatedAt: now,
      createdAt: now,
    });
  }
  for (const page of videoPages) {
    rawDocs.push({
      reportId,
      kind: "raw_videos_page",
      userId,
      platform: REPORT_PLATFORM,
      reportSection: REPORT_SECTION,
      reportType: REPORT_TYPE,
      channelId,
      generatedAt,
      pageIndex: page.pageIndex,
      videoIds: page.videoIds,
      itemCount: page.itemCount,
      payload: page.raw,
      updatedAt: now,
      createdAt: now,
    });
  }

  if (rawDocs.length > 0) {
    for (const chunk of chunkArray(rawDocs, 100)) {
      await reportsColl.insertMany(chunk, { ordered: false });
    }
  }
}

function mapSummaryDocToResponse(summaryDoc, rows) {
  if (!summaryDoc) return null;
  return {
    reportId: summaryDoc.reportId,
    userId: summaryDoc.userId,
    platform: summaryDoc.platform,
    reportSection: summaryDoc.reportSection,
    reportType: summaryDoc.reportType,
    channelId: summaryDoc.channelId,
    channelName: summaryDoc.channelName,
    platformUserId: summaryDoc.platformUserId || null,
    generatedAt: summaryDoc.generatedAt,
    summary: summaryDoc.summary || null,
    analysis: summaryDoc.analysis || null,
    hourlyBuckets: Array.isArray(summaryDoc.hourlyBuckets) ? summaryDoc.hourlyBuckets : [],
    weekdayBuckets: Array.isArray(summaryDoc.weekdayBuckets) ? summaryDoc.weekdayBuckets : [],
    dataCounts: summaryDoc.dataCounts || {},
    missingVideoIds: Array.isArray(summaryDoc.missingVideoIds) ? summaryDoc.missingVideoIds : [],
    excel: summaryDoc?.excel
      ? {
          fileName: summaryDoc.excel.fileName,
          mimeType: summaryDoc.excel.mimeType,
          sizeBytes: summaryDoc.excel.sizeBytes,
          generatedAt: summaryDoc.excel.generatedAt,
        }
      : null,
    rows,
  };
}

async function loadLatestReport({ reportsColl, userId, channelId }) {
  const summaryQuery = {
    userId,
    platform: REPORT_PLATFORM,
    reportSection: REPORT_SECTION,
    reportType: REPORT_TYPE,
    kind: "summary",
    ...(channelId ? { channelId } : {}),
  };

  const summaryDoc = await reportsColl.find(summaryQuery).sort({ generatedAt: -1 }).limit(1).next();
  if (!summaryDoc) return null;

  const rowDocs = await reportsColl
    .find({
      reportId: summaryDoc.reportId,
      kind: "video_row",
      userId,
      channelId: summaryDoc.channelId,
    })
    .sort({ "row.publishedAt": 1, "row.index": 1 })
    .project({ row: 1, _id: 0 })
    .toArray();

  const rows = rowDocs.map((doc) => doc.row).filter(Boolean);
  return mapSummaryDocToResponse(summaryDoc, rows);
}

async function generateYoutubeTimePostingReportData({ userId, channelId }) {
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const reportsColl = db.collection(REPORT_COLLECTION);

  const youtubeAccounts = await accountsColl
    .find({ userId, platform: "youtube" })
    .sort({ updatedAt: -1 })
    .toArray();

  if (!youtubeAccounts.length) {
    const err = new Error("YouTube account not connected for this user");
    err.statusCode = 404;
    throw err;
  }

  const account = resolveYouTubeAccount(youtubeAccounts, channelId);
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

  const target = resolveTargetChannel(account, channelId);
  if (!target?.channelId) {
    const err = new Error("Unable to resolve YouTube channel for report generation.");
    err.statusCode = 400;
    throw err;
  }

  const tokenContext = { account, accountsColl };

  const channelPayload = await runWithFreshToken(tokenContext, (accessToken) =>
    fetchChannelPayload({
      accessToken,
      channelId: target.channelId,
    })
  );

  const channel = channelPayload.channel;
  const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    const err = new Error("YouTube channel uploads playlist not found");
    err.statusCode = 404;
    throw err;
  }

  const playlistPayload = await runWithFreshToken(tokenContext, (accessToken) =>
    fetchAllPlaylistItems({
      accessToken,
      uploadsPlaylistId,
    })
  );

  const playlistItems = Array.isArray(playlistPayload.items) ? playlistPayload.items : [];
  const playlistPages = Array.isArray(playlistPayload.pages) ? playlistPayload.pages : [];

  const videoIds = playlistItems
    .map((item) => String(item?.contentDetails?.videoId || "").trim())
    .filter(Boolean);

  const videoPayload = await runWithFreshToken(tokenContext, (accessToken) =>
    fetchVideoDetails({
      accessToken,
      videoIds,
    })
  );

  const videoMap = videoPayload.map;
  const videoPages = Array.isArray(videoPayload.pages) ? videoPayload.pages : [];

  const { rows, missingVideoIds } = buildVideoRows({
    playlistItems,
    videoMap,
    channelName: String(channel?.snippet?.title || target.channelName || "YouTube"),
  });

  const generatedAt = new Date();
  const generatedAtIso = generatedAt.toISOString();
  const summary = buildSummary(rows, generatedAtIso);
  const hourlyBuckets = computeHourlyBuckets(rows);
  const weekdayBuckets = computeWeekdayBuckets(rows);
  const analysis = buildAnalysis(rows, hourlyBuckets, weekdayBuckets);

  const fileDate = generatedAtIso.slice(0, 10);
  const safeChannelName = sanitizeFileNamePart(channel?.snippet?.title || target.channelName || target.channelId);
  const fileName = `youtube-time-of-posting-${safeChannelName}-${fileDate}.xlsx`;

  const excelBuffer = await buildExcelBuffer({
    channelName: String(channel?.snippet?.title || target.channelName || "YouTube"),
    summary,
    analysis,
    rows,
    hourlyBuckets,
    weekdayBuckets,
  });

  const reportId = crypto.randomUUID();
  await persistReportData({
    reportsColl,
    userId,
    channelId: target.channelId,
    channelName: String(channel?.snippet?.title || target.channelName || "YouTube"),
    platformUserId: String(account?.platformUserId || ""),
    generatedAt,
    reportId,
    summary,
    analysis,
    hourlyBuckets,
    weekdayBuckets,
    rows,
    channelRaw: channelPayload?.rawResponse || null,
    playlistPages,
    videoPages,
    missingVideoIds,
    excel: {
      fileName,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      sizeBytes: excelBuffer.length,
      base64: excelBuffer.toString("base64"),
    },
  });

  return {
    reportId,
    userId,
    platform: REPORT_PLATFORM,
    reportSection: REPORT_SECTION,
    reportType: REPORT_TYPE,
    channelId: target.channelId,
    channelName: String(channel?.snippet?.title || target.channelName || "YouTube"),
    platformUserId: String(account?.platformUserId || ""),
    generatedAt: generatedAtIso,
    summary,
    analysis,
    hourlyBuckets,
    weekdayBuckets,
    dataCounts: {
      videoRows: rows.length,
      missingVideoIds: missingVideoIds.length,
      playlistPages: playlistPages.length,
      videoPages: videoPages.length,
    },
    missingVideoIds,
    excel: {
      fileName,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      sizeBytes: excelBuffer.length,
      generatedAt: generatedAtIso,
    },
    rows: rows.map((row) => mapRowForResponse(row)),
  };
}

export async function generateYoutubeTimePostingReport(req, res) {
  const userId = String(req.body?.userId ?? req.query?.userId ?? "").trim();
  const channelId = String(req.body?.channelId ?? req.query?.channelId ?? "").trim();

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const report = await generateYoutubeTimePostingReportData({ userId, channelId });
    return res.json({ ok: true, report });
  } catch (err) {
    console.error("generateYoutubeTimePostingReport error:", err);
    const status = Number(err?.statusCode);
    const safeStatus = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
    return res.status(safeStatus).json({
      error: "Failed to generate YouTube time-of-posting report",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

export async function getYoutubeTimePostingReport(req, res) {
  const userId = String(req.query?.userId ?? req.body?.userId ?? "").trim();
  const channelId = String(req.query?.channelId ?? req.body?.channelId ?? "").trim();

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const db = await getDb();
    const reportsColl = db.collection(REPORT_COLLECTION);
    const report = await loadLatestReport({ reportsColl, userId, channelId: channelId || null });
    return res.json({ ok: true, report: report || null });
  } catch (err) {
    console.error("getYoutubeTimePostingReport error:", err);
    return res.status(500).json({ error: "Failed to load report", report: null });
  }
}

export async function downloadYoutubeTimePostingReportExcel(req, res) {
  const userId = String(req.query?.userId ?? "").trim();
  const channelId = String(req.query?.channelId ?? "").trim();

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const db = await getDb();
    const reportsColl = db.collection(REPORT_COLLECTION);

    const summaryQuery = {
      userId,
      platform: REPORT_PLATFORM,
      reportSection: REPORT_SECTION,
      reportType: REPORT_TYPE,
      kind: "summary",
      ...(channelId ? { channelId } : {}),
    };

    const summaryDoc = await reportsColl.find(summaryQuery).sort({ generatedAt: -1 }).limit(1).next();
    if (!summaryDoc?.excel?.base64) {
      return res.status(404).json({ error: "Excel file not found. Generate report first." });
    }

    const fileName = String(summaryDoc?.excel?.fileName || "youtube-time-of-posting.xlsx");
    const mimeType =
      String(summaryDoc?.excel?.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const buffer = Buffer.from(String(summaryDoc.excel.base64), "base64");

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
    res.setHeader("Content-Length", String(buffer.length));
    return res.send(buffer);
  } catch (err) {
    console.error("downloadYoutubeTimePostingReportExcel error:", err);
    return res.status(500).json({ error: "Failed to download report excel" });
  }
}
