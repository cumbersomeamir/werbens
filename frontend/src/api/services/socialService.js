/**
 * Social media API service
 */
import { get, post, del } from "../client.js";
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
  return del(`${API_ENDPOINTS.SOCIAL_ACCOUNT_DISCONNECT(platform)}?userId=${encodeURIComponent(userId)}`);
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

// Legacy exports for backward compatibility
export const getXAuthUrl = (userId) => getAuthUrl("x", userId);
export const getYoutubeAuthUrl = (userId) => getAuthUrl("youtube", userId);
export const getLinkedInAuthUrl = (userId) => getAuthUrl("linkedin", userId);
export const getPinterestAuthUrl = (userId) => getAuthUrl("pinterest", userId);
export const getMetaAuthUrl = (userId) => getAuthUrl("meta", userId);
export const getInstagramAuthUrl = (userId) => getAuthUrl("instagram", userId);
