import "dotenv/config";
import express from "express";
import cors from "cors";
import { saveOnboarding } from "./routes/onboarding.js";
import { getSocialAccounts, disconnectSocialAccount } from "./routes/social/accounts.js";
import { getSocialAnalytics } from "./routes/social/analytics.js";
import { getXAuthUrl, xCallback, syncX } from "./routes/social/x.js";
import { getYoutubeAuthUrl, youtubeCallback, syncYoutube, replyToYoutubeComment, replyToYoutubeCommentStream } from "./routes/social/youtube.js";
import {
  generateYoutubeTimePostingReport,
  getYoutubeTimePostingReport,
  downloadYoutubeTimePostingReportExcel,
} from "./routes/social/reports.js";
import {
  getYoutubeIdeationDashboard,
  searchYoutubeIdeationChannels,
  addYoutubeIdeationTrackedChannel,
  removeYoutubeIdeationTrackedChannel,
} from "./routes/social/ideation.js";
import { getLinkedInAuthUrl, linkedinCallback, syncLinkedIn } from "./routes/social/linkedin.js";
import { getPinterestAuthUrl, pinterestCallback, syncPinterest } from "./routes/social/pinterest.js";
import { getMetaAuthUrl, metaCallback, syncMeta } from "./routes/social/meta.js";
import { getInstagramAuthUrl, instagramCallback, syncInstagram } from "./routes/social/instagram.js";
import { createPostHandler, runSchedulerHandler } from "./routes/social/posting.js";
import { createPostNowHandler } from "./routes/social/posting/now/index.js";
import {
  createPostToAllNowHandler,
  createPostToAllMediaUploadHandler,
  getPostToAllPreferencesHandler,
  updatePostToAllPreferencesHandler,
} from "./routes/social/posting/all/index.js";
import { createSchedulePostHandler, getScheduledPostsHandler, deleteScheduledPostHandler } from "./routes/social/posting/schedule/index.js";
import { createAutomatePostHandler, getAutomatePostsHandler, deleteAutomatePostHandler } from "./routes/social/posting/automate/index.js";
import { runDueScheduledPosts } from "./services/socialPostingService.js";
import { chatHandler } from "./routes/chat/index.js";
import { imageGenerationHandler } from "./routes/image-generation/index.js";
import { classifyPromptHandler } from "./routes/model-switcher/index.js";
import { automaticGenerateHandler, automaticGetImagesHandler, automaticDownloadHandler, automaticDeleteImageHandler } from "./routes/automatic.js";
import {
  getFeedbackLoopConfigHandler,
  updateFeedbackLoopConfigHandler,
  startFeedbackLoopHandler,
  pauseFeedbackLoopHandler,
  triggerFeedbackLoopHandler,
  generateFeedbackPreviewHandler,
  getFeedbackGenerationHistoryHandler,
  getFeedbackLoopDashboardHandler,
  getFeedbackLoopRunsHandler,
  getFeedbackLoopTasksHandler,
  getFeedbackLoopPostsHandler,
  runFeedbackDueTasksHandler,
  runFeedbackAutonomousTickHandler,
} from "./routes/feedback-loop.js";
import { startFeedbackLoopWorkers } from "./feedback/engine/index.js";
import {
  getOrCreateSessionHandler,
  clearSessionHandler,
  getSessionMessagesHandler,
} from "./routes/sessions/index.js";
import { getContextHandler, updateContextHandler, updateContextPlatformHandler } from "./routes/context.js";
import {
  createAgentHandler,
  getAgentsHandler,
  getAgentByIdHandler,
  updateAgentHandler,
  deleteAgentHandler,
  generateFlowHandler,
  runAgentHandler,
  getConstantsHandler,
} from "./agents/index.js";

const app = express();
const PORT = process.env.PORT || 8080;
const SCHEDULER_ENABLED = String(process.env.SOCIAL_SCHEDULER_ENABLED || "true").toLowerCase() !== "false";
const SCHEDULER_INTERVAL_MS = Math.max(15000, Number(process.env.SOCIAL_SCHEDULER_INTERVAL_MS) || 30000);
const MEDIA_UPLOAD_PATH = "/api/social/post/all/media/upload";
const defaultJsonParser = express.json({ limit: "50mb" });
const mediaUploadJsonParser = express.json({ limit: "150mb" });

