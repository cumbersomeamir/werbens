/**
 * Social media API service
 */
import { get, post, patch, del } from "../client.js";
import { API_BASE } from "../client.js";
import { API_ENDPOINTS } from "../endpoints.js";

/**
 * Get social accounts for a user
 * @param {string} userId
 * @returns {Promise<{accounts: Array}>}
 */
export async function getSocialAccounts(userId) {
  if (!userId) return { accounts: [] };
  return get(`${API_ENDPOINTS.SOCIAL_ACCOUNTS}?userId=${encodeURIComponent(userId)}`);
}

/**
 * Get social analytics data
 * @param {string} userId
 * @returns {Promise<{data: Array}>}
 */
export async function getSocialAnalytics(userId) {
  if (!userId) return { data: [] };
  return get(`${API_ENDPOINTS.SOCIAL_ANALYTICS}?userId=${encodeURIComponent(userId)}`);
}

/**
 * Disconnect a social account
 * @param {string} userId
 * @param {string} platform
 * @returns {Promise<{success: boolean}>}
 */
export async function disconnectAccount(userId, platform) {
  if (!userId || !platform) throw new Error("Missing userId or platform");
  const accountId = arguments.length >= 3 ? arguments[2] : null;
  const channelId = arguments.length >= 4 ? arguments[3] : null;
  const q = new URLSearchParams({ userId: String(userId) });
  if (accountId) q.set("accountId", String(accountId));
  if (channelId) q.set("channelId", String(channelId));
  return del(`${API_ENDPOINTS.SOCIAL_ACCOUNT_DISCONNECT(platform)}?${q.toString()}`);
}

/**
 * Get OAuth auth URL for a platform
 * @param {string} platform - 'x', 'youtube', 'linkedin', 'pinterest', 'meta', 'instagram'
 * @param {string} userId
 * @returns {Promise<string>} Auth URL
 */
export async function getAuthUrl(platform, userId) {
  if (!userId) throw new Error("Not signed in");

  const endpointMap = {
    x: API_ENDPOINTS.SOCIAL_X_AUTH_URL,
    youtube: API_ENDPOINTS.SOCIAL_YOUTUBE_AUTH_URL,
    linkedin: API_ENDPOINTS.SOCIAL_LINKEDIN_AUTH_URL,
    pinterest: API_ENDPOINTS.SOCIAL_PINTEREST_AUTH_URL,
    facebook: API_ENDPOINTS.SOCIAL_META_AUTH_URL,
    meta: API_ENDPOINTS.SOCIAL_META_AUTH_URL,
    instagram: API_ENDPOINTS.SOCIAL_INSTAGRAM_AUTH_URL,
  };

  const endpoint = endpointMap[platform.toLowerCase()];
  if (!endpoint) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const data = await get(`${endpoint}?userId=${encodeURIComponent(userId)}`);
  return data.url;
}

/**
 * Sync social platform data
 * @param {string} userId
 * @param {string} platform
 * @returns {Promise<Object>}
 */
export async function syncSocialPlatform(userId, platform) {
  if (!userId || !platform) throw new Error("Missing userId or platform");

  const syncEndpointMap = {
    x: API_ENDPOINTS.SOCIAL_X_SYNC,
    youtube: API_ENDPOINTS.SOCIAL_YOUTUBE_SYNC,
    linkedin: API_ENDPOINTS.SOCIAL_LINKEDIN_SYNC,
    pinterest: API_ENDPOINTS.SOCIAL_PINTEREST_SYNC,
    facebook: API_ENDPOINTS.SOCIAL_META_SYNC,
    meta: API_ENDPOINTS.SOCIAL_META_SYNC,
    instagram: API_ENDPOINTS.SOCIAL_INSTAGRAM_SYNC,
  };

  const endpoint = syncEndpointMap[platform.toLowerCase()];
  if (!endpoint) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  try {
    return await post(endpoint, { userId });
  } catch (error) {
    // Fallback for Instagram: try Meta sync if standalone Instagram fails
    if (platform.toLowerCase() === "instagram" && error.status === 404) {
      return post(API_ENDPOINTS.SOCIAL_META_SYNC, { userId });
    }
    throw error;
  }
}

