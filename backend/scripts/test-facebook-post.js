/**
 * Test script for Facebook posting
 * Usage: node scripts/test-facebook-post.js [userId] [pageId] [message]
 * 
 * If userId is not provided, it will use the first Facebook account found in the database.
 * If pageId is not provided, it will use the first Facebook page found.
 * If message is not provided, it will use a default test message.
 */

import "dotenv/config";
import { getDb } from "../db.js";

const userId = process.argv[2];
const pageId = process.argv[3];
const message = process.argv[4] || `Test post from Werbens API 🚀\n\nPosted at ${new Date().toISOString()}`;

async function testFacebookPost() {
  try {
    const db = await getDb();
    const accountsColl = db.collection("SocialAccounts");

    // Find Facebook account(s)
    let query = { platform: "facebook" };
    if (userId) {
      query.userId = userId;
    }

    const accounts = await accountsColl.find(query).toArray();

    if (accounts.length === 0) {
      console.error("No Facebook accounts found in database.");
      console.log("Query used:", JSON.stringify(query, null, 2));
      process.exit(1);
    }

    const account = accounts[0];
    const testUserId = account.userId;
    const userAccessToken = account.accessToken;
    
    // Fetch pages dynamically from Facebook API
    const FB_GRAPH_BASE = "https://graph.facebook.com/v21.0";
    const accountsUrl = `${FB_GRAPH_BASE}/me/accounts?access_token=${encodeURIComponent(userAccessToken)}&fields=id,name,access_token`;
    const accountsResponse = await fetch(accountsUrl);
    
    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error("Failed to fetch Facebook pages:", errorText);
      process.exit(1);
    }
    
    const accountsData = await accountsResponse.json();
    const pages = accountsData?.data || [];
    
    if (pages.length === 0) {
      console.error("No Facebook pages found for this account.");
      process.exit(1);
    }

    const targetPage = pageId 
      ? pages.find((p) => p.id === pageId)
      : pages[0];

    if (!targetPage) {
      console.error(`Facebook page ${pageId} not found. Available pages:`, pages.map((p) => `${p.id} (${p.name})`));
      process.exit(1);
    }

    const testPageId = targetPage.id;
    const pageName = targetPage.name || "Facebook Page";

    console.log("Found Facebook account:");
    console.log(`  User ID: ${testUserId}`);
    console.log(`  Page ID: ${testPageId}`);
    console.log(`  Page Name: ${pageName}`);
    console.log(`  Message: ${message}`);
    console.log("");

    // Test the posting endpoint
    const payload = {
      userId: testUserId,
      targets: [
        {
          platform: "facebook",
          channelId: testPageId,
        },
      ],
      content: {
        facebook_message: message,
      },
    };

    console.log("Posting to Facebook...");
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
      const facebookResult = result.results.find((r) => r.platform === "facebook");
      if (facebookResult) {
        if (facebookResult.status === "posted") {
          console.log(`\n✅ Post published successfully! Post ID: ${facebookResult.platformPostId}`);
        } else if (facebookResult.error) {
          console.error(`\n❌ Error: ${facebookResult.error}`);
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

testFacebookPost();
