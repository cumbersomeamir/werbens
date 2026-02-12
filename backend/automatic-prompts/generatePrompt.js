/**
 * Generate image prompt from context - single Gemini call, no placeholders
 */
import { GoogleGenAI } from "@google/genai";
import { getAutomaticContext } from "../automatic-context/getAutomaticContext.js";
import { BASE_INSTRUCTIONS } from "./templates/base.js";
import { X_GUIDELINES } from "./templates/platform-x.js";
import { INSTAGRAM_GUIDELINES } from "./templates/platform-instagram.js";
import { LINKEDIN_GUIDELINES } from "./templates/platform-linkedin.js";
import { YOUTUBE_GUIDELINES } from "./templates/platform-youtube.js";
import { FACEBOOK_GUIDELINES } from "./templates/platform-facebook.js";
import { PINTEREST_GUIDELINES } from "./templates/platform-pinterest.js";
import { DEFAULT_GUIDELINES } from "./templates/platform-default.js";
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMP_DIR = join(__dirname, "..", "temp");

const PLATFORM_GUIDELINES = {
  x: X_GUIDELINES,
  instagram: INSTAGRAM_GUIDELINES,
  linkedin: LINKEDIN_GUIDELINES,
  youtube: YOUTUBE_GUIDELINES,
  facebook: FACEBOOK_GUIDELINES,
  pinterest: PINTEREST_GUIDELINES,
};

/**
 * Generate image prompt for automatic content
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} [params.platform] - e.g. "x", "instagram". Default: priority from onboarding
 * @param {string} params.apiKey - Gemini API key
 * @returns {Promise<{ prompt: string, platform: string }>}
 */
export async function generatePrompt({ userId, platform, apiKey }) {
  if (!userId) throw new Error("userId is required");
  if (!apiKey) throw new Error("apiKey is required");

  const { rawText, platform: resolvedPlatform } = await getAutomaticContext(userId, platform);

  const platformGuidelines = PLATFORM_GUIDELINES[resolvedPlatform] || DEFAULT_GUIDELINES;

  // Platform FIRST + strong differentiation + onboarding + platform context
  const metaPrompt = [
    `=== TARGET PLATFORM: ${(resolvedPlatform || "general").toUpperCase()} ===`,
    "The image MUST be optimized for this platform. It must look distinctly different from other platforms.",
    "",
    platformGuidelines,
    "",
    BASE_INSTRUCTIONS,
    "",
    "=== USER CONTEXT (use this data - do not genericize) ===",
    rawText,
    "",
    "Output ONLY the image prompt. No other text, no labels, no explanation.",
  ].join("\n");

  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: metaPrompt }] }],
    config: {
      temperature: 0.8,
      maxOutputTokens: 300,
    },
  });

  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  let rawPrompt = parts.map((p) => p.text ?? "").join("").trim();

  // Strip common meta-prefixes
  rawPrompt = rawPrompt
    .replace(/^Prompt:\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();

  const prompt = rawPrompt || "A professional product image for social media.";

  // Write to temp for inspection
  try {
    await mkdir(TEMP_DIR, { recursive: true });
    const outPath = join(TEMP_DIR, `automatic-prompt-${userId.replace(/[^a-zA-Z0-9]/g, "_")}-${Date.now()}.txt`);
    await writeFile(outPath, `platform: ${resolvedPlatform}\n\nprompt:\n${prompt}`, "utf-8");
  } catch (err) {
    // Non-fatal
  }

  return { prompt, platform: resolvedPlatform };
}
