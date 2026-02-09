/**
 * Context controller - handles context API requests
 */
import { getContext, updateContext } from "../services/contextService.js";

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
