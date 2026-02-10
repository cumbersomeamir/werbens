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

  const docs = targets.map((t) => ({
    userId,
    platform: t.platform,
    channelId: t.channelId,
    mode: mode === "automatic" ? "automatic" : mode === "scheduled" ? "scheduled" : "immediate",
    status: "pending",
    content: {
      title: content?.title ?? "",
      body: content?.body ?? "",
      hashtags: Array.isArray(content?.hashtags) ? content.hashtags : [],
      videoAssetId: content?.videoAssetId ?? "",
      thumbnailAssetId: content?.thumbnailAssetId ?? "",
      metadata: content?.metadata ?? {},
    },
    scheduledAt: mode === "scheduled" && scheduledAt ? new Date(scheduledAt) : now,
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

async function publishToX(db, job) {
  throw new Error("X posting is not yet implemented.");
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

