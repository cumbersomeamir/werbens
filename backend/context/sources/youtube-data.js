/**
 * YouTube data source - extracts YouTube data from MongoDB
 */
import { getDb } from "../../db.js";

/**
 * Extract YouTube data for a user
 * @param {string} userId
 * @returns {Promise<string>} Formatted text string
 */
export async function getYouTubeData(userId) {
  try {
    const db = await getDb();
    const collection = db.collection("SocialMedia");
    
    const docs = await collection.find({ userId, platform: "youtube" }).toArray();
    
    if (!docs || docs.length === 0) {
      return "=== YOUTUBE DATA ===\n\nNo YouTube account connected.\n";
    }

    let text = "=== YOUTUBE DATA ===\n\n";
    
    docs.forEach((doc, idx) => {
      if (idx > 0) text += "\n--- Channel " + (idx + 1) + " ---\n";
      
      if (doc.username) text += `Username: ${doc.username}\n`;
      if (doc.channelId) text += `Channel ID: ${doc.channelId}\n`;
      
      if (doc.profile) {
        text += "\n--- Profile ---\n";
        if (doc.profile.title) text += `Channel Name: ${doc.profile.title}\n`;
        if (doc.profile.description) text += `Description: ${doc.profile.description.substring(0, 300)}${doc.profile.description.length > 300 ? "..." : ""}\n`;
        if (doc.profile.subscriberCount) text += `Subscribers: ${doc.profile.subscriberCount}\n`;
        if (doc.profile.videoCount) text += `Videos: ${doc.profile.videoCount}\n`;
        if (doc.profile.viewCount) text += `Total Views: ${doc.profile.viewCount}\n`;
      }
      
      if (doc.videos && Array.isArray(doc.videos) && doc.videos.length > 0) {
        text += `\n--- Recent Videos (${doc.videos.length}) ---\n`;
        doc.videos.slice(0, 10).forEach((video, i) => {
          if (video.title) text += `${i + 1}. ${video.title}\n`;
          if (video.description) text += `   ${video.description.substring(0, 150)}${video.description.length > 150 ? "..." : ""}\n`;
          if (video.statistics) {
            text += `   Views: ${video.statistics.viewCount || 0}, Likes: ${video.statistics.likeCount || 0}\n`;
          }
        });
      }
      
      if (doc.insights) {
        text += "\n--- Insights ---\n";
        if (doc.insights.averageViews) text += `Average Views: ${doc.insights.averageViews}\n`;
        if (doc.insights.topTopics) {
          text += `Top Topics: ${doc.insights.topTopics.join(", ")}\n`;
        }
      }
      
      if (doc.lastFetchedAt) {
        text += `\nLast Fetched: ${doc.lastFetchedAt}\n`;
      }
    });
    
    return text;
  } catch (err) {
    console.error("Error extracting YouTube data:", err.message);
    return "=== YOUTUBE DATA ===\n\nError extracting YouTube data.\n";
  }
}
