/**
 * Onboarding service - handles onboarding data operations.
 * Global defaults only. No tokens stored here.
 * Per-account overrides will live in /accounts Manage later.
 */
import { getDb } from "../db.js";
import { upsertUser } from "../lib/users.js";
import {
  PRIMARY_ROLES,
  CONTENT_GOALS,
  PRIORITY_PLATFORMS,
  POSTING_CADENCE,
  VISUAL_VIBES,
  VISUAL_THEMES,
  FACE_USAGE,
  FRAMING,
  TONES,
  EMOJI_LEVELS,
  CTA_STYLES,
} from "../models/onboarding.js";

function clamp(num, min, max) {
  if (num == null) return undefined;
  const n = Number(num);
  if (Number.isNaN(n)) return undefined;
  return Math.max(min, Math.min(max, n));
}

/**
 * Validate and normalize onboarding payload
 */
function validatePayload(body) {
  const userId = body.userId ? String(body.userId).trim() : null;
  if (!userId) throw new Error("userId is required");

  const payload = {
    userId,
    updatedAt: new Date(),
  };

  if (body.primaryRole != null) {
    if (!PRIMARY_ROLES.includes(body.primaryRole)) throw new Error("Invalid primaryRole");
    payload.primaryRole = body.primaryRole;
  }
  if (body.industries != null) {
    const arr = Array.isArray(body.industries) ? body.industries : [body.industries].filter(Boolean);
    if (arr.length > 2) throw new Error("industries max 2");
    payload.industries = arr.slice(0, 2).map(String);
  }
  if (body.audienceTypes != null) {
    payload.audienceTypes = Array.isArray(body.audienceTypes) ? body.audienceTypes.map(String) : [];
  }
  if (body.primaryGoal != null) {
    if (!CONTENT_GOALS.includes(body.primaryGoal)) throw new Error("Invalid primaryGoal");
    payload.primaryGoal = body.primaryGoal;
  }
  if (body.secondaryGoal != null) {
    if (body.secondaryGoal !== "" && !CONTENT_GOALS.includes(body.secondaryGoal))
      throw new Error("Invalid secondaryGoal");
    payload.secondaryGoal = body.secondaryGoal || undefined;
  }
  if (body.priorityPlatform != null) {
    if (!PRIORITY_PLATFORMS.includes(body.priorityPlatform)) throw new Error("Invalid priorityPlatform");
    payload.priorityPlatform = body.priorityPlatform;
  }
  if (body.postingCadence != null) {
    if (!POSTING_CADENCE.includes(body.postingCadence)) throw new Error("Invalid postingCadence");
    payload.postingCadence = body.postingCadence;
  }
  if (body.visualVibes != null) {
    const arr = Array.isArray(body.visualVibes) ? body.visualVibes : [];
    if (arr.length > 3) throw new Error("visualVibes max 3");
    const valid = arr.filter((v) => VISUAL_VIBES.includes(v)).slice(0, 3);
    payload.visualVibes = valid;
  }
  if (body.visualTheme != null) {
    if (body.visualTheme !== "" && !VISUAL_THEMES.includes(body.visualTheme))
      throw new Error("Invalid visualTheme");
    payload.visualTheme = body.visualTheme || undefined;
  }
  if (body.complexityPreference != null) {
    payload.complexityPreference = clamp(body.complexityPreference, 0, 100);
  }
  if (typeof body.showPeople === "boolean") payload.showPeople = body.showPeople;
  if (body.faceUsage != null) {
    if (!FACE_USAGE.includes(body.faceUsage)) throw new Error("Invalid faceUsage");
    payload.faceUsage = body.faceUsage;
  }
  if (body.framing != null) {
    if (!FRAMING.includes(body.framing)) throw new Error("Invalid framing");
    payload.framing = body.framing;
  }
  if (body.tone != null) {
    if (!TONES.includes(body.tone)) throw new Error("Invalid tone");
    payload.tone = body.tone;
  }
  if (body.emojiLevel != null) {
    if (!EMOJI_LEVELS.includes(body.emojiLevel)) throw new Error("Invalid emojiLevel");
    payload.emojiLevel = body.emojiLevel;
  }
  if (body.ctaStyle != null) {
    if (!CTA_STYLES.includes(body.ctaStyle)) throw new Error("Invalid ctaStyle");
    payload.ctaStyle = body.ctaStyle;
  }
  if (body.formality != null) {
    payload.formality = clamp(body.formality, 0, 100);
  }

  payload.version = typeof body.version === "number" ? body.version : 1;
  payload.source = body.source || "onboarding_v1";

  return payload;
}

/**
 * Upsert onboarding for user. No tokens stored.
 */
export async function saveOnboardingData(body) {
  const payload = validatePayload(body);
  const userId = payload.userId;

  await upsertUser({ userId, username: body.username ? String(body.username) : null });

  const db = await getDb();
  const collection = db.collection("Onboarding");
  const now = new Date();
  const update = {
    $set: { ...payload, updatedAt: now },
    $setOnInsert: { createdAt: now },
  };

  const result = await collection.findOneAndUpdate(
    { userId },
    update,
    { upsert: true, returnDocument: "after" }
  );

  // Optional: mark user as onboarding complete if Users collection has the field
  const usersColl = db.collection("Users");
  await usersColl.updateOne(
    { userId },
    { $set: { onboardingComplete: true, updatedAt: now } }
  );

  return {
    success: true,
    id: result._id,
    onboarding: result,
  };
}
