/**
 * Context controller - handles context API requests
 */
import { getContext, updateContext, updateContextPlatform } from "../services/contextService.js";

/**
 * Get user context
 * GET /api/context
 */
export async function getContextHandler(req, res) {
  const userId = req.query.userId || req.body.userId || "default-user";

  try {
    const context = await getContext(userId);
    
    if (!context) {
      return res.status(404).json({ error: "Context not found" });
    }

    return res.json(context);
  } catch (err) {
    console.error("Get context error:", err);
    return res.status(500).json({
      error: "Failed to get context",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

/**
 * Update user context (collate and summarize)
 * POST /api/context/update
 */
export async function updateContextHandler(req, res) {
  const userId = req.body.userId || "default-user";

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  try {
    const context = await updateContext(userId);
    return res.json({
      success: true,
      context,
    });
  } catch (err) {
    console.error("Update context error:", err);
    return res.status(500).json({
      error: "Failed to update context",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

/**
 * Update platform-specific context (user-edited)
 * POST /api/context/update-platform
 * Body: { userId, platform, value }
 */
export async function updateContextPlatformHandler(req, res) {
  const userId = req.body.userId;
  const platform = (req.body.platform || "").toLowerCase();
  const value = typeof req.body.value === "string" ? req.body.value : "";

  if (!userId || !platform) {
    return res.status(400).json({ error: "userId and platform required" });
  }

  const validPlatforms = ["x", "instagram", "youtube", "linkedin", "pinterest", "facebook"];
  if (!validPlatforms.includes(platform)) {
    return res.status(400).json({ error: "Invalid platform" });
  }

  try {
    const context = await updateContextPlatform(userId, platform, value);
    return res.json({ success: true, context });
  } catch (err) {
    console.error("Update context platform error:", err);
    return res.status(500).json({
      error: "Failed to update context",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
