/**
 * Platform source - reads Context collection (Gemini-summarized platform data)
 */
import { getDb } from "../../db.js";

const PLATFORM_KEYS = ["x", "instagram", "youtube", "linkedin", "pinterest", "facebook"];

/**
 * Get platform context from Context collection
 * @param {string} userId
 * @returns {Promise<{ general_context: string, x_context: string, instagram_context: string, ... }>}
 */
export async function getPlatformContext(userId) {
  const db = await getDb();
  const doc = await db.collection("Context").findOne({ userId: userId.trim() });

  if (!doc) {
    const empty = { general_context: "" };
    PLATFORM_KEYS.forEach((p) => {
      empty[`${p}_context`] = "";
    });
    return empty;
  }

  const result = {
    general_context: (doc.general_context || "").trim(),
  };
  PLATFORM_KEYS.forEach((p) => {
    const key = `${p}_context`;
    result[key] = (doc[key] || "").trim();
  });

  return result;
}

/**
 * Get context for a specific platform, with fallback to general
 * @param {Object} ctx - Result from getPlatformContext
 * @param {string} platform - e.g. "x", "instagram"
 * @returns {string}
 */
export function getPlatformSpecificContext(ctx, platform) {
  if (!platform) return ctx.general_context || "";
  const key = `${platform}_context`;
  const platformCtx = ctx[key] || "";
  const general = ctx.general_context || "";
  if (platformCtx) return `${general}\n\nPlatform (${platform}): ${platformCtx}`;
  return general;
}
