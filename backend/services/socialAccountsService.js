/**
 * Social accounts service - handles social account data operations
 */
import { getDb } from "../db.js";

export async function getSocialAccountsData(userId) {
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const socialColl = db.collection("SocialMedia");

  const list = await accountsColl
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

  const platformSet = new Set(list.map((d) => d.platform));
  if (!platformSet.has("instagram")) {
    const igDoc = await socialColl.findOne(
      { userId: userId.trim(), platform: "instagram" },
      { projection: { username: 1, updatedAt: 1 } }
    );
    if (igDoc) {
      list.push({
        platform: "instagram",
        username: igDoc.username ?? "Instagram",
        displayName: "Instagram",
        profileImageUrl: null,
        connectedAt: igDoc.updatedAt,
        updatedAt: igDoc.updatedAt,
        channels: null,
      });
    }
  }

  const accounts = list.map((doc) => ({
    platform: doc.platform,
    username: doc.username,
    displayName: doc.displayName,
    profileImageUrl: doc.profileImageUrl,
    connectedAt: doc.connectedAt,
    updatedAt: doc.updatedAt,
    channels: doc.channels || null,
  }));

  return { accounts };
}

export async function disconnectSocialAccountData(userId, platform) {
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const socialColl = db.collection("SocialMedia");

  await accountsColl.deleteOne({ userId: userId.trim(), platform });

  if (platform === "youtube") {
    await socialColl.deleteMany({ userId: userId.trim(), platform: "youtube" });
  } else if (platform === "linkedin") {
    await socialColl.deleteMany({ userId: userId.trim(), platform: "linkedin" });
  } else if (platform === "pinterest") {
    await socialColl.deleteMany({ userId: userId.trim(), platform: "pinterest" });
  } else if (platform === "facebook") {
    await socialColl.deleteMany({ userId: userId.trim(), platform: "facebook" });
    await socialColl.deleteMany({ userId: userId.trim(), platform: "instagram" });
  } else if (platform === "instagram") {
    await socialColl.deleteMany({ userId: userId.trim(), platform: "instagram" });
  } else {
    await socialColl.deleteMany({ userId: userId.trim(), platform });
  }

  return { success: true };
}
