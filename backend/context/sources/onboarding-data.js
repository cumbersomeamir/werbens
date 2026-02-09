/**
 * Onboarding data source - extracts onboarding data from MongoDB
 */
import { getDb } from "../../db.js";

/**
 * Extract onboarding data for a user
 * @param {string} userId
 * @returns {Promise<string>} Formatted text string
 */
export async function getOnboardingData(userId) {
  try {
    const db = await getDb();
    const collection = db.collection("Onboarding");
    
    const doc = await collection.findOne({ userId });
    
    if (!doc) {
      return "No onboarding data found.";
    }

    let text = "=== ONBOARDING DATA ===\n\n";
    
    if (doc.username) {
      text += `Username: ${doc.username}\n`;
    }
    
    if (doc.platforms && Array.isArray(doc.platforms) && doc.platforms.length > 0) {
      text += `Platforms: ${doc.platforms.join(", ")}\n`;
    }
    
    if (doc.business) {
      text += "\n--- Business Information ---\n";
      if (doc.business.name) text += `Business Name: ${doc.business.name}\n`;
      if (doc.business.type) text += `Business Type: ${doc.business.type}\n`;
      if (doc.business.description) text += `Description: ${doc.business.description}\n`;
      if (doc.business.industry) text += `Industry: ${doc.business.industry}\n`;
      if (doc.business.website) text += `Website: ${doc.business.website}\n`;
    }
    
    if (doc.goals && Array.isArray(doc.goals) && doc.goals.length > 0) {
      text += "\n--- Goals ---\n";
      doc.goals.forEach((goal, idx) => {
        text += `${idx + 1}. ${goal}\n`;
      });
    }
    
    if (doc.completedAt) {
      text += `\nCompleted At: ${doc.completedAt}\n`;
    }
    
    return text;
  } catch (err) {
    console.error("Error extracting onboarding data:", err.message);
    return "Error extracting onboarding data.";
  }
}
