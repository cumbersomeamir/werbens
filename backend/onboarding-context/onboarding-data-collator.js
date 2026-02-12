/**
 * Onboarding data collator - compiles onboarding context and saves to Onboarding.general_onboarding_context
 * 
 * This creates a formatted, comprehensive text representation of the user's onboarding choices
 * and saves it to the Onboarding collection for use in prompt injection (e.g., /automatic page).
 */

import { getDb } from "../db.js";
import { getOnboardingContext } from "./getOnboardingContext.js";

/**
 * Collate onboarding data and save general_onboarding_context to Onboarding collection
 * @param {string} userId
 * @returns {Promise<string>} The compiled general_onboarding_context text
 */
export async function collateAndSaveOnboardingContext(userId) {
  try {
    if (!userId || typeof userId !== "string") {
      throw new Error("userId is required");
    }

    // Get formatted onboarding context text
    const onboardingContextText = await getOnboardingContext(userId);

    // Save to Onboarding collection
    const db = await getDb();
    const collection = db.collection("Onboarding");
    const now = new Date();

    await collection.updateOne(
      { userId: userId.trim() },
      {
        $set: {
          general_onboarding_context: onboardingContextText,
          onboardingContextUpdatedAt: now,
        },
      }
    );

    return onboardingContextText;
  } catch (err) {
    console.error("Error collating onboarding context:", err.message);
    throw err;
  }
}
