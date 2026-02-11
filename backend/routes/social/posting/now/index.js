/**
 * Immediate posting routes - post directly without scheduler.
 *
 * This module handles immediate posting for platforms that support it.
 */

import { publishToXDirectly, publishToLinkedInDirectly, publishToInstagramDirectly, publishToFacebookDirectly } from "../platforms/index.js";
import { createScheduledPostsFromRequest, runDueScheduledPosts } from "../../../../services/socialPostingService.js";

/**
 * POST /api/social/post/now
 * Create and publish posts immediately.
 */
export async function createPostNowHandler(req, res) {
  const userId = (req.body?.userId ?? req.query?.userId)?.trim();
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const { targets, content } = req.body;
    
    if (!Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({ error: "At least one target platform/channel is required" });
    }

    const results = [];
    for (const target of targets) {
      try {
        if (target.platform === "x") {
          const tweetId = await publishToXDirectly(userId, target, content);
          results.push({ platform: target.platform, channelId: target.channelId, platformPostId: tweetId, status: "posted" });
        } else if (target.platform === "linkedin") {
          const postId = await publishToLinkedInDirectly(userId, target, content);
          results.push({ platform: target.platform, channelId: target.channelId, platformPostId: postId, status: "posted" });
        } else if (target.platform === "instagram") {
          const mediaId = await publishToInstagramDirectly(userId, target, content);
          results.push({ platform: target.platform, channelId: target.channelId, platformPostId: mediaId, status: "posted" });
        } else if (target.platform === "facebook") {
          const postId = await publishToFacebookDirectly(userId, target, content);
          results.push({ platform: target.platform, channelId: target.channelId, platformPostId: postId, status: "posted" });
        } else {
          // For other platforms, still use scheduler for now
          const result = await createScheduledPostsFromRequest(userId, {
            mode: "immediate",
            targets: [target],
            content,
          });
          await runDueScheduledPosts();
          results.push({ platform: target.platform, channelId: target.channelId, status: "queued" });
        }
      } catch (err) {
        console.error(`Error posting to ${target.platform}:`, err);
        results.push({ platform: target.platform, channelId: target.channelId, error: err.message });
      }
    }
    
    return res.json({ ok: true, results });
  } catch (err) {
    console.error("createPostNowHandler error:", err);
    return res.status(400).json({ error: err.message || "Failed to create post" });
  }
}
