import { safeNumber, cloneForStorage, extractMetricBundle } from "../lib/utils.js";

const X_API_BASE = "https://api.x.com/2";
const X_FETCH_TIMEOUT_MS = Math.max(5000, Number(process.env.FEEDBACK_X_FETCH_TIMEOUT_MS) || 20000);

async function xFetchJson(url, { accessToken, method = "GET", headers = {}, body = null }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), X_FETCH_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...headers,
      },
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    throw new Error(`X API error ${response.status}: ${raw.slice(0, 300)}`);
  }

  return response.json();
}

export async function fetchLatestOwnTweets({ accessToken, channelId, limit = 25 }) {
  if (!accessToken || !channelId) return [];
  const maxResults = Math.max(5, Math.min(100, Number(limit) || 25));
  const url = `${X_API_BASE}/users/${encodeURIComponent(channelId)}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics,non_public_metrics,organic_metrics,text,conversation_id`;

  try {
    const data = await xFetchJson(url, { accessToken });
    const tweets = Array.isArray(data?.data) ? data.data : [];

    return tweets.map((tweet) => {
      const metrics = extractMetricBundle(tweet);
      return {
        id: String(tweet?.id || ""),
        text: String(tweet?.text || ""),
        createdAt: tweet?.created_at || null,
        metrics,
        raw: cloneForStorage(tweet),
      };
    });
  } catch (err) {
    return [];
  }
}

export async function fetchTweetMetricsById({ accessToken, postId }) {
  if (!accessToken || !postId) {
    return {
      status: "missing_inputs",
      metrics: null,
      raw: null,
    };
  }

  const url = `${X_API_BASE}/tweets/${encodeURIComponent(postId)}?tweet.fields=created_at,public_metrics,non_public_metrics,organic_metrics,text,conversation_id`;
  try {
    const data = await xFetchJson(url, { accessToken });
    const tweet = data?.data || null;
    if (!tweet) {
      return {
        status: "not_found",
        metrics: null,
        raw: cloneForStorage(data),
      };
    }

    return {
      status: "ok",
      metrics: extractMetricBundle(tweet),
      text: String(tweet?.text || ""),
      createdAt: tweet?.created_at || null,
      raw: cloneForStorage(tweet),
    };
  } catch (err) {
    return {
      status: "error",
      metrics: {
        likes: 0,
        replies: 0,
        reposts: 0,
        quotes: 0,
        bookmarks: 0,
        impressions: 0,
        engagementTotal: 0,
        engagementRate: 0,
      },
      raw: {
        error: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

function base64FromBuffer(buffer) {
  return Buffer.isBuffer(buffer) ? buffer.toString("base64") : Buffer.from(buffer || "").toString("base64");
}

export async function uploadMediaToX({ accessToken, imageBuffer, mimeType = "image/png" }) {
  if (!accessToken || !imageBuffer) return { mediaId: null, source: "missing_input" };

  const base64 = base64FromBuffer(imageBuffer);

  // Attempt modern endpoint first.
  try {
    const payload = {
      media: base64,
      media_type: mimeType,
    };

    const data = await xFetchJson(`${X_API_BASE}/media/upload`, {
      accessToken,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const mediaId = String(data?.data?.id || data?.id || "");
    if (mediaId) {
      return { mediaId, source: "v2_media_upload", raw: cloneForStorage(data) };
    }
  } catch {
    // Fall through to chunked endpoint attempt.
  }

  try {
    const uploadBase = "https://upload.twitter.com/1.1/media/upload.json";

    const initParams = new URLSearchParams({
      command: "INIT",
      total_bytes: String(imageBuffer.length),
      media_type: mimeType,
      media_category: "tweet_image",
    });

    const initController = new AbortController();
    const initTimeout = setTimeout(() => initController.abort(), X_FETCH_TIMEOUT_MS);
    const initRes = await fetch(uploadBase, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: initParams.toString(),
      signal: initController.signal,
    }).finally(() => clearTimeout(initTimeout));

    if (!initRes.ok) {
      const raw = await initRes.text().catch(() => "");
      throw new Error(`INIT failed ${initRes.status}: ${raw.slice(0, 250)}`);
    }

    const initData = await initRes.json();
    const mediaId = String(initData?.media_id_string || initData?.media_id || "");
    if (!mediaId) throw new Error("INIT returned no media id");

    const appendPayload = new FormData();
    appendPayload.append("command", "APPEND");
    appendPayload.append("media_id", mediaId);
    appendPayload.append("segment_index", "0");
    appendPayload.append("media_data", base64);

    const appendController = new AbortController();
    const appendTimeout = setTimeout(() => appendController.abort(), X_FETCH_TIMEOUT_MS);
    const appendRes = await fetch(uploadBase, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: appendPayload,
      signal: appendController.signal,
    }).finally(() => clearTimeout(appendTimeout));

    if (!appendRes.ok) {
      const raw = await appendRes.text().catch(() => "");
      throw new Error(`APPEND failed ${appendRes.status}: ${raw.slice(0, 250)}`);
    }

    const finalizeParams = new URLSearchParams({
      command: "FINALIZE",
      media_id: mediaId,
    });

    const finalizeController = new AbortController();
    const finalizeTimeout = setTimeout(() => finalizeController.abort(), X_FETCH_TIMEOUT_MS);
    const finalizeRes = await fetch(uploadBase, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: finalizeParams.toString(),
      signal: finalizeController.signal,
    }).finally(() => clearTimeout(finalizeTimeout));

    if (!finalizeRes.ok) {
      const raw = await finalizeRes.text().catch(() => "");
      throw new Error(`FINALIZE failed ${finalizeRes.status}: ${raw.slice(0, 250)}`);
    }

    const finalizeData = await finalizeRes.json().catch(() => ({}));
    return { mediaId, source: "v1_chunked", raw: cloneForStorage(finalizeData) };
  } catch (err) {
    return {
      mediaId: null,
      source: "upload_failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function summarizeRecentTweetPerformance(recentTweets) {
  const rows = Array.isArray(recentTweets) ? recentTweets : [];
  if (!rows.length) {
    return {
      sampleSize: 0,
      avgEngagementRate: 0,
      avgImpressions: 0,
      topSignals: [],
    };
  }

  const avgEngagementRate = rows.reduce((sum, row) => sum + safeNumber(row?.metrics?.engagementRate), 0) / rows.length;
  const avgImpressions = rows.reduce((sum, row) => sum + safeNumber(row?.metrics?.impressions), 0) / rows.length;
  const topByEngagement = rows
    .slice()
    .sort((a, b) => safeNumber(b?.metrics?.engagementRate) - safeNumber(a?.metrics?.engagementRate))
    .slice(0, 3)
    .map((item) => ({
      id: item?.id || "",
      text: String(item?.text || "").slice(0, 180),
      engagementRate: safeNumber(item?.metrics?.engagementRate),
    }));

  return {
    sampleSize: rows.length,
    avgEngagementRate: Number(avgEngagementRate.toFixed(4)),
    avgImpressions: Number(avgImpressions.toFixed(2)),
    topSignals: topByEngagement,
  };
}
