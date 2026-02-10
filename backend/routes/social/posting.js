/**
 * Posting routes - create scheduled posts and run the scheduler.
 *
 * These routes are additive and do not modify any existing social flows.
 */

import { createScheduledPostsFromRequest, runDueScheduledPosts } from "../../services/socialPostingService.js";

export async function createPostHandler(req, res) {
  const userId = (req.body?.userId ?? req.query?.userId)?.trim();
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const result = await createScheduledPostsFromRequest(userId, req.body);
    return res.json({ ok: true, ...result });
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

