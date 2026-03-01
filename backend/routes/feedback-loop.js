import {
  getFeedbackLoopConfig,
  updateFeedbackLoopConfig,
  triggerFeedbackLoopRun,
  getFeedbackGenerationHistory,
  getFeedbackLoopDashboard,
  listFeedbackLoopRuns,
  listFeedbackLoopTasks,
  listFeedbackLoopPosts,
  setFeedbackLoopStatus,
  runDueFeedbackTasks,
  runAutonomousFeedbackLoop,
} from "../feedback/engine/index.js";

function readUserId(req) {
  return String(req?.body?.userId || req?.query?.userId || "").trim();
}

function readChannelId(req) {
  return String(req?.body?.channelId || req?.query?.channelId || "").trim();
}

function readLimit(req, fallback, min = 1, max = 200) {
  const raw = Number(req?.query?.limit || req?.body?.limit || fallback);
  if (!Number.isFinite(raw)) return fallback;
  return Math.max(min, Math.min(max, Math.round(raw)));
}

function errorResponse(res, err) {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const lowerMessage = String(rawMessage || "").toLowerCase();

  if (
    lowerMessage.includes("gemini_api_key") ||
    lowerMessage.includes("missing gemini") ||
    lowerMessage.includes("api key not valid") ||
    lowerMessage.includes("api key is invalid")
  ) {
    return res.status(503).json({
      ok: false,
      error:
        "Gemini is not configured correctly on backend. Set a valid GEMINI_API_KEY in server environment and redeploy.",
    });
  }

  const status = Number(err?.statusCode) || 500;
  return res.status(status).json({ ok: false, error: rawMessage });
}

export async function getFeedbackLoopConfigHandler(req, res) {
  try {
    const userId = readUserId(req);
    if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });

    const config = await getFeedbackLoopConfig({ userId, channelId: readChannelId(req) });
    return res.json({ ok: true, config });
  } catch (err) {
    return errorResponse(res, err);
  }
}

export async function updateFeedbackLoopConfigHandler(req, res) {
  try {
    const userId = readUserId(req);
    if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });

    const channelId = readChannelId(req);
    const patch = req?.body?.patch && typeof req.body.patch === "object" ? req.body.patch : req.body || {};

    const config = await updateFeedbackLoopConfig({ userId, channelId, patch });
    return res.json({ ok: true, config });
  } catch (err) {
    return errorResponse(res, err);
  }
}

export async function startFeedbackLoopHandler(req, res) {
  try {
    const userId = readUserId(req);
    if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });
    const channelId = readChannelId(req);
    const runNow = req?.body?.runNow === undefined ? true : Boolean(req.body.runNow);
    const quickTest = Boolean(req?.body?.quickTest);
    const testTextOnly = req?.body?.testTextOnly === undefined ? true : Boolean(req.body.testTextOnly);
    const spacingRaw = Number(req?.body?.testSpacingMinutes);
    const testSpacingMinutes = Number.isFinite(spacingRaw)
      ? Math.max(1, Math.min(60, Math.round(spacingRaw)))
      : 1;

    const config = await setFeedbackLoopStatus({
      userId,
      channelId,
      enabled: true,
      status: "running",
    });

    if (runNow) {
      void triggerFeedbackLoopRun({
        userId,
        channelId,
        previewOnly: false,
        triggerSource: "start_auto_loop",
        options: {
          quickTest,
          testTextOnly,
          testSpacingMinutes,
        },
      }).catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[feedback-loop] start auto loop immediate run failed:", message);
      });
    }

    return res.json({
      ok: true,
      config,
      immediateRun: {
        queued: runNow,
        quickTest,
        testSpacingMinutes: quickTest ? testSpacingMinutes : null,
      },
    });
  } catch (err) {
    return errorResponse(res, err);
  }
}

