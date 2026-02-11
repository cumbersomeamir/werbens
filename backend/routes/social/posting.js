/**
 * Legacy posting routes - for backward compatibility.
 * Routes immediate posts to /now endpoint, scheduled/automatic to scheduler.
 *
 * @deprecated Use /api/social/post/now, /api/social/post/schedule, or /api/social/post/automate instead
 */

import { createPostNowHandler } from "./posting/now/index.js";
import { createScheduledPostsFromRequest, runDueScheduledPosts } from "../../services/socialPostingService.js";

export async function createPostHandler(req, res) {
  const userId = (req.body?.userId ?? req.query?.userId)?.trim();
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    // For immediate mode, route to /now handler
    if (req.body.mode === "immediate") {
      return await createPostNowHandler(req, res);
    } else {
      // For scheduled/automatic mode, use the scheduler (legacy behavior)
      const result = await createScheduledPostsFromRequest(userId, req.body);
      return res.json({ ok: true, ...result });
    }
  } catch (err) {
    console.error("createPostHandler error:", err);
    return res.status(400).json({ error: err.message || "Failed to create post" });
  }
}

/**
 * Lightweight scheduler trigger; intended to be called either manually or
 * from a cron job. It processes due ScheduledPosts but does not loop forever.
 */
export async function runSchedulerHandler(_req, res) {
  try {
    const result = await runDueScheduledPosts();
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error("runSchedulerHandler error:", err);
    return res.status(500).json({ error: "Failed to run scheduler" });
  }
}

