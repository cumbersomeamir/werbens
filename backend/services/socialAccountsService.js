/**
 * Social accounts service - handles social account data operations
 */
import { getDb } from "../db.js";
import { ObjectId } from "mongodb";

export async function getSocialAccountsData(userId) {
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const socialColl = db.collection("SocialMedia");

  const list = await accountsColl
    .find({ userId: userId.trim() })
    .project({
      _id: 1,
      platform: 1,
      platformUserId: 1,
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
    const igDocs = await socialColl
      .find(
        { userId: userId.trim(), platform: "instagram" },
        { projection: { _id: 1, username: 1, channelId: 1, profile: 1, updatedAt: 1 } }
      )
      .toArray();
    for (const igDoc of igDocs) {
      const profileUsername =
        typeof igDoc?.profile?.username === "string" && igDoc.profile.username
          ? `@${igDoc.profile.username}`
          : null;
      list.push({
        _id: igDoc._id, // so frontend can render stable rows
        platform: "instagram",
        platformUserId: igDoc.channelId ?? null,
        username: profileUsername ?? igDoc.username ?? "Instagram",
        displayName: "Instagram",
        profileImageUrl: igDoc?.profile?.profile_picture_url ?? null,
        connectedAt: igDoc.updatedAt,
        updatedAt: igDoc.updatedAt,
        channels: null,
        source: "socialMedia",
      });
    }
  }

  const accounts = list.map((doc) => ({
    platform: doc.platform,
    id: doc._id,
    platformUserId: doc.platformUserId,
    username: doc.username,
    displayName: doc.displayName,
    profileImageUrl: doc.profileImageUrl,
    connectedAt: doc.connectedAt,
    updatedAt: doc.updatedAt,
    channels: doc.channels || null,
    source: doc.source || "socialAccounts",
  }));

  return { accounts };
}

export async function disconnectSocialAccountData(userId, platform, opts = {}) {
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const socialColl = db.collection("SocialMedia");

  const trimmedUserId = userId.trim();
  const accountId = typeof opts.accountId === "string" ? opts.accountId : null;
  const channelId = typeof opts.channelId === "string" ? opts.channelId : null;

  // If a specific channelId is requested, delete ONLY that channel's analytics doc(s).
  // This is primarily used for "synthetic" accounts derived from SocialMedia (e.g. IG via Meta),
  // and is intentionally non-destructive to other channels/platforms.
  if (channelId) {
    await socialColl.deleteMany({ userId: trimmedUserId, platform, channelId });
    return { success: true };
  }

  // If a specific SocialAccounts document is requested, delete ONLY that account and its related analytics.
  if (accountId) {
    const _id = ObjectId.isValid(accountId) ? new ObjectId(accountId) : null;
    if (!_id) throw new Error("Invalid accountId");
    const account = await accountsColl.findOne({ _id, userId: trimmedUserId, platform });
    if (!account) return { success: true };

    await accountsColl.deleteOne({ _id, userId: trimmedUserId, platform });

    // Remove only analytics docs belonging to this account where possible.
    if (platform === "youtube") {
      const ids = Array.isArray(account.channels)
        ? account.channels.map((c) => c?.channelId).filter(Boolean)
        : [];
      if (ids.length) {
        await socialColl.deleteMany({ userId: trimmedUserId, platform: "youtube", channelId: { $in: ids } });
      }
      return { success: true };
    }

    if (platform === "facebook") {
      // For Meta accounts, we store both FB page ids and IG ids under channels.
      const fbIds = [];
      const igIds = [];
      if (Array.isArray(account.channels)) {
        for (const ch of account.channels) {
          if (!ch) continue;
          const p = ch.platform || ch.type;
          const cid = ch.channelId || ch.pageId || ch.igId;
          if (!cid) continue;
          if (p === "facebook") fbIds.push(String(cid));
          if (p === "instagram") igIds.push(String(cid));
        }
      }
      if (fbIds.length) {
        await socialColl.deleteMany({ userId: trimmedUserId, platform: "facebook", channelId: { $in: fbIds } });
      }
      if (igIds.length) {
        await socialColl.deleteMany({ userId: trimmedUserId, platform: "instagram", channelId: { $in: igIds } });
      }
      return { success: true };
    }

    const perAccountChannelId = account.platformUserId || account.channelId || null;
    if (perAccountChannelId) {
      if (platform === "x") {
        // Backward compatibility: older X analytics docs used channelId="".
        await socialColl.deleteMany({
          userId: trimmedUserId,
          platform: "x",
          channelId: { $in: [String(perAccountChannelId), ""] },
        });
      } else {
        await socialColl.deleteMany({
          userId: trimmedUserId,
          platform,
          channelId: String(perAccountChannelId),
        });
      }
      return { success: true };
    }

    // Fallback: do not delete analytics if we cannot safely identify ownership.
    return { success: true };
  }

  if (platform === "youtube") {
    await socialColl.deleteMany({ userId: trimmedUserId, platform: "youtube" });
  } else if (platform === "linkedin") {
    await socialColl.deleteMany({ userId: trimmedUserId, platform: "linkedin" });
  } else if (platform === "pinterest") {
    await socialColl.deleteMany({ userId: trimmedUserId, platform: "pinterest" });
  } else if (platform === "facebook") {
    await socialColl.deleteMany({ userId: trimmedUserId, platform: "facebook" });
    await socialColl.deleteMany({ userId: trimmedUserId, platform: "instagram" });
  } else if (platform === "instagram") {
    await socialColl.deleteMany({ userId: trimmedUserId, platform: "instagram" });
  } else {
    await socialColl.deleteMany({ userId: trimmedUserId, platform });
  }

  await accountsColl.deleteMany({ userId: trimmedUserId, platform });

  return { success: true };
}
