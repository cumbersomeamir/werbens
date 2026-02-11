/**
 * Test script for Instagram posting
 * Usage: node scripts/test-instagram-post.js [userId] [imageUrl]
 * 
 * If userId is not provided, it will use the first Instagram account found in the database.
 * If imageUrl is not provided, it will use a placeholder URL.
 */

import "dotenv/config";
import { getDb } from "../db.js";

const userId = process.argv[2];
const imageUrl = process.argv[3] || "https://picsum.photos/1080/1080";

async function testInstagramPost() {
  try {
    const db = await getDb();
    const accountsColl = db.collection("SocialAccounts");

    // Find Instagram account(s)
    let query = { platform: "instagram" };
    if (userId) {
      query.userId = userId;
    }

    const accounts = await accountsColl.find(query).toArray();

    if (accounts.length === 0) {
      console.error("No Instagram accounts found in database.");
      console.log("Query used:", JSON.stringify(query, null, 2));
      process.exit(1);
    }

    const account = accounts[0];
    const testUserId = account.userId;
    const channelId = account.platformUserId;

    console.log("Found Instagram account:");
    console.log(`  User ID: ${testUserId}`);
    console.log(`  Channel ID: ${channelId}`);
    console.log(`  Username: ${account.username || "N/A"}`);
    console.log(`  Image URL: ${imageUrl}`);
    console.log("");

    // Test the posting endpoint
    const payload = {
      userId: testUserId,
      targets: [
        {
          platform: "instagram",
          channelId: channelId,
        },
      ],
      content: {
        instagram_image_url: imageUrl,
        instagram_caption: `Test post from Werbens API 🚀\n\nPosted at ${new Date().toISOString()}`,
        instagram_alt_text: "Test image for Instagram posting via Werbens API",
      },
    };

    console.log("Posting to Instagram...");
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("");

    const response = await fetch("http://localhost:8080/api/social/post/now", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Error:", result);
      process.exit(1);
    }

    console.log("Success!");
    console.log("Response:", JSON.stringify(result, null, 2));

    if (result.results && result.results.length > 0) {
      const instagramResult = result.results.find((r) => r.platform === "instagram");
      if (instagramResult) {
        if (instagramResult.status === "posted") {
          console.log(`\n✅ Post published successfully! Media ID: ${instagramResult.platformPostId}`);
        } else if (instagramResult.error) {
          console.error(`\n❌ Error: ${instagramResult.error}`);
          process.exit(1);
        }
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

testInstagramPost();
