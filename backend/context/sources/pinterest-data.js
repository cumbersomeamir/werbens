/**
 * Pinterest data source - extracts Pinterest data from MongoDB
 */
import { getDb } from "../../db.js";

/**
 * Extract Pinterest data for a user
 * @param {string} userId
 * @returns {Promise<string>} Formatted text string
 */
export async function getPinterestData(userId) {
  try {
    const db = await getDb();
    const collection = db.collection("SocialMedia");
    
    const docs = await collection.find({ userId, platform: "pinterest" }).toArray();
    
    if (!docs || docs.length === 0) {
      return "=== PINTEREST DATA ===\n\nNo Pinterest account connected.\n";
    }

    let text = "=== PINTEREST DATA ===\n\n";
    
    docs.forEach((doc, idx) => {
      if (idx > 0) text += "\n--- Channel " + (idx + 1) + " ---\n";
      
      if (doc.username) text += `Username: ${doc.username}\n`;
      if (doc.channelId) text += `Channel ID: ${doc.channelId}\n`;
      
      if (doc.profile) {
        text += "\n--- Profile ---\n";
        if (doc.profile.username) text += `Username: ${doc.profile.username}\n`;
        if (doc.profile.business_name) text += `Business Name: ${doc.profile.business_name}\n`;
        if (doc.profile.bio) text += `Bio: ${doc.profile.bio}\n`;
      }
      
      if (doc.boards && Array.isArray(doc.boards) && doc.boards.length > 0) {
        text += `\n--- Boards (${doc.boards.length}) ---\n`;
        doc.boards.slice(0, 10).forEach((board, i) => {
          if (board.name) text += `${i + 1}. ${board.name}\n`;
          if (board.description) text += `   ${board.description.substring(0, 150)}${board.description.length > 150 ? "..." : ""}\n`;
        });
      }
      
      if (doc.pins && Array.isArray(doc.pins) && doc.pins.length > 0) {
        text += `\n--- Recent Pins (${doc.pins.length}) ---\n`;
        doc.pins.slice(0, 10).forEach((pin, i) => {
          if (pin.title) text += `${i + 1}. ${pin.title}\n`;
          if (pin.description) text += `   ${pin.description.substring(0, 150)}${pin.description.length > 150 ? "..." : ""}\n`;
        });
      }
      
      if (doc.insights) {
        text += "\n--- Insights ---\n";
        if (doc.insights.totalPins) text += `Total Pins: ${doc.insights.totalPins}\n`;
        if (doc.insights.totalBoards) text += `Total Boards: ${doc.insights.totalBoards}\n`;
      }
      
      if (doc.lastFetchedAt) {
        text += `\nLast Fetched: ${doc.lastFetchedAt}\n`;
      }
    });
    
    return text;
  } catch (err) {
    console.error("Error extracting Pinterest data:", err.message);
    return "=== PINTEREST DATA ===\n\nError extracting Pinterest data.\n";
  }
}