export async function pauseFeedbackLoopHandler(req, res) {
  try {
    const userId = readUserId(req);
    if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });

    const config = await setFeedbackLoopStatus({
      userId,
      channelId: readChannelId(req),
      enabled: false,
      status: "paused",
    });

    return res.json({ ok: true, config });
  } catch (err) {
    return errorResponse(res, err);
  }
}

export async function triggerFeedbackLoopHandler(req, res) {
  try {
    const userId = readUserId(req);
    if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });

    const quickTest = Boolean(req?.body?.quickTest);
    const testTextOnly = req?.body?.testTextOnly === undefined ? true : Boolean(req.body.testTextOnly);
    const spacingRaw = Number(req?.body?.testSpacingMinutes);
    const testSpacingMinutes = Number.isFinite(spacingRaw)
      ? Math.max(1, Math.min(60, Math.round(spacingRaw)))
      : 1;

    const result = await triggerFeedbackLoopRun({
      userId,
      channelId: readChannelId(req),
      previewOnly: false,
      triggerSource: "manual_trigger",
      options: {
        quickTest,
        testTextOnly,
        testSpacingMinutes,
      },
    });

    return res.json({ ok: true, result });
  } catch (err) {
    return errorResponse(res, err);
  }
}

export async function generateFeedbackPreviewHandler(req, res) {
  try {
    const userId = readUserId(req);
    if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });

    const result = await triggerFeedbackLoopRun({
      userId,
      channelId: readChannelId(req),
      previewOnly: true,
      triggerSource: "generate_preview",
    });

    return res.json({ ok: true, result });
  } catch (err) {
    return errorResponse(res, err);
  }
}

export async function getFeedbackGenerationHistoryHandler(req, res) {
  try {
    const userId = readUserId(req);
    if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });

    const history = await getFeedbackGenerationHistory({
      userId,
      channelId: readChannelId(req),
      limit: readLimit(req, 20, 1, 100),
    });

    return res.json({ ok: true, history });
  } catch (err) {
    return errorResponse(res, err);
  }
}

export async function getFeedbackLoopDashboardHandler(req, res) {
  try {
    const userId = readUserId(req);
    if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });

    const dashboard = await getFeedbackLoopDashboard({ userId, channelId: readChannelId(req) });
    return res.json(dashboard);
  } catch (err) {
    return errorResponse(res, err);
  }
}

export async function getFeedbackLoopRunsHandler(req, res) {
  try {
    const userId = readUserId(req);
    if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });

    const runs = await listFeedbackLoopRuns({
      userId,
      channelId: readChannelId(req),
      limit: readLimit(req, 50, 1, 200),
    });

    return res.json({ ok: true, runs });
  } catch (err) {
    return errorResponse(res, err);
  }
}

export async function getFeedbackLoopTasksHandler(req, res) {
  try {
    const userId = readUserId(req);
    if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });

    const tasks = await listFeedbackLoopTasks({
      userId,
      channelId: readChannelId(req),
      limit: readLimit(req, 100, 1, 300),
    });

    return res.json({ ok: true, tasks });
  } catch (err) {
    return errorResponse(res, err);
  }
}

export async function getFeedbackLoopPostsHandler(req, res) {
  try {
    const userId = readUserId(req);
    if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });

    const posts = await listFeedbackLoopPosts({
      userId,
      channelId: readChannelId(req),
      limit: readLimit(req, 100, 1, 300),
    });

    return res.json({ ok: true, posts });
  } catch (err) {
    return errorResponse(res, err);
  }
}

export async function runFeedbackDueTasksHandler(req, res) {
  try {
    const result = await runDueFeedbackTasks(readLimit(req, 40, 1, 200));
    return res.json({ ok: true, result });
  } catch (err) {
    return errorResponse(res, err);
  }
}

export async function runFeedbackAutonomousTickHandler(req, res) {
  try {
    const result = await runAutonomousFeedbackLoop(readLimit(req, 8, 1, 50));
    return res.json({ ok: true, result });
  } catch (err) {
    return errorResponse(res, err);
  }
}
