import { getDb } from "../../../../db.js";

const IG_GRAPH_BASE = "https://graph.instagram.com/v21.0";

/**
 * Publish directly to Instagram without using the scheduler.
 * Used for immediate posts.
 * 
 * Instagram posting requires:
 * 1. Create a media container (image required)
 * 2. Publish the container
 * 
 * Instagram does not support text-only posts - image or video is required.
 */
export async function publishToInstagramDirectly(userId, target, content) {
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const account = await accountsColl.findOne({
    userId,
    platform: "instagram",
    platformUserId: target.channelId,
  });

  if (!account || !account.accessToken) {
    throw new Error(`Instagram account not found or missing access token`);
  }

  const accessToken = account.accessToken;
  const igUserId = target.channelId;
  const imageUrl = typeof content.instagram_image_url === "string" ? content.instagram_image_url.trim() : "";
  const videoUrl = typeof content.instagram_video_url === "string" ? content.instagram_video_url.trim() : "";
  const isVideo = Boolean(videoUrl);

  // Instagram requires media (image or video) - text-only posts are not supported.
  if (!imageUrl && !videoUrl) {
    throw new Error("Instagram requires an image URL or video URL. Text-only posts are not supported.");
  }

  // Step 1: Create media container
  const containerParams = new URLSearchParams({ access_token: accessToken });
  if (isVideo) {
    containerParams.append("video_url", videoUrl);
    // Reels-compatible container for published videos.
    containerParams.append("media_type", "REELS");
    containerParams.append("share_to_feed", "true");
  } else {
    containerParams.append("image_url", imageUrl);
    containerParams.append("media_type", "IMAGE");
  }

  // Add caption if provided
  if (content.instagram_caption) {
    containerParams.append("caption", content.instagram_caption);
  }

  // Alt text only applies to image posts.
  if (!isVideo && content.instagram_alt_text) {
    containerParams.append("alt_text", content.instagram_alt_text);
  }

  const createContainerUrl = `${IG_GRAPH_BASE}/${igUserId}/media`;
  const containerResponse = await fetch(createContainerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: containerParams.toString(),
  });

  if (!containerResponse.ok) {
    const errorText = await containerResponse.text();
    let errorMessage = `Instagram API error: ${containerResponse.status}`;
    let errorDetails = null;
    try {
      const errorJson = JSON.parse(errorText);
      errorDetails = errorJson;
      if (errorJson.error?.message) {
        errorMessage = `Instagram API error: ${errorJson.error.message}`;
      } else if (errorJson.error?.error_user_msg) {
        errorMessage = `Instagram API error: ${errorJson.error.error_user_msg}`;
      } else if (errorJson.error) {
        errorMessage = `Instagram API error: ${JSON.stringify(errorJson.error)}`;
      }
    } catch {
      if (errorText) {
        errorMessage = `Instagram API error: ${errorText.substring(0, 200)}`;
      }
    }


    if (containerResponse.status === 401) {
      errorMessage += " (Token expired. Please reconnect your Instagram account.)";
    } else if (containerResponse.status === 403) {
      errorMessage += " (Token may be missing 'instagram_business_content_publish' permission. Please reconnect your Instagram account with the correct permissions.)";
    }

    throw new Error(errorMessage);
  }

  const containerData = await containerResponse.json();
  const containerId = containerData.id;

  if (!containerId) {
    throw new Error("Instagram API did not return a container ID");
  }

  // Step 2: Publish the container
  // Video containers can take longer to process than image containers.
  if (isVideo) {
    const statusUrl = `${IG_GRAPH_BASE}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`;
    let ready = false;
    for (let i = 0; i < 18; i += 1) {
      const statusResponse = await fetch(statusUrl, { method: "GET" });
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const statusCode = String(statusData?.status_code || statusData?.status || "").toUpperCase();
        if (statusCode === "FINISHED") {
          ready = true;
          break;
        }
        if (statusCode === "ERROR" || statusCode === "EXPIRED") {
          throw new Error(`Instagram video processing failed (${statusCode}).`);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    if (!ready) {
      throw new Error("Instagram video is still processing. Try again in a few moments.");
    }
  } else {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const publishParams = new URLSearchParams({
    access_token: accessToken,
    creation_id: containerId,
  });

  const publishUrl = `${IG_GRAPH_BASE}/${igUserId}/media_publish`;
  const publishResponse = await fetch(publishUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: publishParams.toString(),
  });

  if (!publishResponse.ok) {
    const errorText = await publishResponse.text();
    let errorMessage = `Instagram API error (publish): ${publishResponse.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMessage = `Instagram API error (publish): ${errorJson.error.message}`;
      } else if (errorJson.error?.error_user_msg) {
        errorMessage = `Instagram API error (publish): ${errorJson.error.error_user_msg}`;
      } else if (errorJson.error) {
        errorMessage = `Instagram API error (publish): ${JSON.stringify(errorJson.error)}`;
      }
    } catch {
      if (errorText) {
        errorMessage = `Instagram API error (publish): ${errorText.substring(0, 200)}`;
      }
    }

    if (publishResponse.status === 401) {
      errorMessage += " (Token expired. Please reconnect your Instagram account.)";
    } else if (publishResponse.status === 403) {
      errorMessage += " (Token may be missing 'instagram_content_publish' or 'instagram_business_content_publish' permission. Please reconnect your Instagram account.)";
    }

    throw new Error(errorMessage);
  }

  const publishData = await publishResponse.json();
  const mediaId = publishData.id;

  if (!mediaId) {
    throw new Error("Instagram API did not return a media ID after publishing");
  }

  return mediaId;
}
