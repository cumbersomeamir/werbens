/**
 * Social accounts controller - handles social accounts API requests
 */
import { getSocialAccountsData, disconnectSocialAccountData } from "../services/socialAccountsService.js";

export async function getSocialAccounts(req, res) {
  const userId = req.query.userId;
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const result = await getSocialAccountsData(userId);
    res.json(result);
  } catch (err) {
    const isMongoDown =
      err.name === "MongoServerSelectionError" ||
      err.name === "MongoNetworkError" ||
      err.cause?.code === "ECONNREFUSED";
    console.error("getSocialAccounts error:", err.message);
    if (isMongoDown) {
      return res.status(503).json({
        error: "Database unavailable",
        accounts: [],
      });
    }
    res.status(500).json({ error: "Failed to load accounts", accounts: [] });
  }
}

export async function disconnectSocialAccount(req, res) {
  const userId = req.query.userId;
  const platform = (req.params.platform || "").toLowerCase();
  const accountId = typeof req.query.accountId === "string" ? req.query.accountId : null;
  const channelId = typeof req.query.channelId === "string" ? req.query.channelId : null;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" });
  }
  if (!platform) {
    return res.status(400).json({ error: "platform is required" });
  }

  try {
    const result = await disconnectSocialAccountData(userId, platform, { accountId, channelId });
    res.json(result);
  } catch (err) {
    console.error("disconnectSocialAccount error:", err.message);
    res.status(500).json({ error: "Failed to disconnect" });
  }
}
