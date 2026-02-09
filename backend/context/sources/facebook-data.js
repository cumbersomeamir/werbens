/**
 * Facebook data source - extracts Facebook data from MongoDB
 */
import { getDb } from "../../db.js";

/**
 * Extract Facebook data for a user
 * @param {string} userId
 * @returns {Promise<string>} Formatted text string
 */
export async function getFacebookData(userId) {
  try {
    const db = await getDb();
    const collection = db.collection("SocialMedia");
    
    const docs = await collection.find({ userId, platform: "facebook" }).toArray();
    
    if (!docs || docs.length === 0) {
      return "=== FACEBOOK DATA ===\n\nNo Facebook account connected.\n";
    }

    let text = "=== FACEBOOK DATA ===\n\n";
    
    docs.forEach((doc, idx) => {
      if (idx > 0) text += "\n--- Page " + (idx + 1) + " ---\n";
      
      if (doc.username) text += `Username: ${doc.username}\n`;
      if (doc.channelId) text += `Page ID: ${doc.channelId}\n`;
      
      if (doc.profile) {
        text += "\n--- Profile ---\n";
        if (doc.profile.name) text += `Page Name: ${doc.profile.name}\n`;
        if (doc.profile.about) text += `About: ${doc.profile.about}\n`;
        if (doc.profile.fan_count) text += `Likes: ${doc.profile.fan_count}\n`;
        if (doc.profile.followers_count) text += `Followers: ${doc.profile.followers_count}\n`;
      }
      
      if (doc.posts && Array.isArray(doc.posts) && doc.posts.length > 0) {
        text += `\n--- Recent Posts (${doc.posts.length}) ---\n`;
        doc.posts.slice(0, 10).forEach((post, i) => {
          if (post.message) text += `${i + 1}. ${post.message.substring(0, 200)}${post.message.length > 200 ? "..." : ""}\n`;
          if (post.insights) {
            text += `   Reactions: ${post.insights.reactions || 0}, Comments: ${post.insights.comments || 0}\n`;
          }
        });
      }
      
      if (doc.insights) {
        text += "\n--- Insights ---\n";
        if (doc.insights.reach) text += `Reach: ${doc.insights.reach}\n`;
        if (doc.insights.engagement) text += `Engagement: ${doc.insights.engagement}\n`;
      }
      
      if (doc.lastFetchedAt) {
        text += `\nLast Fetched: ${doc.lastFetchedAt}\n`;
      }
    });
    
    return text;
  } catch (err) {
    console.error("Error extracting Facebook data:", err.message);
    return "=== FACEBOOK DATA ===\n\nError extracting Facebook data.\n";
  }
}
