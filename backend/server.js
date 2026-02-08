import express from "express";
import cors from "cors";
import { saveOnboarding } from "./routes/onboarding.js";
import { getSocialAccounts, disconnectSocialAccount } from "./routes/social/accounts.js";
import { getXAuthUrl, xCallback } from "./routes/social/x.js";

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

app.listen(PORT, () => {
  console.log(`Werbens backend running at http://localhost:${PORT}`);
});
