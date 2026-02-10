/**
 * Ensures MongoDB collections and indexes. Run from backend dir: node scripts/ensure-mongo-indexes.js
 * Loads .env from process.cwd() so MONGODB_URI is set.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getDb } from "../db.js";

function loadEnv() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    const value = t.slice(i + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set. Run from backend dir with .env present.");
    process.exit(1);
  }

  const db = await getDb();
  const dbName = process.env.MONGODB_DB || "werbens";

  const usersColl = db.collection("Users");
  await usersColl.createIndex({ userId: 1 }, { unique: true });

  const onboardingColl = db.collection("Onboarding");
  await onboardingColl.createIndex({ userId: 1 });

  const accountsColl = db.collection("SocialAccounts");
  await accountsColl.createIndex({ userId: 1 });
  // Allow multiple connected accounts per platform.
  // Drop the legacy unique index (userId+platform) if present.
  try {
    await accountsColl.dropIndex("userId_1_platform_1");
  } catch (_) {}
  await accountsColl.createIndex({ userId: 1, platform: 1 });
  // Enforce uniqueness per platform identity when platformUserId is present.
  await accountsColl.createIndex(
    { userId: 1, platform: 1, platformUserId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        platformUserId: { $exists: true, $type: "string", $ne: "" },
      },
    }
  );
  // Best-effort migration for older YouTube docs that may be missing platformUserId.
  await accountsColl.updateMany(
    {
      platform: "youtube",
      $or: [{ platformUserId: { $exists: false } }, { platformUserId: null }, { platformUserId: "" }],
      "channels.0.channelId": { $exists: true },
    },
    [{ $set: { platformUserId: { $toString: "$channels.0.channelId" } } }]
  );

  const socialColl = db.collection("SocialMedia");
  await socialColl.createIndex({ userId: 1 });
  try {
    await socialColl.dropIndex("userId_1_platform_1");
  } catch (_) {}
  await socialColl.updateMany(
    { $or: [{ channelId: { $exists: false } }, { channelId: null }] },
    { $set: { channelId: "" } }
  );
  await socialColl.createIndex({ userId: 1, platform: 1, channelId: 1 }, { unique: true });

  const collections = await db.listCollections().toArray();
  console.log("Collections in", dbName + ":", collections.map((c) => c.name).join(", "));
  console.log("Indexes ensured (Users.userId unique; SocialAccounts userId+platform+platformUserId unique (partial); SocialMedia userId+platform+channelId unique).");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
