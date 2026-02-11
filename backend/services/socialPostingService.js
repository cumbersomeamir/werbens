/**
 * Social posting orchestrator.
 *
 * This service is responsible for:
 * - Creating ScheduledPost documents from a normalized payload
 * - Executing due posts via per-platform adapters
 * - Applying basic rate limiting / safety checks
 *
 * IMPORTANT: This layer is additive and does not change any of the existing
 * OAuth or analytics flows. If a platform's write API is not fully configured,
 * its adapter will fail gracefully and mark the job as failed with an
 * explanatory error.
 */

import { getDb } from "../db.js";

// Conservative per-platform caps (can be tuned later)
const PLATFORM_LIMITS = {
  youtube: { maxPerDay: 5, minIntervalMinutes: 180 },
  facebook: { maxPerDay: 8, minIntervalMinutes: 90 },
  instagram: { maxPerDay: 8, minIntervalMinutes: 90 },
  x: { maxPerDay: 10, minIntervalMinutes: 45 },
  linkedin: { maxPerDay: 8, minIntervalMinutes: 90 },
  pinterest: { maxPerDay: 12, minIntervalMinutes: 60 },
};

function getLimits(platform) {
  return PLATFORM_LIMITS[platform] || { maxPerDay: 10, minIntervalMinutes: 60 };
}

export async function createScheduledPostsFromRequest(userId, payload) {
  const db = await getDb();
  const scheduledColl = db.collection("ScheduledPosts");

  const now = new Date();
  const {
    mode,
    targets, // [{ platform, channelId }]
    content,
    scheduledAt, // Date string or null
  } = payload;

  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error("At least one target platform/channel is required");
  }

  // For immediate posts, set scheduledAt to now (or slightly in the past to ensure it's picked up)
  const isImmediate = mode === "immediate" || (!mode && !scheduledAt);
  const finalScheduledAt = isImmediate 
    ? new Date(now.getTime() - 1000) // 1 second in the past to ensure scheduler picks it up
    : (mode === "scheduled" && scheduledAt ? new Date(scheduledAt) : now);

  const docs = targets.map((t) => ({
    userId,
    platform: t.platform,
    channelId: t.channelId,
    mode: mode === "automatic" ? "automatic" : mode === "scheduled" ? "scheduled" : "immediate",
    status: "pending",
    content: {
      // Generic fields
      title: content?.title ?? "",
      body: content?.body ?? "",
      hashtags: Array.isArray(content?.hashtags) ? content.hashtags : [],
      videoAssetId: content?.videoAssetId ?? "",
      thumbnailAssetId: content?.thumbnailAssetId ?? "",
      // X-specific fields (preserve all)
      x_text: content?.x_text ?? "",
      x_media_ids: Array.isArray(content?.x_media_ids) ? content.x_media_ids : [],
      x_tagged_user_ids: Array.isArray(content?.x_tagged_user_ids) ? content.x_tagged_user_ids : [],
      x_poll: content?.x_poll || null,
      x_poll_options: Array.isArray(content?.x_poll_options) ? content.x_poll_options : [],
      x_poll_duration_minutes: content?.x_poll_duration_minutes ?? 60,
      x_reply_to_tweet_id: content?.x_reply_to_tweet_id ?? "",
      x_quote_tweet_id: content?.x_quote_tweet_id ?? "",
      x_geo_place_id: content?.x_geo_place_id ?? "",
      x_for_super_followers_only: content?.x_for_super_followers_only ?? false,
      metadata: content?.metadata ?? {},
    },
    scheduledAt: finalScheduledAt,
    executedAt: null,
    ruleId: content?.ruleId ?? null,
    platformPostId: null,
    error: null,
    createdAt: now,
    updatedAt: now,
  }));

  const result = await scheduledColl.insertMany(docs);
  return { insertedCount: result.insertedCount };
}

