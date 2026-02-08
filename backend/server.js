import express from "express";
import cors from "cors";
import { saveOnboarding } from "./routes/onboarding.js";
import { getSocialAccounts, disconnectSocialAccount } from "./routes/social/accounts.js";
import { getSocialAnalytics } from "./routes/social/analytics.js";
import { getXAuthUrl, xCallback, syncX } from "./routes/social/x.js";
import { getYoutubeAuthUrl, youtubeCallback, syncYoutube } from "./routes/social/youtube.js";

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

// Social analytics: GET data for analytics UI (no tokens)
app.get("/api/social/analytics", getSocialAnalytics);

app.listen(PORT, () => {
  console.log(`Werbens backend running at http://localhost:${PORT}`);
});
