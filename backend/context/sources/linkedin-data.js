/**
 * LinkedIn data source - extracts LinkedIn data from MongoDB
 */
import { getDb } from "../../db.js";

/**
 * Extract LinkedIn data for a user
 * @param {string} userId
 * @returns {Promise<string>} Formatted text string
 */
export async function getLinkedInData(userId) {
  try {
    const db = await getDb();
    const collection = db.collection("SocialMedia");
    
    const docs = await collection.find({ userId, platform: "linkedin" }).toArray();
    
    if (!docs || docs.length === 0) {
      return "=== LINKEDIN DATA ===\n\nNo LinkedIn account connected.\n";
    }

    let text = "=== LINKEDIN DATA ===\n\n";
    
    docs.forEach((doc, idx) => {
      if (idx > 0) text += "\n--- Channel " + (idx + 1) + " ---\n";
      
      if (doc.username) text += `Username: ${doc.username}\n`;
      if (doc.channelId) text += `Channel ID: ${doc.channelId}\n`;
      
      if (doc.profile) {
        text += "\n--- Profile ---\n";
        if (doc.profile.name) text += `Name: ${doc.profile.name}\n`;
        if (doc.profile.given_name) text += `First Name: ${doc.profile.given_name}\n`;
        if (doc.profile.family_name) text += `Last Name: ${doc.profile.family_name}\n`;
        if (doc.profile.email) text += `Email: ${doc.profile.email}\n`;
        if (doc.profile.picture) text += `Profile Picture: ${doc.profile.picture}\n`;
      }
      
      if (doc.insights) {
        text += "\n--- Insights ---\n";
        if (doc.insights.connectionCount) text += `Connections: ${doc.insights.connectionCount}\n`;
        if (doc.insights.industry) text += `Industry: ${doc.insights.industry}\n`;
      }
      
      if (doc.lastFetchedAt) {
        text += `\nLast Fetched: ${doc.lastFetchedAt}\n`;
      }
    });
    
    return text;
  } catch (err) {
    console.error("Error extracting LinkedIn data:", err.message);
    return "=== LINKEDIN DATA ===\n\nError extracting LinkedIn data.\n";
  }
}