async function getRecentPostTimestamps(db, userId, platform, channelId) {
  const scheduledColl = db.collection("ScheduledPosts");
  const since = new Date();
  since.setDate(since.getDate() - 1);
  const docs = await scheduledColl
    .find({
      userId,
      platform,
      channelId,
      executedAt: { $gte: since },
      status: "posted",
    })
    .project({ executedAt: 1 })
    .toArray();
  return docs.map((d) => d.executedAt).filter(Boolean).sort((a, b) => a - b);
}

async function canPostNow(db, job) {
  const limits = getLimits(job.platform);
  const recent = await getRecentPostTimestamps(db, job.userId, job.platform, job.channelId);
  const now = new Date();

  // Count today's posts
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const todaysPosts = recent.filter((t) => t >= startOfDay).length;
  if (todaysPosts >= limits.maxPerDay) {
    return {
      ok: false,
      reason: "daily_cap",
      nextTime: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  // Enforce minimum spacing
  const last = recent[recent.length - 1];
  if (last) {
    const diffMinutes = (now.getTime() - last.getTime()) / (60 * 1000);
    if (diffMinutes < limits.minIntervalMinutes) {
      const nextTime = new Date(last.getTime() + limits.minIntervalMinutes * 60 * 1000);
      return { ok: false, reason: "interval", nextTime };
    }
  }

  return { ok: true };
}

async function markJob(db, _id, patch) {
  const scheduledColl = db.collection("ScheduledPosts");
  await scheduledColl.updateOne({ _id }, { $set: { ...patch, updatedAt: new Date() } });
}

// ---- Per-platform adapters -------------------------------------------------

async function publishToYouTube(db, job) {
  // NOTE: This is a stub for now. Implementing full YouTube uploads requires
  // using videos.insert with resumable uploads, which is beyond the current
  // scope. We fail gracefully so existing functionality is not affected.
  throw new Error("YouTube posting is not yet implemented in this environment.");
}

/**
 * Refresh X access token using refresh token
 */
async function refreshXToken(db, account) {
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

  const response = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers,
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`X token refresh failed: ${response.status} - ${errorText}`);
  }

  const tokenData = await response.json();
  const newAccessToken = tokenData.access_token;
  const newRefreshToken = tokenData.refresh_token || account.refreshToken;

  // Update account with new tokens
  await db.collection("SocialAccounts").updateOne(
    { _id: account._id },
    {
      $set: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        updatedAt: new Date(),
      },
    }
  );

  return newAccessToken;
}

