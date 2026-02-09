/**
 * X (Twitter) data source - extracts X data from MongoDB
 */
import { getDb } from "../../db.js";

/**
 * Extract X data for a user
 * @param {string} userId
 * @returns {Promise<string>} Formatted text string
 */
export async function getXData(userId) {
  try {
    const db = await getDb();
    const collection = db.collection("SocialMedia");
    
    const docs = await collection.find({ userId, platform: "x" }).toArray();
    
    if (!docs || docs.length === 0) {
      return "=== X (TWITTER) DATA ===\n\nNo X account connected.\n";
    }

    let text = "=== X (TWITTER) DATA ===\n\n";
    
    docs.forEach((doc, idx) => {
      if (idx > 0) text += "\n--- Channel " + (idx + 1) + " ---\n";
      
      if (doc.username) text += `Username: ${doc.username}\n`;
      if (doc.channelId) text += `Channel ID: ${doc.channelId}\n`;
      
      if (doc.profile) {
        text += "\n--- Profile ---\n";
        if (doc.profile.name) text += `Name: ${doc.profile.name}\n`;
        if (doc.profile.description) text += `Bio: ${doc.profile.description}\n`;
        if (doc.profile.followers_count) text += `Followers: ${doc.profile.followers_count}\n`;
        if (doc.profile.following_count) text += `Following: ${doc.profile.following_count}\n`;
        if (doc.profile.tweet_count) text += `Tweets: ${doc.profile.tweet_count}\n`;
      }
      
      if (doc.posts && Array.isArray(doc.posts) && doc.posts.length > 0) {
        text += `\n--- Recent Posts (${doc.posts.length}) ---\n`;
        doc.posts.slice(0, 10).forEach((post, i) => {
          if (post.text) text += `${i + 1}. ${post.text.substring(0, 200)}${post.text.length > 200 ? "..." : ""}\n`;
          if (post.public_metrics) {
            text += `   Likes: ${post.public_metrics.like_count || 0}, Retweets: ${post.public_metrics.retweet_count || 0}\n`;
          }
        });
      }
      
      if (doc.insights) {
        text += "\n--- Insights ---\n";
        if (doc.insights.engagement_rate) text += `Engagement Rate: ${doc.insights.engagement_rate}\n`;
        if (doc.insights.top_hashtags) {
          text += `Top Hashtags: ${doc.insights.top_hashtags.join(", ")}\n`;
        }
      }
      
      if (doc.lastFetchedAt) {
        text += `\nLast Fetched: ${doc.lastFetchedAt}\n`;
      }
    });
    
    return text;
  } catch (err) {
    console.error("Error extracting X data:", err.message);
    return "=== X (TWITTER) DATA ===\n\nError extracting X data.\n";
  }
}
