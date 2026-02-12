/**
 * Onboarding context - fetches onboarding data for a user only.
 * Kept separate from /context (platform data). Do not mix with platform sources.
 *
 * Returns: the questions we posed on onboarding and the user's choices (formatted text).
 */

import { getDb } from "../db.js";

/**
 * Fetch onboarding context for a user (onboarding questions + user choices).
 * @param {string} userId
 * @returns {Promise<string>} Formatted text string of onboarding data
 */
export async function getOnboardingContext(userId) {
  try {
    if (!userId || typeof userId !== "string") {
      return "No user ID provided.";
    }

    const db = await getDb();
    const collection = db.collection("Onboarding");
    const doc = await collection.findOne({ userId: userId.trim() });

    if (!doc) {
      return "No onboarding data found for this user.";
    }

    let text = "=== ONBOARDING (user choices) ===\n\n";

    // New schema (onboarding_v1)
    if (doc.source === "onboarding_v1" || doc.primaryRole != null) {
      if (doc.primaryRole) text += `Primary role: ${doc.primaryRole}\n`;
      if (doc.industries && doc.industries.length) text += `Industries: ${doc.industries.join(", ")}\n`;
      if (doc.audienceTypes && doc.audienceTypes.length) text += `Audience types: ${doc.audienceTypes.join(", ")}\n`;
      if (doc.primaryGoal) text += `Primary goal: ${doc.primaryGoal}\n`;
      if (doc.secondaryGoal) text += `Secondary goal: ${doc.secondaryGoal}\n`;
      if (doc.priorityPlatform) text += `Priority platform: ${doc.priorityPlatform}\n`;
      if (doc.postingCadence) text += `Posting cadence: ${doc.postingCadence}\n`;
      if (doc.visualVibes && doc.visualVibes.length) text += `Visual vibes: ${doc.visualVibes.join(", ")}\n`;
      if (doc.visualTheme) text += `Visual theme: ${doc.visualTheme}\n`;
      if (doc.complexityPreference != null) text += `Complexity preference: ${doc.complexityPreference}\n`;
      if (doc.showPeople != null) text += `Show people: ${doc.showPeople}\n`;
      if (doc.faceUsage) text += `Face usage: ${doc.faceUsage}\n`;
      if (doc.framing) text += `Framing: ${doc.framing}\n`;
      if (doc.tone) text += `Tone: ${doc.tone}\n`;
      if (doc.emojiLevel) text += `Emoji level: ${doc.emojiLevel}\n`;
      if (doc.ctaStyle) text += `CTA style: ${doc.ctaStyle}\n`;
      if (doc.formality != null) text += `Formality: ${doc.formality}\n`;
    } else {
      // Legacy schema
      if (doc.username) text += `Username: ${doc.username}\n`;
      if (doc.platforms && Array.isArray(doc.platforms) && doc.platforms.length > 0) {
        text += `Platforms: ${doc.platforms.join(", ")}\n`;
      }
      if (doc.business) {
        text += "\n--- Business Information ---\n";
        if (doc.business.businessName) text += `Business Name: ${doc.business.businessName}\n`;
        if (doc.business.businessType) text += `Business Type: ${doc.business.businessType}\n`;
        if (doc.business.website) text += `Website: ${doc.business.website}\n`;
      }
      if (doc.goals && Array.isArray(doc.goals) && doc.goals.length > 0) {
        text += "\n--- Goals ---\n";
        doc.goals.forEach((goal, idx) => {
          text += `${idx + 1}. ${goal}\n`;
        });
      }
    }

    if (doc.updatedAt) text += `\nUpdated At: ${doc.updatedAt}\n`;

    return text;
  } catch (err) {
    console.error("Error fetching onboarding context:", err.message);
    return "Error fetching onboarding context.";
  }
}