async function publishToX(db, job) {
  const { userId, platform, channelId, content } = job;
  
  // Get access token from SocialAccounts
  const accountsColl = db.collection("SocialAccounts");
  let account = await accountsColl.findOne({
    userId,
    platform: "x",
    platformUserId: channelId,
  });

  if (!account) {
    throw new Error(`X account not found for user ${userId}, channel ${channelId}`);
  }

  if (!account.accessToken) {
    throw new Error(`X account missing access token for user ${userId}, channel ${channelId}`);
  }

  // Build tweet payload from content
  // Use X-specific fields if provided, otherwise fall back to generic fields
  let tweetText = content.x_text || content.body || "";
  if (!tweetText && content.title) {
    tweetText = content.title;
  }
  if (!tweetText && content.title && content.body) {
    tweetText = `${content.title}\n\n${content.body}`;
  }

  // Add hashtags if provided (only if not using x_text)
  if (!content.x_text && Array.isArray(content.hashtags) && content.hashtags.length > 0) {
    const hashtagsStr = content.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");
    tweetText = tweetText ? `${tweetText}\n\n${hashtagsStr}` : hashtagsStr;
  }

  // Validate tweet length (X limit is 280 characters)
  if (!tweetText || tweetText.trim().length === 0) {
    throw new Error("Tweet content cannot be empty");
  }
  if (tweetText.length > 280) {
    throw new Error(`Tweet exceeds 280 character limit (${tweetText.length} characters)`);
  }

  // Build X API v2 payload with all supported parameters
  const tweetPayload = {
    text: tweetText.trim(),
  };

  // Media IDs (mutually exclusive with poll and quote_tweet_id)
  if (content.x_media_ids && Array.isArray(content.x_media_ids) && content.x_media_ids.length > 0) {
    if (content.x_poll || content.x_quote_tweet_id) {
      throw new Error("Media cannot be used with poll or quote tweet");
    }
    tweetPayload.media = {
      media_ids: content.x_media_ids.slice(0, 4), // Max 4 media items
    };
    if (content.x_tagged_user_ids && Array.isArray(content.x_tagged_user_ids)) {
      tweetPayload.media.tagged_user_ids = content.x_tagged_user_ids;
    }
  }

  // Poll (mutually exclusive with media and quote_tweet_id)
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

  // Reply to tweet
  if (content.x_reply_to_tweet_id) {
    tweetPayload.reply = {
      in_reply_to_tweet_id: content.x_reply_to_tweet_id.trim(),
    };
  }

  // Quote tweet ID (mutually exclusive with media and poll)
  if (content.x_quote_tweet_id) {
    if (content.x_media_ids || content.x_poll) {
      throw new Error("Quote tweet cannot be used with media or poll");
    }
    tweetPayload.quote_tweet_id = content.x_quote_tweet_id.trim();
  }

  // Geo location
  if (content.x_geo_place_id) {
    tweetPayload.geo = {
      place_id: content.x_geo_place_id.trim(),
    };
  }

  // Super Followers only
  if (content.x_for_super_followers_only === true) {
    tweetPayload.for_super_followers_only = true;
  }

  // Post to X API v2 (use api.twitter.com for posting endpoint)
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
        // If parsing fails, use the raw text
        if (errorText) {
          errorMessage = `X API error: ${errorText.substring(0, 200)}`;
        }
      }
      
      // Special handling for 403 Forbidden - likely missing tweet.write scope
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
      console.log(`X token expired for user ${userId}, refreshing...`);
      accessToken = await refreshXToken(db, account);
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

async function publishToMeta(db, job) {
  throw new Error("Facebook/Instagram posting is not yet implemented.");
}

async function publishToLinkedIn(db, job) {
  throw new Error("LinkedIn posting is not yet implemented.");
}

async function publishToPinterest(db, job) {
  throw new Error("Pinterest posting is not yet implemented.");
}

async function executeJob(db, job) {
  const startPatch = { status: "processing" };
  await markJob(db, job._id, startPatch);

  try {
    let platformPostId = null;
    if (job.platform === "youtube") {
      platformPostId = await publishToYouTube(db, job);
    } else if (job.platform === "x") {
      platformPostId = await publishToX(db, job);
    } else if (job.platform === "facebook" || job.platform === "instagram") {
      platformPostId = await publishToMeta(db, job);
    } else if (job.platform === "linkedin") {
      platformPostId = await publishToLinkedIn(db, job);
    } else if (job.platform === "pinterest") {
      platformPostId = await publishToPinterest(db, job);
    } else {
      throw new Error(`Unsupported platform for posting: ${job.platform}`);
    }

    await markJob(db, job._id, {
      status: "posted",
      executedAt: new Date(),
      platformPostId: platformPostId ?? null,
      error: null,
    });
  } catch (err) {
    await markJob(db, job._id, {
      status: "failed",
      executedAt: new Date(),
      error: {
        message: err.message || String(err),
        name: err.name || "Error",
      },
    });
  }
}

export async function runDueScheduledPosts(limit = 20) {
  const db = await getDb();
  const scheduledColl = db.collection("ScheduledPosts");
  const now = new Date();

  const jobs = await scheduledColl
    .find({
      status: "pending",
      scheduledAt: { $lte: now },
    })
    .sort({ scheduledAt: 1 })
    .limit(limit)
    .toArray();

  for (const job of jobs) {
    const safety = await canPostNow(db, job);
    if (!safety.ok) {
      if (safety.nextTime) {
        await markJob(db, job._id, { scheduledAt: safety.nextTime });
      }
      continue;
    }
    await executeJob(db, job);
  }

  return { processed: jobs.length };
}

