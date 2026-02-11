import { getDb } from "../../../../db.js";

/**
 * Publish directly to LinkedIn without using the scheduler.
 * Used for immediate posts.
 */
export async function publishToLinkedInDirectly(userId, target, content) {
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const account = await accountsColl.findOne({
    userId,
    platform: "linkedin",
    platformUserId: target.channelId,
  });

  if (!account || !account.accessToken) {
    throw new Error(`LinkedIn account not found or missing access token`);
  }

  // Get user's LinkedIn Person URN (needed for author field)
  const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
  const LINKEDIN_PROFILE_URL = "https://api.linkedin.com/v2/me";
  const LINKEDIN_POSTS_URL = "https://api.linkedin.com/rest/posts";
  
  let accessToken = account.accessToken;
  let personUrn = null;

  // Try to get Person URN from userinfo (OpenID Connect)
  try {
    const userInfoRes = await fetch(LINKEDIN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (userInfoRes.ok) {
      const userInfo = await userInfoRes.json();
      if (userInfo.sub) {
        personUrn = `urn:li:person:${userInfo.sub}`;
      }
    }
  } catch (err) {
    console.log("Could not get Person URN from userinfo, trying profile API:", err.message);
  }

  // If userinfo didn't work, try profile API
  if (!personUrn) {
    try {
      const profileRes = await fetch(LINKEDIN_PROFILE_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile.id) {
          personUrn = `urn:li:person:${profile.id}`;
        }
      }
    } catch (err) {
      console.log("Could not get Person URN from profile API:", err.message);
    }
  }

  if (!personUrn) {
    throw new Error("Could not retrieve LinkedIn Person URN. Please reconnect your LinkedIn account.");
  }

  // Build LinkedIn post payload
  const postPayload = {
    author: personUrn,
    commentary: content.linkedin_text || content.body || content.title || "",
    visibility: content.linkedin_visibility || "PUBLIC",
    distribution: {
      feedDistribution: content.linkedin_feed_distribution || "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: content.linkedin_disable_reshare === true,
  };

  // Add content if provided
  if (content.linkedin_media_urn) {
    // Single image/video/document post
    postPayload.content = {
      media: {
        id: content.linkedin_media_urn,
      },
    };
    if (content.linkedin_media_title) {
      postPayload.content.media.title = content.linkedin_media_title;
    }
    if (content.linkedin_media_alt_text) {
      postPayload.content.media.altText = content.linkedin_media_alt_text;
    }
  } else if (content.linkedin_article) {
    // Article post
    postPayload.content = {
      article: {
        source: content.linkedin_article.source || "",
        title: content.linkedin_article.title || "",
        description: content.linkedin_article.description || "",
      },
    };
    if (content.linkedin_article.thumbnail) {
      postPayload.content.article.thumbnail = content.linkedin_article.thumbnail;
    }
  }

  // Post to LinkedIn API (format: YYYYMM)
  const LINKEDIN_VERSION = "202411"; // Use a stable version
  
  const postToLinkedIn = async (token) => {
    const response = await fetch(LINKEDIN_POSTS_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Linkedin-Version": LINKEDIN_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `LinkedIn API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = `LinkedIn API error: ${errorJson.message}`;
        } else if (errorJson.error) {
          errorMessage = `LinkedIn API error: ${errorJson.error}`;
        }
      } catch {
        if (errorText) {
          errorMessage = `LinkedIn API error: ${errorText.substring(0, 200)}`;
        }
      }
      
      if (response.status === 401) {
        errorMessage += " (Token expired. Please reconnect your LinkedIn account.)";
      } else if (response.status === 403) {
        errorMessage += " (Token may be missing 'w_member_social' scope. Please reconnect your LinkedIn account.)";
      }
      
      throw new Error(errorMessage);
    }

    // LinkedIn returns post ID in x-restli-id header
    const postId = response.headers.get("x-restli-id");
    return postId;
  };

  // Try posting with current token
  let postId;
  try {
    postId = await postToLinkedIn(accessToken);
  } catch (err) {
    if (err.message.includes("401") || err.message.includes("Unauthorized") || err.message.includes("expired")) {
      throw new Error("LinkedIn access token expired. Please reconnect your LinkedIn account.");
    } else {
      throw err;
    }
  }

  if (!postId) {
    throw new Error("LinkedIn API did not return a post ID");
  }

  return postId;
}
