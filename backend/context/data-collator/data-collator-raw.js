/**
 * Data Collator Raw - aggregates all source data into a single text file
 */
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getOnboardingData } from "../sources/onboarding-data.js";
import { getXData } from "../sources/x-data.js";
import { getInstagramData } from "../sources/instagram-data.js";
import { getYouTubeData } from "../sources/youtube-data.js";
import { getLinkedInData } from "../sources/linkedin-data.js";
import { getPinterestData } from "../sources/pinterest-data.js";
import { getFacebookData } from "../sources/facebook-data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, "..", "..", "..", "temp");
const OUTPUT_FILE = join(OUTPUT_DIR, "all-context-raw.txt");

/**
 * Collate all source data into raw text
 * @param {string} userId
 * @returns {Promise<string>} Aggregated text content
 */
export async function collateRawContext(userId) {
  try {
    // Collect data from all sources
    const [
      onboardingText,
      xText,
      instagramText,
      youtubeText,
      linkedinText,
      pinterestText,
      facebookText,
    ] = await Promise.all([
      getOnboardingData(userId),
      getXData(userId),
      getInstagramData(userId),
      getYouTubeData(userId),
      getLinkedInData(userId),
      getPinterestData(userId),
      getFacebookData(userId),
    ]);

    // Combine all text
    const aggregatedText = [
      onboardingText,
      "\n\n",
      xText,
      "\n\n",
      instagramText,
      "\n\n",
      youtubeText,
      "\n\n",
      linkedinText,
      "\n\n",
      pinterestText,
      "\n\n",
      facebookText,
    ].join("");

    // Ensure output directory exists
    try {
      await mkdir(OUTPUT_DIR, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore
    }

    // Write to file
    await writeFile(OUTPUT_FILE, aggregatedText, "utf-8");

    return aggregatedText;
  } catch (err) {
    console.error("Error collating raw context:", err);
    throw err;
  }
}

/**
 * Get the path to the raw context file
 * @returns {string} File path
 */
export function getRawContextFilePath() {
  return OUTPUT_FILE;
}
