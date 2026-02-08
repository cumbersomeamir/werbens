import { getDb } from "../../db.js";

export async function getSocialAccounts(req, res) {
  const userId = req.query.userId;
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const db = await getDb();
    const coll = db.collection("SocialAccounts");
    const list = await coll
      .find({ userId: userId.trim() })
      .project({
        platform: 1,
        username: 1,
        displayName: 1,
        profileImageUrl: 1,
        connectedAt: 1,
        updatedAt: 1,
        channels: 1,
      })
      .toArray();

    const accounts = list.map((doc) => ({
      platform: doc.platform,
      username: doc.username,
      displayName: doc.displayName,
      profileImageUrl: doc.profileImageUrl,
      connectedAt: doc.connectedAt,
      updatedAt: doc.updatedAt,
      channels: doc.channels || null,
    }));

    res.json({ accounts });
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

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" });
  }
  if (!platform) {
    return res.status(400).json({ error: "platform is required" });
  }

  try {
    const db = await getDb();
    const accountsColl = db.collection("SocialAccounts");
    const socialColl = db.collection("SocialMedia");

    await accountsColl.deleteOne({ userId: userId.trim(), platform });
    if (platform === "youtube") {
      await socialColl.deleteMany({ userId: userId.trim(), platform: "youtube" });
    } else if (platform === "linkedin") {
      await socialColl.deleteMany({ userId: userId.trim(), platform: "linkedin" });
    } else {
      await socialColl.deleteMany({ userId: userId.trim(), platform });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("disconnectSocialAccount error:", err.message);
    res.status(500).json({ error: "Failed to disconnect" });
  }
}