/**
 * Run YouTube comment replier (auto mode by default).
 * Backend replies to up to 3 unreplied comments in one call.
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {string} [options.channelId]
 * @param {string} [options.commentId] - optional single-comment mode
 * @param {string} [options.commentText] - optional for single-comment mode
 * @param {string} [options.authorName]
 * @param {string} [options.platformUserId]
 * @returns {Promise<Object>}
 */
export async function runYoutubeCommentReplier(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  const payload = { userId };
  if (options.channelId) payload.channelId = options.channelId;
  if (options.commentId) payload.commentId = options.commentId;
  if (options.commentText) payload.commentText = options.commentText;
  if (options.authorName) payload.authorName = options.authorName;
  if (options.platformUserId) payload.platformUserId = options.platformUserId;
  return post(API_ENDPOINTS.SOCIAL_YOUTUBE_REPLY, payload);
}

/**
 * Build EventSource URL for streaming YouTube comment reply job progress.
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {string} [options.channelId]
 * @param {string} [options.commentId]
 * @param {string} [options.commentText]
 * @param {string} [options.authorName]
 * @param {string} [options.platformUserId]
 * @returns {string}
 */
export function getYoutubeCommentReplierStreamUrl(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  const q = new URLSearchParams({ userId: String(userId) });
  if (options.channelId) q.set("channelId", String(options.channelId));
  if (options.commentId) q.set("commentId", String(options.commentId));
  if (options.commentText) q.set("commentText", String(options.commentText));
  if (options.authorName) q.set("authorName", String(options.authorName));
  if (options.platformUserId) q.set("platformUserId", String(options.platformUserId));
  return `${API_BASE}${API_ENDPOINTS.SOCIAL_YOUTUBE_REPLY_STREAM}?${q.toString()}`;
}

/**
 * Generate and persist YouTube time-of-posting report.
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {string} [options.channelId]
 * @returns {Promise<{ok: boolean, report: Object | null}>}
 */
export async function generateYoutubeTimePostingReport(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  const payload = { userId };
  if (options.channelId) payload.channelId = options.channelId;
  return post(API_ENDPOINTS.SOCIAL_YOUTUBE_REPORT_TIME_POSTING, payload);
}

/**
 * Load latest stored YouTube time-of-posting report.
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {string} [options.channelId]
 * @returns {Promise<{ok: boolean, report: Object | null}>}
 */
export async function getYoutubeTimePostingReport(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  const q = new URLSearchParams({ userId: String(userId) });
  if (options.channelId) q.set("channelId", String(options.channelId));
  return get(`${API_ENDPOINTS.SOCIAL_YOUTUBE_REPORT_TIME_POSTING}?${q.toString()}`);
}

/**
 * Build download URL for latest YouTube time-of-posting Excel report.
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {string} [options.channelId]
 * @returns {string}
 */
export function getYoutubeTimePostingReportExcelUrl(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  const q = new URLSearchParams({ userId: String(userId) });
  if (options.channelId) q.set("channelId", String(options.channelId));
  return `${API_BASE}${API_ENDPOINTS.SOCIAL_YOUTUBE_REPORT_TIME_POSTING_EXCEL}?${q.toString()}`;
}

/**
 * Load YouTube ideation-engine dashboard data.
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {string} [options.channelId]
 * @returns {Promise<Object>}
 */
export async function getYoutubeIdeationDashboard(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  const q = new URLSearchParams({ userId: String(userId) });
  if (options.channelId) q.set("channelId", String(options.channelId));
  return get(`${API_ENDPOINTS.SOCIAL_YOUTUBE_IDEATION_ENGINE}?${q.toString()}`);
}

/**
 * Search YouTube channels for ideation-engine tracking/discovery.
 *
 * @param {string} userId
 * @param {string} query
 * @param {Object} [options]
 * @param {string} [options.channelId]
 * @returns {Promise<{ok: boolean, results: Array}>}
 */
export async function searchYoutubeIdeationChannels(userId, query, options = {}) {
  if (!userId) throw new Error("Missing userId");
  const q = new URLSearchParams({ userId: String(userId), q: String(query || "") });
  if (options.channelId) q.set("channelId", String(options.channelId));
  return get(`${API_ENDPOINTS.SOCIAL_YOUTUBE_IDEATION_ENGINE_SEARCH}?${q.toString()}`);
}

