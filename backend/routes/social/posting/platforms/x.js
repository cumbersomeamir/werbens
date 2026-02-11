import { getDb } from "../../../../db.js";

/**
 * Publish directly to X (Twitter) without using the scheduler.
 * Used for immediate posts.
 */
export async function publishToXDirectly(userId, target, content) {
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const account = await accountsColl.findOne({
    userId,
    platform: "x",
    platformUserId: target.channelId,
  });

  if (!account || !account.accessToken) {
    throw new Error(`X account not found or missing access token`);
  }

  // Build tweet payload
  const tweetPayload = {
    text: content.x_text.trim(),
  };

  if (content.x_media_ids && content.x_media_ids.length > 0) {
    if (content.x_poll || content.x_quote_tweet_id) {
      throw new Error("Media cannot be used with poll or quote tweet");
    }
    tweetPayload.media = {
      media_ids: content.x_media_ids.slice(0, 4),
    };
    if (content.x_tagged_user_ids && Array.isArray(content.x_tagged_user_ids)) {
      tweetPayload.media.tagged_user_ids = content.x_tagged_user_ids;
    }
  }

  if (content.x_poll) {
    if (content.x_media_ids || content.x_quote_tweet_id) {
      throw new Error("Poll cannot be used with media or quote tweet");
    }
    if (!content.x_poll.options || content.x_poll.options.length < 2 || content.x_poll.options.length > 4) {
      throw new Error("Poll must have 2-4 options");
    }
    tweetPayload.poll = {
      options: content.x_poll.options,
      duration_minutes: content.x_poll.duration_minutes || 60,
    };
  }

  if (content.x_reply_to_tweet_id) {
    tweetPayload.reply = {
      in_reply_to_tweet_id: content.x_reply_to_tweet_id.trim(),
    };
  }

  if (content.x_quote_tweet_id) {
    if (content.x_media_ids || content.x_poll) {
      throw new Error("Quote tweet cannot be used with media or poll");
    }
    tweetPayload.quote_tweet_id = content.x_quote_tweet_id.trim();
  }

  if (content.x_geo_place_id) {
    tweetPayload.geo = {
      place_id: content.x_geo_place_id.trim(),
    };
  }

  if (content.x_for_super_followers_only === true) {
    tweetPayload.for_super_followers_only = true;
  }

  // Post to X API v2
  const X_API_BASE = "https://api.twitter.com/2";
  let accessToken = account.accessToken;
  
  const postTweet = async (token) => {
    const response = await fetch(`${X_API_BASE}/tweets`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tweetPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `X API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          errorMessage = `X API error: ${errorJson.detail}`;
        } else if (errorJson.errors && Array.isArray(errorJson.errors) && errorJson.errors.length > 0) {
          errorMessage = `X API error: ${errorJson.errors.map((e) => e.message || e.detail).join(", ")}`;
        } else if (errorJson.title) {
          errorMessage = `X API error: ${errorJson.title}${errorJson.detail ? ` - ${errorJson.detail}` : ""}`;
        }
      } catch {
        if (errorText) {
          errorMessage = `X API error: ${errorText.substring(0, 200)}`;
        }
      }
      
      if (response.status === 403) {
        errorMessage += " (Token may be missing 'tweet.write' scope. Please reconnect your X account.)";
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
  };

  // Try posting with current token
  let result;
  try {
    result = await postTweet(accessToken);
  } catch (err) {
    // If token expired (401), try refreshing
    if (err.message.includes("401") || err.message.includes("Unauthorized")) {
      const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
      const clientId = process.env.X_CLIENT_ID;
      const clientSecret = process.env.X_CLIENT_SECRET;

      if (!account.refreshToken) {
        throw new Error("No refresh token available for X account");
      }

      const body = new URLSearchParams({
        refresh_token: account.refreshToken,
        grant_type: "refresh_token",
      });

      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
      };
      if (clientSecret) {
        headers["Authorization"] =
          "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      } else {
        body.append("client_id", clientId);
      }

      const refreshResponse = await fetch(X_TOKEN_URL, {
        method: "POST",
        headers,
        body: body.toString(),
      });

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        throw new Error(`X token refresh failed: ${refreshResponse.status} - ${errorText}`);
      }

      const tokenData = await refreshResponse.json();
      accessToken = tokenData.access_token;
      const newRefreshToken = tokenData.refresh_token || account.refreshToken;

      await accountsColl.updateOne(
        { _id: account._id },
        {
          $set: {
            accessToken,
            refreshToken: newRefreshToken,
            updatedAt: new Date(),
          },
        }
      );

      result = await postTweet(accessToken);
    } else {
      throw err;
    }
  }

  const tweetId = result?.data?.id;
  if (!tweetId) {
    throw new Error("X API did not return a tweet ID");
  }

  return tweetId;
}
