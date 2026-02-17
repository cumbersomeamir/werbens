/**
 * Get automatic context - main entry for automatic generation
 * Combines onboarding + platform context for prompt generation
 */
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { collateAutomaticRaw } from "./collator/collate-automatic-raw.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMP_DIR = join(__dirname, "..", "temp");

/**
 * Get context for automatic generation
 * @param {string} userId
 * @param {string} [platform] - e.g. "x", "instagram". Default: use priority from onboarding.
 * @returns {Promise<{ rawText: string, platform: string }>}
 */
export async function getAutomaticContext(userId, platform) {
  if (!userId) throw new Error("userId is required");

  // Resolve platform: use provided or fetch from onboarding
  let resolvedPlatform = platform;
  if (!resolvedPlatform) {
    const { getDb } = await import("../db.js");
    const db = await getDb();
    const onboarding = await db.collection("Onboarding").findOne({ userId: userId.trim() });
    resolvedPlatform = onboarding?.priorityPlatform || "";
  }

  const rawText = await collateAutomaticRaw(userId, resolvedPlatform);

  // Write to temp for inspection
  try {
    await mkdir(TEMP_DIR, { recursive: true });
    const outPath = join(TEMP_DIR, `automatic-context-raw-${userId.replace(/[^a-zA-Z0-9]/g, "_")}.txt`);
    await writeFile(outPath, rawText, "utf-8");
  } catch (err) {
    // Non-fatal
  }

  return { rawText, platform: resolvedPlatform };
}