app.use(cors());
app.use((req, res, next) => {
  const parser = req.path === MEDIA_UPLOAD_PATH ? mediaUploadJsonParser : defaultJsonParser;
  return parser(req, res, next);
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "werbens-backend" });
});

app.post("/api/onboarding", saveOnboarding);

// Social: list connected accounts & disconnect
app.get("/api/social/accounts", getSocialAccounts);
app.delete("/api/social/accounts/:platform", disconnectSocialAccount);

// X (Twitter) OAuth: get auth URL, callback (GET so X can redirect)
app.get("/api/social/x/auth-url", getXAuthUrl);
app.get("/api/social/x/callback", xCallback);
app.post("/api/social/x/sync", syncX);

// YouTube OAuth: get auth URL, callback (GET so Google can redirect)
app.get("/api/social/youtube/auth-url", getYoutubeAuthUrl);
app.get("/api/social/youtube/callback", youtubeCallback);
app.post("/api/social/youtube/sync", syncYoutube);
app.post("/api/social/youtube/reply", replyToYoutubeComment);
app.get("/api/social/youtube/reply/stream", replyToYoutubeCommentStream);
app.post("/api/social/youtube/reports/time-of-posting", generateYoutubeTimePostingReport);
app.get("/api/social/youtube/reports/time-of-posting", getYoutubeTimePostingReport);
app.get("/api/social/youtube/reports/time-of-posting/excel", downloadYoutubeTimePostingReportExcel);
app.get("/api/social/youtube/ideation-engine", getYoutubeIdeationDashboard);
app.get("/api/social/youtube/ideation-engine/search", searchYoutubeIdeationChannels);
app.post("/api/social/youtube/ideation-engine/tracked", addYoutubeIdeationTrackedChannel);
app.delete("/api/social/youtube/ideation-engine/tracked", removeYoutubeIdeationTrackedChannel);

// LinkedIn OAuth: get auth URL, callback (GET so LinkedIn can redirect)
app.get("/api/social/linkedin/auth-url", getLinkedInAuthUrl);
app.get("/api/social/linkedin/callback", linkedinCallback);
app.post("/api/social/linkedin/sync", syncLinkedIn);

// Pinterest OAuth: get auth URL, callback (GET so Pinterest can redirect)
app.get("/api/social/pinterest/auth-url", getPinterestAuthUrl);
app.get("/api/social/pinterest/callback", pinterestCallback);
app.post("/api/social/pinterest/sync", syncPinterest);

// Meta (Facebook + Instagram via Pages) OAuth: get auth URL, callback
app.get("/api/social/meta/auth-url", getMetaAuthUrl);
app.get("/api/social/meta/callback", metaCallback);
app.post("/api/social/meta/sync", syncMeta);

// Instagram (standalone Instagram Login, no Facebook Page required)
app.get("/api/social/instagram/auth-url", getInstagramAuthUrl);
app.get("/api/social/instagram/callback", instagramCallback);
app.post("/api/social/instagram/sync", syncInstagram);

// Social analytics: GET data for analytics UI (no tokens)
app.get("/api/social/analytics", getSocialAnalytics);

// Social posting: create posts + run scheduler (legacy endpoint - routes to /now)
app.post("/api/social/post", createPostHandler);

// Immediate posting (Post Now)
app.post("/api/social/post/now", createPostNowHandler);
app.post("/api/social/post/all/now", createPostToAllNowHandler);
app.post(MEDIA_UPLOAD_PATH, createPostToAllMediaUploadHandler);
app.get("/api/social/post/all/preferences", getPostToAllPreferencesHandler);
app.put("/api/social/post/all/preferences", updatePostToAllPreferencesHandler);

// Scheduled posting
app.post("/api/social/post/schedule", createSchedulePostHandler);
app.get("/api/social/post/schedule", getScheduledPostsHandler);
app.delete("/api/social/post/schedule/:id", deleteScheduledPostHandler);

