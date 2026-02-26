/**
 * Scheduled posting routes.
 */
import { ObjectId } from "mongodb";
import { getDb } from "../../../../db.js";
import { createScheduledPostsFromRequest } from "../../../../services/socialPostingService.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function parseDateInput(value) {
  const raw = normalizeText(value);
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function mapScheduledPostForResponse(doc) {
  return {
    id: String(doc?._id || ""),
    userId: normalizeText(doc?.userId),
    platform: normalizeText(doc?.platform),
    channelId: normalizeText(doc?.channelId),
    targetDisplayName: normalizeText(doc?.targetDisplayName),
    targetUsername: normalizeText(doc?.targetUsername),
    mode: normalizeText(doc?.mode),
    status: normalizeText(doc?.status),
    scheduledAt: doc?.scheduledAt ? new Date(doc.scheduledAt).toISOString() : null,
    executedAt: doc?.executedAt ? new Date(doc.executedAt).toISOString() : null,
    createdAt: doc?.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    platformPostId: normalizeText(doc?.platformPostId),
    error: doc?.error || null,
    content: {
      title: normalizeText(doc?.content?.title),
      body: normalizeText(doc?.content?.body),
      hashtags: toArray(doc?.content?.hashtags),
      x_text: normalizeText(doc?.content?.x_text),
      linkedin_text: normalizeText(doc?.content?.linkedin_text),
      instagram_caption: normalizeText(doc?.content?.instagram_caption),
      instagram_image_url: normalizeText(doc?.content?.instagram_image_url),
      facebook_message: normalizeText(doc?.content?.facebook_message),
      metadata: doc?.content?.metadata || {},
    },
  };
}

/**
 * POST /api/social/post/schedule
 * Create scheduled posts.
 */
export async function createSchedulePostHandler(req, res) {
  const userId = normalizeText(req.body?.userId || req.query?.userId);
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const targets = toArray(req.body?.targets);
  if (!targets.length) return res.status(400).json({ error: "At least one target platform/channel is required" });

  const scheduledAt = parseDateInput(req.body?.scheduledAt);
  if (!scheduledAt) return res.status(400).json({ error: "Valid scheduledAt is required" });
  if (scheduledAt.getTime() <= Date.now() + 5 * 1000) {
    return res.status(400).json({ error: "scheduledAt must be in the future" });
  }

  try {
    const result = await createScheduledPostsFromRequest(userId, {
      mode: "scheduled",
      targets,
      content: req.body?.content || {},
      scheduledAt: scheduledAt.toISOString(),
    });

    const db = await getDb();
    const scheduledColl = db.collection("ScheduledPosts");
    const insertedIds = toArray(result?.insertedIds)
      .map((id) => {
        try {
          return new ObjectId(String(id));
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const insertedDocs = insertedIds.length
      ? await scheduledColl.find({ _id: { $in: insertedIds } }).sort({ scheduledAt: 1 }).toArray()
      : [];

    return res.json({
      ok: true,
      insertedCount: Number(result?.insertedCount || 0),
      items: insertedDocs.map(mapScheduledPostForResponse),
    });
  } catch (err) {
    console.error("createSchedulePostHandler error:", err);
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Failed to schedule post",
    });
  }
}

/**
 * GET /api/social/post/schedule
 * Get scheduled posts for a user.
 */
export async function getScheduledPostsHandler(req, res) {
  const userId = normalizeText(req.query?.userId || req.body?.userId);
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const start = parseDateInput(req.query?.start);
  const end = parseDateInput(req.query?.end);
  if ((req.query?.start && !start) || (req.query?.end && !end)) {
    return res.status(400).json({ error: "Invalid start/end date range" });
  }
  if (start && end && start.getTime() > end.getTime()) {
    return res.status(400).json({ error: "start must be before end" });
  }

  const statuses = normalizeText(req.query?.status)
    .split(",")
    .map((item) => normalizeText(item).toLowerCase())
    .filter(Boolean);

  try {
    const db = await getDb();
    const scheduledColl = db.collection("ScheduledPosts");
    const query = {
      userId,
      mode: "scheduled",
    };

    if (statuses.length) {
      query.status = { $in: statuses };
    }

    if (start || end) {
      query.scheduledAt = {};
      if (start) query.scheduledAt.$gte = start;
      if (end) query.scheduledAt.$lte = end;
    }

    const docs = await scheduledColl.find(query).sort({ scheduledAt: 1, createdAt: 1 }).limit(1500).toArray();

    const summary = {
      total: docs.length,
      pending: docs.filter((item) => item?.status === "pending").length,
      processing: docs.filter((item) => item?.status === "processing").length,
      posted: docs.filter((item) => item?.status === "posted").length,
      failed: docs.filter((item) => item?.status === "failed").length,
      cancelled: docs.filter((item) => item?.status === "cancelled").length,
    };

    return res.json({
      ok: true,
      items: docs.map(mapScheduledPostForResponse),
      summary,
    });
  } catch (err) {
    console.error("getScheduledPostsHandler error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch scheduled posts",
    });
  }
}

/**
 * DELETE /api/social/post/schedule/:id
 * Delete a scheduled post.
 */
export async function deleteScheduledPostHandler(req, res) {
  const userId = normalizeText(req.query?.userId || req.body?.userId);
  const id = normalizeText(req.params?.id);

  if (!userId) return res.status(400).json({ error: "userId is required" });
  if (!id) return res.status(400).json({ error: "id is required" });

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return res.status(400).json({ error: "Invalid scheduled post id" });
  }

  try {
    const db = await getDb();
    const scheduledColl = db.collection("ScheduledPosts");

    const doc = await scheduledColl.findOne({ _id: objectId, userId, mode: "scheduled" });
    if (!doc) return res.status(404).json({ error: "Scheduled post not found" });

    if (doc.status === "posted") {
      return res.status(400).json({ error: "Posted jobs cannot be cancelled" });
    }
    if (doc.status === "processing") {
      return res.status(409).json({ error: "Job is currently processing; try again shortly" });
    }
    if (doc.status === "cancelled") {
      return res.json({ ok: true, id, status: "cancelled" });
    }

    await scheduledColl.updateOne(
      { _id: objectId, userId },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return res.json({ ok: true, id, status: "cancelled" });
  } catch (err) {
    console.error("deleteScheduledPostHandler error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to cancel scheduled post",
    });
  }
}
