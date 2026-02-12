/**
 * Raw platform source - reads SocialMedia when Context has little data
 */
import { getXData } from "../../context/sources/x-data.js";
import { getInstagramData } from "../../context/sources/instagram-data.js";
import { getYouTubeData } from "../../context/sources/youtube-data.js";
import { getLinkedInData } from "../../context/sources/linkedin-data.js";
import { getPinterestData } from "../../context/sources/pinterest-data.js";
import { getFacebookData } from "../../context/sources/facebook-data.js";

const SOURCES = {
  x: getXData,
  instagram: getInstagramData,
  youtube: getYouTubeData,
  linkedin: getLinkedInData,
  pinterest: getPinterestData,
  facebook: getFacebookData,
};

/**
 * Get raw platform data for a specific platform
 * @param {string} userId
 * @param {string} platform
 * @returns {Promise<string>}
 */
export async function getRawPlatformData(userId, platform) {
  const fn = SOURCES[platform];
  if (!fn) return "";
  return fn(userId);
}
