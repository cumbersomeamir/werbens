/**
 * Collate raw automatic context - combines onboarding + platform context
 */
import { getOnboardingSource } from "../sources/onboarding-source.js";
import { getPlatformContext, getPlatformSpecificContext } from "../sources/platform-source.js";
import { getRawPlatformData } from "../sources/raw-platform-source.js";

/**
 * Collate raw context for automatic generation
 * @param {string} userId
 * @param {string} [platform] - e.g. "x", "instagram". If empty, uses general only.
 * @returns {Promise<string>} Raw text for prompt/LLM
 */
export async function collateAutomaticRaw(userId, platform) {
  const [onboardingText, platformCtx] = await Promise.all([
    getOnboardingSource(userId),
    getPlatformContext(userId),
  ]);

  const platformSpecific = getPlatformSpecificContext(platformCtx, platform || "");

  let raw = `=== ONBOARDING ===\n${onboardingText}\n\n`;

  if (platformSpecific) {
    raw += `=== PLATFORM CONTEXT ${platform ? `(${platform})` : ""} ===\n${platformSpecific}\n\n`;
  }

  // If platform context is sparse or empty, add raw platform data for richer platform-specific signal
  if (platform && (!platformSpecific || platformSpecific.length < 300)) {
    const rawPlatform = await getRawPlatformData(userId, platform);
    if (rawPlatform && rawPlatform.length > 30) {
      raw += `=== RAW ${platform.toUpperCase()} DATA (posts, profile, media) ===\n${rawPlatform}\n`;
    }
  }

  return raw;
}