/**
 * Add a tracked YouTube channel in ideation-engine.
 *
 * @param {string} userId
 * @param {Object} options
 * @param {string} options.channelId
 * @param {string} options.trackedChannelId
 * @param {string} [options.addedBy]
 * @returns {Promise<Object>}
 */
export async function addYoutubeIdeationTrackedChannel(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  if (!options.trackedChannelId) throw new Error("Missing trackedChannelId");
  return post(API_ENDPOINTS.SOCIAL_YOUTUBE_IDEATION_ENGINE_TRACKED, {
    userId,
    channelId: options.channelId || "",
    trackedChannelId: options.trackedChannelId,
    addedBy: options.addedBy || "manual",
  });
}

/**
 * Remove a tracked YouTube channel in ideation-engine.
 *
 * @param {string} userId
 * @param {Object} options
 * @param {string} options.channelId
 * @param {string} options.trackedChannelId
 * @returns {Promise<Object>}
 */
export async function removeYoutubeIdeationTrackedChannel(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  if (!options.trackedChannelId) throw new Error("Missing trackedChannelId");
  const q = new URLSearchParams({
    userId: String(userId),
    trackedChannelId: String(options.trackedChannelId),
  });
  if (options.channelId) q.set("channelId", String(options.channelId));
  return del(`${API_ENDPOINTS.SOCIAL_YOUTUBE_IDEATION_ENGINE_TRACKED}?${q.toString()}`);
}

/**
 * Create scheduled social post(s).
 *
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function createScheduledPost(payload) {
  if (!payload?.userId) throw new Error("Missing userId");
  return post(API_ENDPOINTS.SOCIAL_POST_SCHEDULE, payload);
}

/**
 * Get scheduled posts for a user.
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {string} [options.start] ISO date
 * @param {string} [options.end] ISO date
 * @param {string} [options.status] comma-separated statuses
 * @returns {Promise<Object>}
 */
export async function getScheduledPosts(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  const q = new URLSearchParams({ userId: String(userId) });
  if (options.start) q.set("start", String(options.start));
  if (options.end) q.set("end", String(options.end));
  if (options.status) q.set("status", String(options.status));
  return get(`${API_ENDPOINTS.SOCIAL_POST_SCHEDULE}?${q.toString()}`);
}

/**
 * Cancel a scheduled post by id.
 *
 * @param {string} userId
 * @param {string} scheduledPostId
 * @returns {Promise<Object>}
 */
export async function deleteScheduledPost(userId, scheduledPostId) {
  if (!userId) throw new Error("Missing userId");
  if (!scheduledPostId) throw new Error("Missing scheduledPostId");
  const q = new URLSearchParams({ userId: String(userId) });
  return del(`${API_ENDPOINTS.SOCIAL_POST_SCHEDULE}/${encodeURIComponent(String(scheduledPostId))}?${q.toString()}`);
}

/**
 * Get feedback-loop dashboard.
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {string} [options.channelId]
 * @returns {Promise<Object>}
 */
export async function getFeedbackLoopDashboard(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  const q = new URLSearchParams({ userId: String(userId) });
  if (options.channelId) q.set("channelId", String(options.channelId));
  return get(`${API_ENDPOINTS.FEEDBACK_LOOP_DASHBOARD}?${q.toString()}`);
}

/**
 * Get feedback-loop config.
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {string} [options.channelId]
 * @returns {Promise<{ok:boolean, config:Object}>}
 */
export async function getFeedbackLoopConfig(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  const q = new URLSearchParams({ userId: String(userId) });
  if (options.channelId) q.set("channelId", String(options.channelId));
  return get(`${API_ENDPOINTS.FEEDBACK_LOOP_CONFIG}?${q.toString()}`);
}

/**
 * Update feedback-loop config.
 *
 * @param {string} userId
 * @param {Object} options
 * @param {string} [options.channelId]
 * @param {Object} [options.patch]
 * @returns {Promise<{ok:boolean, config:Object}>}
 */
export async function updateFeedbackLoopConfig(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  return patch(API_ENDPOINTS.FEEDBACK_LOOP_CONFIG, {
    userId,
    channelId: options.channelId || "",
    patch: options.patch && typeof options.patch === "object" ? options.patch : {},
  });
}

