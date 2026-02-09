/**
 * Instagram data source - extracts Instagram data from MongoDB
 */
import { getDb } from "../../db.js";

/**
 * Extract Instagram data for a user
 * @param {string} userId
 * @returns {Promise<string>} Formatted text string
 */
export async function getInstagramData(userId) {
  try {
    const db = await getDb();
    const collection = db.collection("SocialMedia");
    
    const docs = await collection.find({ userId, platform: "instagram" }).toArray();
    
    if (!docs || docs.length === 0) {
      return "=== INSTAGRAM DATA ===\n\nNo Instagram account connected.\n";
    }

    let text = "=== INSTAGRAM DATA ===\n\n";
    
    docs.forEach((doc, idx) => {
      if (idx > 0) text += "\n--- Channel " + (idx + 1) + " ---\n";
      
      if (doc.username) text += `Username: ${doc.username}\n`;
      if (doc.channelId) text += `Channel ID: ${doc.channelId}\n`;
      
      if (doc.profile) {
        text += "\n--- Profile ---\n";
        if (doc.profile.username) text += `Username: ${doc.profile.username}\n`;
        if (doc.profile.biography) text += `Bio: ${doc.profile.biography}\n`;
        if (doc.profile.followers_count) text += `Followers: ${doc.profile.followers_count}\n`;
        if (doc.profile.follows_count) text += `Following: ${doc.profile.follows_count}\n`;
        if (doc.profile.media_count) text += `Posts: ${doc.profile.media_count}\n`;
      }
      
      if (doc.media && Array.isArray(doc.media) && doc.media.length > 0) {
        text += `\n--- Recent Media (${doc.media.length}) ---\n`;
        doc.media.slice(0, 10).forEach((item, i) => {
          if (item.caption) text += `${i + 1}. ${item.caption.substring(0, 200)}${item.caption.length > 200 ? "..." : ""}\n`;
          if (item.like_count) text += `   Likes: ${item.like_count}\n`;
          if (item.comments_count) text += `   Comments: ${item.comments_count}\n`;
        });
      }
      
      if (doc.insights) {
        text += "\n--- Insights ---\n";
        if (doc.insights.engagement_rate) text += `Engagement Rate: ${doc.insights.engagement_rate}\n`;
        if (doc.insights.reach) text += `Reach: ${doc.insights.reach}\n`;
        if (doc.insights.impressions) text += `Impressions: ${doc.insights.impressions}\n`;
      }
      
      if (doc.lastFetchedAt) {
        text += `\nLast Fetched: ${doc.lastFetchedAt}\n`;
      }
    });
    
    return text;
  } catch (err) {
    console.error("Error extracting Instagram data:", err.message);
    return "=== INSTAGRAM DATA ===\n\nError extracting Instagram data.\n";
  }
}