// Automated posting
app.post("/api/social/post/automate", createAutomatePostHandler);
app.get("/api/social/post/automate", getAutomatePostsHandler);
app.delete("/api/social/post/automate/:id", deleteAutomatePostHandler);

// Scheduler trigger
app.post("/api/social/posting/run", runSchedulerHandler);

// Chat and Image Generation APIs
app.post("/api/chat", chatHandler);
app.post("/api/generate-image", imageGenerationHandler);
app.post("/api/model-switcher/classify", classifyPromptHandler);

// Automatic personalised content API
app.post("/api/automatic/generate", automaticGenerateHandler);
app.get("/api/automatic/images", automaticGetImagesHandler);
app.post("/api/automatic/images/delete", automaticDeleteImageHandler);
app.get("/api/automatic/download", automaticDownloadHandler);

// Feedback loop (X phase-1, generation-aware)
app.get("/api/feedback-loop/config", getFeedbackLoopConfigHandler);
app.patch("/api/feedback-loop/config", updateFeedbackLoopConfigHandler);
app.post("/api/feedback-loop/start", startFeedbackLoopHandler);
app.post("/api/feedback-loop/pause", pauseFeedbackLoopHandler);
app.post("/api/feedback-loop/trigger", triggerFeedbackLoopHandler);
app.post("/api/feedback-loop/generate-preview", generateFeedbackPreviewHandler);
app.get("/api/feedback-loop/generation-history", getFeedbackGenerationHistoryHandler);
app.get("/api/feedback-loop/dashboard", getFeedbackLoopDashboardHandler);
app.get("/api/feedback-loop/runs", getFeedbackLoopRunsHandler);
app.get("/api/feedback-loop/tasks", getFeedbackLoopTasksHandler);
app.get("/api/feedback-loop/posts", getFeedbackLoopPostsHandler);
app.post("/api/feedback-loop/tasks/run", runFeedbackDueTasksHandler);
app.post("/api/feedback-loop/autonomous/run", runFeedbackAutonomousTickHandler);

// Session management APIs
app.post("/api/sessions/get-or-create", getOrCreateSessionHandler);
app.post("/api/sessions/clear", clearSessionHandler);
app.get("/api/sessions/:sessionId/messages", getSessionMessagesHandler);

// Context management APIs
app.get("/api/context", getContextHandler);
app.post("/api/context/update", updateContextHandler);
app.post("/api/context/update-platform", updateContextPlatformHandler);

// Agents APIs (human-in-the-loop flows)
app.get("/api/agents/constants", getConstantsHandler);
app.post("/api/agents", createAgentHandler);
app.get("/api/agents", getAgentsHandler);
app.get("/api/agents/:id", getAgentByIdHandler);
app.patch("/api/agents/:id", updateAgentHandler);
app.delete("/api/agents/:id", deleteAgentHandler);
app.post("/api/agents/:id/generate-flow", generateFlowHandler);
app.post("/api/agents/:id/run", runAgentHandler);

function startSocialSchedulerLoop() {
  if (!SCHEDULER_ENABLED) {
    console.log("Social scheduler loop is disabled (SOCIAL_SCHEDULER_ENABLED=false).");
    return;
  }

  let schedulerTickInFlight = false;
  const timer = setInterval(async () => {
    if (schedulerTickInFlight) return;
    schedulerTickInFlight = true;
    try {
      const result = await runDueScheduledPosts(25);
      if (Number(result?.processed) > 0) {
        console.log(`[social-scheduler] processed ${result.processed} due job(s)`);
      }
    } catch (err) {
      console.error("[social-scheduler] tick failed:", err);
    } finally {
      schedulerTickInFlight = false;
    }
  }, SCHEDULER_INTERVAL_MS);

  if (typeof timer.unref === "function") {
    timer.unref();
  }
  console.log(`[social-scheduler] running every ${SCHEDULER_INTERVAL_MS}ms`);
}

app.listen(PORT, () => {
  console.log(`Werbens backend running at http://localhost:${PORT}`);
  startSocialSchedulerLoop();
  startFeedbackLoopWorkers();
});
