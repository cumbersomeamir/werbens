import "dotenv/config";
import express from "express";
import cors from "cors";
import { saveOnboarding } from "./routes/onboarding.js";
import { getSocialAccounts, disconnectSocialAccount } from "./routes/social/accounts.js";
import { getSocialAnalytics } from "./routes/social/analytics.js";
import { getXAuthUrl, xCallback, syncX } from "./routes/social/x.js";
import { getYoutubeAuthUrl, youtubeCallback, syncYoutube } from "./routes/social/youtube.js";
import { getLinkedInAuthUrl, linkedinCallback, syncLinkedIn } from "./routes/social/linkedin.js";
import { getPinterestAuthUrl, pinterestCallback, syncPinterest } from "./routes/social/pinterest.js";
import { getMetaAuthUrl, metaCallback, syncMeta } from "./routes/social/meta.js";
import { getInstagramAuthUrl, instagramCallback, syncInstagram } from "./routes/social/instagram.js";
import { createPostHandler, runSchedulerHandler } from "./routes/social/posting.js";
import { createPostNowHandler } from "./routes/social/posting/now/index.js";
import { createSchedulePostHandler, getScheduledPostsHandler, deleteScheduledPostHandler } from "./routes/social/posting/schedule/index.js";
import { createAutomatePostHandler, getAutomatePostsHandler, deleteAutomatePostHandler } from "./routes/social/posting/automate/index.js";
import { chatHandler } from "./routes/chat/index.js";
import { imageGenerationHandler } from "./routes/image-generation/index.js";
import { classifyPromptHandler } from "./routes/model-switcher/index.js";
import { automaticGenerateHandler, automaticGetImagesHandler, automaticDownloadHandler, automaticDeleteImageHandler } from "./routes/automatic.js";
import {
  getOrCreateSessionHandler,
  clearSessionHandler,
  getSessionMessagesHandler,
} from "./routes/sessions/index.js";
import { getContextHandler, updateContextHandler, updateContextPlatformHandler } from "./routes/context.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

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

// Session management APIs
app.post("/api/sessions/get-or-create", getOrCreateSessionHandler);
app.post("/api/sessions/clear", clearSessionHandler);
app.get("/api/sessions/:sessionId/messages", getSessionMessagesHandler);

// Context management APIs
app.get("/api/context", getContextHandler);
app.post("/api/context/update", updateContextHandler);
app.post("/api/context/update-platform", updateContextPlatformHandler);

app.listen(PORT, () => {
  console.log(`Werbens backend running at http://localhost:${PORT}`);
});