/**
 * Start autonomous feedback loop.
 */
export async function startFeedbackLoop(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  return post(API_ENDPOINTS.FEEDBACK_LOOP_START, {
    userId,
    channelId: options.channelId || "",
  });
}

/**
 * Pause autonomous feedback loop.
 */
export async function pauseFeedbackLoop(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  return post(API_ENDPOINTS.FEEDBACK_LOOP_PAUSE, {
    userId,
    channelId: options.channelId || "",
  });
}

/**
 * Trigger full feedback cycle (generation -> scheduling).
 */
export async function triggerFeedbackLoop(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  return post(API_ENDPOINTS.FEEDBACK_LOOP_TRIGGER, {
    userId,
    channelId: options.channelId || "",
    quickTest: Boolean(options.quickTest),
    testTextOnly: options.testTextOnly === undefined ? true : Boolean(options.testTextOnly),
    testSpacingMinutes:
      options.testSpacingMinutes === undefined
        ? 1
        : Math.max(1, Math.min(60, Math.round(Number(options.testSpacingMinutes) || 1))),
  });
}

/**
 * Trigger generation preview (no publishing).
 */
export async function generateFeedbackLoopPreview(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  return post(API_ENDPOINTS.FEEDBACK_LOOP_GENERATE_PREVIEW, {
    userId,
    channelId: options.channelId || "",
  });
}

/**
 * List generation history.
 */
export async function getFeedbackLoopGenerationHistory(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  const q = new URLSearchParams({ userId: String(userId) });
  if (options.channelId) q.set("channelId", String(options.channelId));
  if (options.limit) q.set("limit", String(options.limit));
  return get(`${API_ENDPOINTS.FEEDBACK_LOOP_GENERATION_HISTORY}?${q.toString()}`);
}

/**
 * List feedback-loop runs.
 */
export async function getFeedbackLoopRuns(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  const q = new URLSearchParams({ userId: String(userId) });
  if (options.channelId) q.set("channelId", String(options.channelId));
  if (options.limit) q.set("limit", String(options.limit));
  return get(`${API_ENDPOINTS.FEEDBACK_LOOP_RUNS}?${q.toString()}`);
}

/**
 * List feedback-loop tasks.
 */
export async function getFeedbackLoopTasks(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  const q = new URLSearchParams({ userId: String(userId) });
  if (options.channelId) q.set("channelId", String(options.channelId));
  if (options.limit) q.set("limit", String(options.limit));
  return get(`${API_ENDPOINTS.FEEDBACK_LOOP_TASKS}?${q.toString()}`);
}

/**
 * List feedback-loop posts.
 */
export async function getFeedbackLoopPosts(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  const q = new URLSearchParams({ userId: String(userId) });
  if (options.channelId) q.set("channelId", String(options.channelId));
  if (options.limit) q.set("limit", String(options.limit));
  return get(`${API_ENDPOINTS.FEEDBACK_LOOP_POSTS}?${q.toString()}`);
}

/**
 * Manual task tick for delayed checkpoints.
 */
export async function runFeedbackLoopTasks(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  return post(API_ENDPOINTS.FEEDBACK_LOOP_TASKS_RUN, {
    userId,
    channelId: options.channelId || "",
    limit: options.limit || 40,
  });
}

/**
 * Manual autonomous tick trigger.
 */
export async function runFeedbackLoopAutonomous(userId, options = {}) {
  if (!userId) throw new Error("Missing userId");
  return post(API_ENDPOINTS.FEEDBACK_LOOP_AUTONOMOUS_RUN, {
    userId,
    channelId: options.channelId || "",
    limit: options.limit || 8,
  });
}

// Legacy exports for backward compatibility
export const getXAuthUrl = (userId) => getAuthUrl("x", userId);
export const getYoutubeAuthUrl = (userId) => getAuthUrl("youtube", userId);
export const getLinkedInAuthUrl = (userId) => getAuthUrl("linkedin", userId);
export const getPinterestAuthUrl = (userId) => getAuthUrl("pinterest", userId);
export const getMetaAuthUrl = (userId) => getAuthUrl("meta", userId);
export const getInstagramAuthUrl = (userId) => getAuthUrl("instagram", userId);
