import { getDb } from "../../../../db.js";

const FB_GRAPH_BASE = "https://graph.facebook.com/v21.0";

/**
 * Publish directly to Facebook Page without using the scheduler.
 * Used for immediate posts.
 * 
 * Facebook posting requires:
 * 1. User access token (stored in SocialAccounts)
 * 2. Get page access token for the specific page
 * 3. Post to /page_id/feed endpoint
 */
export async function publishToFacebookDirectly(userId, target, content) {
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  
  // Find Facebook account (stores user access token)
  const account = await accountsColl.findOne({
    userId,
    platform: "facebook",
  });

  if (!account || !account.accessToken) {
    throw new Error(`Facebook account not found or missing access token`);
  }

  const userAccessToken = account.accessToken;
  const pageId = target.channelId;

  // Step 1: Get page access token for this specific page
  // We need to fetch /me/accounts to get the page access token
  const accountsUrl = `${FB_GRAPH_BASE}/me/accounts?access_token=${encodeURIComponent(userAccessToken)}&fields=id,access_token,name`;
  const accountsResponse = await fetch(accountsUrl);

  if (!accountsResponse.ok) {
    const errorText = await accountsResponse.text();
    let errorMessage = `Facebook API error (get pages): ${accountsResponse.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMessage = `Facebook API error: ${errorJson.error.message}`;
      }
    } catch {
      if (errorText) {
        errorMessage = `Facebook API error: ${errorText.substring(0, 200)}`;
      }
    }
    throw new Error(errorMessage);
  }

  const accountsData = await accountsResponse.json();
  const pages = accountsData?.data || [];
  const targetPage = pages.find((p) => p.id === pageId);

  if (!targetPage || !targetPage.access_token) {
    throw new Error(`Facebook page ${pageId} not found or missing page access token`);
  }

  const pageAccessToken = targetPage.access_token;

  // Step 2: Build post payload
  const postParams = new URLSearchParams({
    access_token: pageAccessToken,
  });

  // Message is required for text posts
  if (content.facebook_message) {
    postParams.append("message", content.facebook_message);
  } else if (content.body) {
    postParams.append("message", content.body);
  } else if (content.title) {
    postParams.append("message", content.title);
  } else {
    throw new Error("Facebook post requires a message, body, or title");
  }

  // Link (optional)
  if (content.facebook_link) {
    postParams.append("link", content.facebook_link);
  }

  // Published (true for immediate, false for scheduled)
  postParams.append("published", "true");

  // Scheduled publish time (optional, if provided)
  if (content.facebook_scheduled_publish_time) {
    postParams.append("scheduled_publish_time", String(content.facebook_scheduled_publish_time));
    postParams.set("published", "false");
  }

  // Step 3: Post to Facebook Page feed
  const postUrl = `${FB_GRAPH_BASE}/${pageId}/feed`;
  const postResponse = await fetch(postUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: postParams.toString(),
  });

  if (!postResponse.ok) {
    const errorText = await postResponse.text();
    let errorMessage = `Facebook API error: ${postResponse.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMessage = `Facebook API error: ${errorJson.error.message}`;
      } else if (errorJson.error?.error_user_msg) {
        errorMessage = `Facebook API error: ${errorJson.error.error_user_msg}`;
      } else if (errorJson.error) {
        errorMessage = `Facebook API error: ${JSON.stringify(errorJson.error)}`;
      }
    } catch {
      if (errorText) {
        errorMessage = `Facebook API error: ${errorText.substring(0, 200)}`;
      }
    }

    if (postResponse.status === 401) {
      errorMessage += " (Token expired. Please reconnect your Facebook account.)";
    } else if (postResponse.status === 403) {
      errorMessage += " (Token may be missing 'pages_manage_posts' permission. Please reconnect your Facebook account.)";
    }

    throw new Error(errorMessage);
  }

  const postData = await postResponse.json();
  const postId = postData.id;

  if (!postId) {
    throw new Error("Facebook API did not return a post ID");
  }

  return postId;
}
