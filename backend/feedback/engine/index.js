import { ObjectId } from "mongodb";
import { getDb } from "../../db.js";
import { getPresignedUrl } from "../../services/s3Service.js";
import { createScheduledPostsFromRequest } from "../../services/socialPostingService.js";
import { generateTextVariants } from "../generation-text/index.js";
import { generateImageVariants } from "../generation-image/index.js";
import { selectGenerationWinner } from "../generation-selector/index.js";
import { buildGeminiPostFeedback } from "../gemini-post-feedback/index.js";
import { buildPublishedPostFeedback } from "../published-post-feedback/index.js";
import { buildTimeseriesFeedback } from "../timeseries-feedback/index.js";
import { buildAudienceFeedback } from "../audience-feedback/index.js";
import { buildContentComparisonFeedback } from "../content-comparison-feedback/index.js";
import { buildSentimentFeedback } from "../sentiment-feedback/index.js";
import { buildCompetitorBenchmarkFeedback } from "../competitor-benchmark-feedback/index.js";
import { buildRetentionFeedback } from "../retention-feedback/index.js";
import { buildCrossPostCorrelationFeedback } from "../cross-post-correlation-feedback/index.js";
import { buildPlatformSignalFeedback } from "../platform-signal-feedback/index.js";
import {
  FEEDBACK_COLLECTIONS,
  TIMESERIES_CHECKPOINTS,
  DEFAULT_CONFIG,
  normalizeText,
  safeNumber,
  buildRunId,
  cloneForStorage,
  hashFingerprint,
  getTodayRangeUtc,
} from "../lib/utils.js";
import {
  fetchLatestOwnTweets,
  fetchTweetMetricsById,
  summarizeRecentTweetPerformance,
  uploadMediaToX,
} from "./xClient.js";

const runLocks = new Set();
let workersStarted = false;

function buildConfigFilter({ userId, channelId }) {
  return {
    userId,
    platform: "x",
    channelId,
  };
}

function toObjectId(value) {
  try {
    return new ObjectId(String(value || ""));
  } catch {
    return null;
  }
}

function readGeminiApiKeyOrThrow() {
  const apiKey = normalizeText(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      ""
  );
  if (apiKey) return apiKey;

  const err = new Error(
    "Gemini is not configured on backend. Set GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLE_GENAI_API_KEY) in server environment."
  );
  err.statusCode = 503;
  err.code = "MISSING_GEMINI_API_KEY";
  throw err;
}

async function resolveXAccount({ db, userId, channelId = "" }) {
  const accountsColl = db.collection("SocialAccounts");
  const accounts = await accountsColl
    .find({ userId, platform: "x" })
    .sort({ updatedAt: -1 })
    .toArray();

  if (!accounts.length) {
    const err = new Error("No connected X account found for this user");
    err.statusCode = 404;
    throw err;
  }

  const requested = normalizeText(channelId);
  const account = requested
    ? accounts.find((row) => String(row?.platformUserId || "") === requested)
    : accounts[0];

  if (!account) {
    const err = new Error("Requested X channel not found");
    err.statusCode = 404;
    throw err;
  }

  const resolvedChannelId = String(account?.platformUserId || "");
  if (!resolvedChannelId) {
    const err = new Error("X account is missing platformUserId");
    err.statusCode = 400;
    throw err;
  }

  if (!account?.accessToken) {
    const err = new Error("X account missing access token; reconnect required");
    err.statusCode = 400;
    throw err;
  }

  return {
    account,
    channelId: resolvedChannelId,
    accountLabel: normalizeText(account?.displayName || account?.username || resolvedChannelId),
    accountHandle: normalizeText(account?.username || resolvedChannelId),
  };
}

async function loadFeedbackGroundingContext({ db, userId }) {
  const contextColl = db.collection("Context");
  try {
    const contextDoc = await contextColl.findOne(
      { userId },
      {
        projection: {
          x_context: 1,
          general_context: 1,
        },
      }
    );

    const xContext = normalizeText(contextDoc?.x_context || "");
    const generalContext = normalizeText(contextDoc?.general_context || "");
    const merged = [xContext, generalContext].filter(Boolean).join("\n\n");

    return {
      xContext,
      generalContext,
      mergedContext: merged.slice(0, 3200),
      usedAccountContext: Boolean(xContext),
    };
  } catch {
    return {
      xContext: "",
      generalContext: "",
      mergedContext: "",
      usedAccountContext: false,
    };
  }
}

export async function getFeedbackLoopConfig({ userId, channelId = "" }) {
  const db = await getDb();
  const resolved = await resolveXAccount({ db, userId, channelId });
  const configColl = db.collection(FEEDBACK_COLLECTIONS.CONFIG);
  const filter = buildConfigFilter({ userId, channelId: resolved.channelId });

  const now = new Date();
  const existing = await configColl.findOne(filter);
  if (existing) {
    return existing;
  }

  const doc = {
    ...filter,
    ...DEFAULT_CONFIG,
    channelLabel: resolved.accountLabel,
    createdAt: now,
    updatedAt: now,
  };

  await configColl.insertOne(doc);
  return doc;
}

export async function updateFeedbackLoopConfig({ userId, channelId = "", patch = {} }) {
  const db = await getDb();
  const resolved = await resolveXAccount({ db, userId, channelId });
  const configColl = db.collection(FEEDBACK_COLLECTIONS.CONFIG);

  const allowedKeys = new Set([
    "enabled",
    "status",
    "autonomousMode",
    "maxPostsPerDay",
    "minGapMinutes",
    "textVariantsPerRun",
    "imageVariantsPerRun",
    "candidateBundlesPerRun",
    "explorationRate",
    "allowImages",
    "allowTextOnly",
    "allowPromptMutation",
    "allowCaptionMutation",
    "allowTagsMutation",
    "allowCtaMutation",
    "allowFrequencyMutation",
    "competitorMode",
    "competitorSeedMode",
  ]);

  const nextPatch = {};
  for (const [key, value] of Object.entries(patch || {})) {
    if (!allowedKeys.has(key)) continue;
    if (key === "maxPostsPerDay") {
      nextPatch[key] = Math.max(1, Math.min(4, Math.round(Number(value) || DEFAULT_CONFIG.maxPostsPerDay)));
      continue;
    }
    if (key === "minGapMinutes") {
      nextPatch[key] = Math.max(15, Math.min(24 * 60, Math.round(Number(value) || DEFAULT_CONFIG.minGapMinutes)));
      continue;
    }
    if (key === "textVariantsPerRun") {
      nextPatch[key] = Math.max(2, Math.min(8, Math.round(Number(value) || DEFAULT_CONFIG.textVariantsPerRun)));
      continue;
    }
    if (key === "imageVariantsPerRun") {
      nextPatch[key] = Math.max(1, Math.min(4, Math.round(Number(value) || DEFAULT_CONFIG.imageVariantsPerRun)));
      continue;
    }
    if (key === "candidateBundlesPerRun") {
      nextPatch[key] = Math.max(2, Math.min(10, Math.round(Number(value) || DEFAULT_CONFIG.candidateBundlesPerRun)));
      continue;
    }
    if (key === "explorationRate") {
      const numeric = Number(value);
      nextPatch[key] = Number.isFinite(numeric) ? Math.max(0, Math.min(1, numeric)) : DEFAULT_CONFIG.explorationRate;
      continue;
    }
    nextPatch[key] = value;
  }

  const now = new Date();
  const filter = buildConfigFilter({ userId, channelId: resolved.channelId });
  const insertDefaults = { ...DEFAULT_CONFIG };
  for (const key of Object.keys(nextPatch)) {
    delete insertDefaults[key];
  }

  await configColl.updateOne(
    filter,
    {
      $setOnInsert: {
        ...insertDefaults,
        createdAt: now,
      },
      $set: {
        ...nextPatch,
        channelLabel: resolved.accountLabel,
        updatedAt: now,
      },
    },
    { upsert: true }
  );

  let updated = await configColl.findOne(filter);
  if (!updated?.allowImages && !updated?.allowTextOnly) {
    await configColl.updateOne(
      filter,
      {
        $set: {
          allowTextOnly: true,
          updatedAt: new Date(),
        },
      }
    );
    updated = await configColl.findOne(filter);
  }
  return updated;
}

async function persistFeedbackServices({ db, runId, userId, channelId, context }) {
  const now = new Date();

  const published = buildPublishedPostFeedback({ recentPosts: context.recentPosts });
  const timeseries = buildTimeseriesFeedback({ snapshots: context.timeseriesSnapshots });
  const audience = buildAudienceFeedback({ recentPosts: context.recentPosts });
  const comparison = buildContentComparisonFeedback({ recentPosts: context.recentPosts });
  const sentiment = buildSentimentFeedback({ recentPosts: context.recentPosts });
  const competitor = buildCompetitorBenchmarkFeedback({ recentPosts: context.recentPosts });
  const retention = buildRetentionFeedback({ recentPosts: context.recentPosts });
  const crossPost = buildCrossPostCorrelationFeedback({ recentPosts: context.recentPosts });
  const platformSignal = buildPlatformSignalFeedback({ recentPosts: context.recentPosts });

  const baseDoc = {
    runId,
    userId,
    platform: "x",
    channelId,
    createdAt: now,
    updatedAt: now,
  };

  await Promise.all([
    db.collection(FEEDBACK_COLLECTIONS.PUBLISHED_POST).insertOne({ ...baseDoc, data: published }),
    db.collection(FEEDBACK_COLLECTIONS.TIMESERIES).insertOne({ ...baseDoc, type: "service_summary", data: timeseries }),
    db.collection(FEEDBACK_COLLECTIONS.AUDIENCE).insertOne({ ...baseDoc, data: audience }),
    db.collection(FEEDBACK_COLLECTIONS.CONTENT_COMPARISON).insertOne({ ...baseDoc, data: comparison }),
    db.collection(FEEDBACK_COLLECTIONS.SENTIMENT).insertOne({ ...baseDoc, data: sentiment }),
    db.collection(FEEDBACK_COLLECTIONS.COMPETITOR).insertOne({ ...baseDoc, data: competitor }),
    db.collection(FEEDBACK_COLLECTIONS.RETENTION).insertOne({ ...baseDoc, data: retention }),
    db.collection(FEEDBACK_COLLECTIONS.CROSS_POST).insertOne({ ...baseDoc, data: crossPost }),
    db.collection(FEEDBACK_COLLECTIONS.PLATFORM_SIGNAL).insertOne({ ...baseDoc, data: platformSignal }),
  ]);

  return {
    published,
    timeseries,
    audience,
    comparison,
    sentiment,
    competitor,
    retention,
    crossPost,
    platformSignal,
  };
}

function composeCaptionWithHashtags(variant) {
  const caption = normalizeText(variant?.caption || "");
  const hashtags = Array.isArray(variant?.hashtags) ? variant.hashtags : [];
  const hashPart = hashtags.length
    ? hashtags
        .slice(0, 6)
        .map((tag) => (String(tag).startsWith("#") ? String(tag) : `#${tag}`))
        .join(" ")
    : "";

  let full = caption;
  if (hashPart && !caption.toLowerCase().includes(hashPart.toLowerCase())) {
    full = `${caption}\n\n${hashPart}`.trim();
  }

  if (full.length > 280) {
    full = full.slice(0, 279).trim();
  }
  return full;
}

async function getRecentVariantFingerprints({ db, userId, channelId }) {
  const coll = db.collection(FEEDBACK_COLLECTIONS.GENERATION_TEXT);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const docs = await coll
    .find({ userId, channelId, createdAt: { $gte: since } })
    .project({ fingerprint: 1 })
    .toArray();

  return docs
    .map((doc) => String(doc?.fingerprint || "").trim())
    .filter(Boolean);
}

async function persistGenerationArtifacts({
  db,
  runId,
  userId,
  channelId,
  textGeneration,
  imageGeneration,
  selection,
  config,
}) {
  const textColl = db.collection(FEEDBACK_COLLECTIONS.GENERATION_TEXT);
  const imageColl = db.collection(FEEDBACK_COLLECTIONS.GENERATION_IMAGE);
  const selectionColl = db.collection(FEEDBACK_COLLECTIONS.GENERATION_SELECTION);
  const geminiColl = db.collection(FEEDBACK_COLLECTIONS.GEMINI_POST);

  const now = new Date();
  const textDocs = textGeneration.variants.map((variant, idx) => ({
    runId,
    userId,
    platform: "x",
    channelId,
    variantId: `${runId}-text-${idx + 1}`,
    model: process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash",
    promptTemplateVersion: "feedback-loop-text-v1",
    caption: variant.caption,
    hookStyle: variant.hookStyle,
    tone: variant.tone,
    ctaType: variant.ctaType,
    hashtags: variant.hashtags,
    reasoning: variant.reasoning,
    fingerprint: variant.fingerprint,
    fallback: Boolean(variant?.fallback),
    usage: cloneForStorage(textGeneration?.usage || null),
    createdAt: now,
    updatedAt: now,
  }));

  const imageDocs = imageGeneration.variants.map((variant, idx) => ({
    runId,
    userId,
    platform: "x",
    channelId,
    variantId: `${runId}-image-${idx + 1}`,
    promptTemplateVersion: "feedback-loop-image-v1",
    imagePrompt: variant.imagePrompt,
    visualStyle: variant.visualStyle,
    composition: variant.composition,
    reasoning: variant.reasoning,
    imageKey: variant.imageKey || "",
    imageUrl: variant.imageUrl || "",
    mimeType: variant.mimeType || "image/png",
    fingerprint: variant.fingerprint,
    fallback: Boolean(variant?.fallback),
    usage: cloneForStorage(variant?.usage || null),
    createdAt: now,
    updatedAt: now,
  }));

  if (textDocs.length) await textColl.insertMany(textDocs);
  if (imageDocs.length) await imageColl.insertMany(imageDocs);

  const selectedTextIndex = textGeneration.variants.findIndex(
    (variant) => variant.fingerprint === selection?.selected?.textVariant?.fingerprint
  );
  const selectedImageIndex = imageGeneration.variants.findIndex(
    (variant) => variant.fingerprint === selection?.selected?.imageVariant?.fingerprint
  );

  const selectedTextVariantId = selectedTextIndex >= 0 ? textDocs[selectedTextIndex]?.variantId : null;
  const selectedImageVariantId = selectedImageIndex >= 0 ? imageDocs[selectedImageIndex]?.variantId : null;

  const selectionDoc = {
    runId,
    userId,
    platform: "x",
    channelId,
    selectedTextVariantId,
    selectedImageVariantId,
    fallbackTextVariantId: null,
    fallbackImageVariantId: null,
    policy: cloneForStorage(selection?.policy || {}),
    selectedMode: selection?.selected?.mode || null,
    selectedScore: safeNumber(selection?.selected?.score),
    fallbackScore: safeNumber(selection?.fallback?.score),
    candidateCount: Array.isArray(selection?.candidates) ? selection.candidates.length : 0,
    candidates: cloneForStorage(selection?.candidates || []),
    allowImages: Boolean(config?.allowImages),
    allowTextOnly: Boolean(config?.allowTextOnly),
    selectedScheduledAt: selection?.scheduledAt ? new Date(selection.scheduledAt) : null,
    createdAt: now,
    updatedAt: now,
  };

  await selectionColl.insertOne(selectionDoc);

  const geminiFeedback = buildGeminiPostFeedback({
    textVariants: textGeneration?.variants || [],
    imageVariants: imageGeneration?.variants || [],
    selection,
  });

  await geminiColl.insertOne({
    runId,
    userId,
    platform: "x",
    channelId,
    data: geminiFeedback,
    createdAt: now,
    updatedAt: now,
  });

  return {
    textDocs,
    imageDocs,
    selectionDoc,
  };
}

async function maybeUploadSelectedImage({ account, selectedImageDoc }) {
  if (!selectedImageDoc?.imageKey) {
    return {
      mediaId: null,
      uploadInfo: {
        source: "no_image_key",
      },
    };
  }

  try {
    const imageUrl = await getPresignedUrl(selectedImageDoc.imageKey, 600);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download generated image from S3: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const upload = await uploadMediaToX({
      accessToken: account.accessToken,
      imageBuffer,
      mimeType: selectedImageDoc.mimeType || "image/png",
    });

    return {
      mediaId: upload?.mediaId || null,
      uploadInfo: cloneForStorage(upload),
    };
  } catch (err) {
    return {
      mediaId: null,
      uploadInfo: {
        source: "image_upload_error",
        error: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

async function createTimeseriesTasks({ db, runId, userId, channelId, feedbackPostId, scheduledPostId, scheduledAt }) {
  const taskColl = db.collection(FEEDBACK_COLLECTIONS.TASKS);
  const now = new Date();
  const baseDate = new Date(scheduledAt || now);

  const docs = TIMESERIES_CHECKPOINTS.map((checkpoint) => ({
    runId,
    userId,
    platform: "x",
    channelId,
    type: "timeseries_checkpoint",
    status: "pending",
    checkpoint: checkpoint.key,
    attempts: 0,
    payload: {
      feedbackPostId,
      scheduledPostId,
      checkpoint: checkpoint.key,
    },
    scheduledFor: new Date(baseDate.getTime() + checkpoint.delayMs),
    createdAt: now,
    updatedAt: now,
  }));

  if (docs.length) {
    await taskColl.insertMany(docs);
  }

  return docs;
}

async function createFeedbackLoopPost({
  db,
  runId,
  userId,
  channelId,
  scheduledPostId,
  selection,
  textDoc,
  imageDoc,
  uploadInfo,
  scheduledAt,
}) {
  const postsColl = db.collection(FEEDBACK_COLLECTIONS.POSTS);
  const now = new Date();
  const metrics = {
    likes: 0,
    replies: 0,
    reposts: 0,
    quotes: 0,
    bookmarks: 0,
    impressions: 0,
    engagementTotal: 0,
    engagementRate: 0,
  };

  const doc = {
    runId,
    userId,
    platform: "x",
    channelId,
    scheduledPostId: String(scheduledPostId || ""),
    platformPostId: "",
    status: "scheduled",
    mode: selection?.selected?.mode || "text_only",
    scheduledAt: new Date(scheduledAt),
    postedAt: null,
    selectedTextVariantId: textDoc?.variantId || null,
    selectedImageVariantId: imageDoc?.variantId || null,
    generationFingerprint: hashFingerprint(
      `${textDoc?.fingerprint || ""}|${imageDoc?.fingerprint || ""}|${selection?.selected?.mode || ""}`
    ),
    content: {
      caption: textDoc?.caption || "",
      hashtags: Array.isArray(textDoc?.hashtags) ? textDoc.hashtags : [],
      imageKey: imageDoc?.imageKey || "",
      imageUrl: imageDoc?.imageUrl || "",
      uploadInfo: cloneForStorage(uploadInfo || null),
    },
    metrics,
    createdAt: now,
    updatedAt: now,
  };

  const result = await postsColl.insertOne(doc);
  return {
    ...doc,
    _id: result.insertedId,
  };
}

async function countTodaysPlannedPosts({ db, userId, channelId }) {
  const postsColl = db.collection(FEEDBACK_COLLECTIONS.POSTS);
  const { start, end } = getTodayRangeUtc(new Date());
  return postsColl.countDocuments({
    userId,
    channelId,
    platform: "x",
    scheduledAt: { $gte: start, $lt: end },
    status: { $in: ["scheduled", "posted", "processing"] },
  });
}

async function getNextQuickTestScheduleTime({ db, userId, channelId, spacingMinutes = 1 }) {
  const postsColl = db.collection(FEEDBACK_COLLECTIONS.POSTS);
  const gapMs = Math.max(1, Math.min(60, Math.round(Number(spacingMinutes) || 1))) * 60 * 1000;
  const now = new Date();

  const latest = await postsColl.findOne(
    {
      userId,
      channelId,
      platform: "x",
      status: { $in: ["scheduled", "processing", "posted", "pending"] },
    },
    {
      sort: { scheduledAt: -1, createdAt: -1 },
      projection: { scheduledAt: 1 },
    }
  );

  const lastScheduled = latest?.scheduledAt ? new Date(latest.scheduledAt) : null;
  if (!lastScheduled || Number.isNaN(lastScheduled.getTime())) {
    return new Date(Date.now() + 10 * 1000);
  }

  const candidate = new Date(lastScheduled.getTime() + gapMs);
  if (candidate.getTime() <= now.getTime()) {
    return new Date(now.getTime() + 10 * 1000);
  }
  return candidate;
}

async function getRecentTimeseriesSnapshots({ db, userId, channelId, limit = 300 }) {
  const coll = db.collection(FEEDBACK_COLLECTIONS.TIMESERIES);
  const docs = await coll
    .find({ userId, channelId, type: { $ne: "service_summary" } })
    .sort({ createdAt: -1 })
    .limit(Math.max(10, Math.min(1000, limit)))
    .toArray();
  return docs;
}

export async function triggerFeedbackLoopRun({
  userId,
  channelId = "",
  previewOnly = false,
  triggerSource = "manual_trigger",
  options = {},
}) {
  if (!userId) throw new Error("userId is required");

  const db = await getDb();
  const resolved = await resolveXAccount({ db, userId, channelId });
  const groundingContext = await loadFeedbackGroundingContext({ db, userId });
  const lockKey = `${userId}:x:${resolved.channelId}`;

  if (runLocks.has(lockKey)) {
    throw new Error("Feedback loop run already in progress for this channel");
  }

  runLocks.add(lockKey);
  const runId = buildRunId();

  const runsColl = db.collection(FEEDBACK_COLLECTIONS.RUNS);
  const config = await getFeedbackLoopConfig({ userId, channelId: resolved.channelId });
  const quickTest = Boolean(options?.quickTest) && !previewOnly;
  const testTextOnly = options?.testTextOnly === undefined ? true : Boolean(options?.testTextOnly);
  const testSpacingMinutes = Math.max(1, Math.min(60, Math.round(Number(options?.testSpacingMinutes) || 1)));

  const allowImages = quickTest ? false : Boolean(config?.allowImages);
  const allowTextOnly = quickTest ? true : Boolean(config?.allowTextOnly) || !allowImages;
  const normalizedConfig = {
    ...config,
    allowImages,
    allowTextOnly,
  };

  const now = new Date();
  await runsColl.insertOne({
    runId,
    userId,
    platform: "x",
    channelId: resolved.channelId,
    status: "running",
    triggerSource,
    previewOnly: Boolean(previewOnly),
    accountHandle: resolved.accountHandle,
    options: {
      quickTest,
      testTextOnly,
      testSpacingMinutes,
    },
    contextSignals: {
      usedAccountContext: groundingContext.usedAccountContext,
      xContextLength: groundingContext.xContext.length,
      generalContextLength: groundingContext.generalContext.length,
    },
    startedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  try {
    const recentPosts = await fetchLatestOwnTweets({
      accessToken: resolved.account.accessToken,
      channelId: resolved.channelId,
      limit: 35,
    });

    const timeseriesSnapshots = await getRecentTimeseriesSnapshots({
      db,
      userId,
      channelId: resolved.channelId,
    });

    const feedbackSummary = summarizeRecentTweetPerformance(recentPosts);

    const serviceOutputs = await persistFeedbackServices({
      db,
      runId,
      userId,
      channelId: resolved.channelId,
      context: {
        recentPosts,
        timeseriesSnapshots,
      },
    });

    const fingerprints = await getRecentVariantFingerprints({
      db,
      userId,
      channelId: resolved.channelId,
    });

    const apiKey = readGeminiApiKeyOrThrow();

    const textGeneration = await generateTextVariants({
      apiKey,
      accountHandle: resolved.accountHandle,
      feedbackSummary: JSON.stringify({ feedbackSummary, serviceOutputs }),
      recentPosts,
      accountContext: groundingContext.mergedContext,
      variantCount: safeNumber(config?.textVariantsPerRun, DEFAULT_CONFIG.textVariantsPerRun),
      allowTags: quickTest ? false : Boolean(config?.allowTagsMutation),
      allowCta: quickTest ? false : Boolean(config?.allowCtaMutation),
      excludeFingerprints: fingerprints,
    });

    const imageGeneration = allowImages
      ? await generateImageVariants({
          apiKey,
          userId,
          runId,
          accountHandle: resolved.accountHandle,
          feedbackSummary: JSON.stringify(serviceOutputs?.platformSignal || {}),
          textVariants: textGeneration.variants,
          accountContext: groundingContext.mergedContext,
          variantCount: safeNumber(config?.imageVariantsPerRun, DEFAULT_CONFIG.imageVariantsPerRun),
        })
      : {
          prompt: "",
          usage: null,
          variants: [],
        };

    const selection = selectGenerationWinner({
      textVariants: textGeneration.variants,
      imageVariants: imageGeneration.variants,
      recentPosts,
      candidateLimit: safeNumber(config?.candidateBundlesPerRun, DEFAULT_CONFIG.candidateBundlesPerRun),
      explorationRate: safeNumber(config?.explorationRate, DEFAULT_CONFIG.explorationRate),
      allowImages,
      allowTextOnly,
    });

    const persisted = await persistGenerationArtifacts({
      db,
      runId,
      userId,
      channelId: resolved.channelId,
      textGeneration,
      imageGeneration,
      selection,
      config: normalizedConfig,
    });

    const selectedTextDoc = persisted.textDocs.find(
      (doc) => doc.variantId === persisted.selectionDoc.selectedTextVariantId
    );
    const selectedImageDoc = persisted.imageDocs.find(
      (doc) => doc.variantId === persisted.selectionDoc.selectedImageVariantId
    );

    if (previewOnly) {
      const finishedAt = new Date();
      await runsColl.updateOne(
        { runId },
        {
          $set: {
            status: "completed",
            finishedAt,
            updatedAt: finishedAt,
            summary: {
              previewOnly: true,
              textVariants: persisted.textDocs.length,
              imageVariants: persisted.imageDocs.length,
              selectedMode: persisted.selectionDoc.selectedMode,
            },
          },
        }
      );

      return {
        ok: true,
        runId,
        previewOnly: true,
        accountHandle: resolved.accountHandle,
        contextSignals: {
          usedAccountContext: groundingContext.usedAccountContext,
          xContextLength: groundingContext.xContext.length,
        },
        textVariants: persisted.textDocs,
        imageVariants: persisted.imageDocs,
        selection: persisted.selectionDoc,
        feedbackSummary,
      };
    }

    const todayCount = await countTodaysPlannedPosts({
      db,
      userId,
      channelId: resolved.channelId,
    });

    const maxPostsPerDay = safeNumber(config?.maxPostsPerDay, DEFAULT_CONFIG.maxPostsPerDay);
    const requestedRunCount = quickTest
      ? Math.max(1, Math.min(persisted.textDocs.length, safeNumber(config?.textVariantsPerRun, DEFAULT_CONFIG.textVariantsPerRun)))
      : 1;
    const remainingToday = Math.max(0, maxPostsPerDay - todayCount);
    const plannedCount = Math.max(0, Math.min(requestedRunCount, remainingToday));

    if (plannedCount <= 0) {
      const finishedAt = new Date();
      await runsColl.updateOne(
        { runId },
        {
          $set: {
            status: "completed",
            finishedAt,
            updatedAt: finishedAt,
            summary: {
              skipped: true,
              reason: "daily_cap_reached",
              todayCount,
              maxPostsPerDay,
            },
          },
        }
      );

      return {
        ok: true,
        runId,
        skipped: true,
        reason: "daily_cap_reached",
        todayCount,
        maxPostsPerDay,
      };
    }

    const target = [
      {
        platform: "x",
        channelId: resolved.channelId,
        displayName: resolved.accountLabel,
        username: resolved.accountHandle,
      },
    ];

    const scheduledEntries = [];
    if (quickTest) {
      const queueDocs = persisted.textDocs.slice(0, plannedCount);
      const baseScheduledAt = await getNextQuickTestScheduleTime({
        db,
        userId,
        channelId: resolved.channelId,
        spacingMinutes: testSpacingMinutes,
      });

      for (let idx = 0; idx < queueDocs.length; idx += 1) {
        const textDoc = queueDocs[idx];
        const scheduledAt = new Date(baseScheduledAt.getTime() + idx * testSpacingMinutes * 60 * 1000);
        const uploadInfo = { source: "text_only_quick_test" };
        const caption = composeCaptionWithHashtags(textDoc || {});

        const contentPayload = {
          x_text: caption,
          x_media_ids: [],
          metadata: {
            source: "feedback-loop",
            runId,
            quickTest: true,
            testSpacingMinutes,
            maxPostsPerDay,
            queueIndex: idx + 1,
            queueTotal: queueDocs.length,
            selectedTextVariantId: textDoc?.variantId || null,
            selectedImageVariantId: null,
            uploadInfo: cloneForStorage(uploadInfo),
          },
        };

        const scheduleResult = await createScheduledPostsFromRequest(userId, {
          mode: "scheduled",
          targets: target,
          content: contentPayload,
          scheduledAt: scheduledAt.toISOString(),
        });

        const scheduledPostId = Array.isArray(scheduleResult?.insertedIds)
          ? String(scheduleResult.insertedIds[0] || "")
          : "";

        const feedbackPost = await createFeedbackLoopPost({
          db,
          runId,
          userId,
          channelId: resolved.channelId,
          scheduledPostId,
          selection: { selected: { mode: "text_only" } },
          textDoc,
          imageDoc: null,
          uploadInfo,
          scheduledAt,
        });

        await createTimeseriesTasks({
          db,
          runId,
          userId,
          channelId: resolved.channelId,
          feedbackPostId: String(feedbackPost._id),
          scheduledPostId,
          scheduledAt,
        });

        scheduledEntries.push({
          scheduledPostId,
          feedbackPostId: String(feedbackPost._id),
          scheduledAt: scheduledAt.toISOString(),
          selectedTextVariantId: textDoc?.variantId || null,
          selectedImageVariantId: null,
          mode: "text_only",
          mediaAttached: false,
          uploadInfo,
        });
      }
    } else {
      const caption = composeCaptionWithHashtags(selectedTextDoc || selection.selected?.textVariant || {});
      let uploadInfo = { source: "text_only" };
      let mediaId = null;
      if (selectedImageDoc && selectedImageDoc?.imageKey && allowImages) {
        const upload = await maybeUploadSelectedImage({
          account: resolved.account,
          selectedImageDoc,
        });
        mediaId = upload?.mediaId || null;
        uploadInfo = upload?.uploadInfo || { source: "unknown" };
      }

      const scheduledAt = selection?.scheduledAt ? new Date(selection.scheduledAt) : new Date(Date.now() + 15 * 60 * 1000);
      const contentPayload = {
        x_text: caption,
        x_media_ids: mediaId ? [mediaId] : [],
        metadata: {
          source: "feedback-loop",
          runId,
          quickTest: false,
          maxPostsPerDay,
          selectedTextVariantId: selectedTextDoc?.variantId || null,
          selectedImageVariantId: selectedImageDoc?.variantId || null,
          uploadInfo: cloneForStorage(uploadInfo),
        },
      };

      const scheduleResult = await createScheduledPostsFromRequest(userId, {
        mode: "scheduled",
        targets: target,
        content: contentPayload,
        scheduledAt: scheduledAt.toISOString(),
      });

      const scheduledPostId = Array.isArray(scheduleResult?.insertedIds)
        ? String(scheduleResult.insertedIds[0] || "")
        : "";

      const feedbackPost = await createFeedbackLoopPost({
        db,
        runId,
        userId,
        channelId: resolved.channelId,
        scheduledPostId,
        selection,
        textDoc: selectedTextDoc,
        imageDoc: selectedImageDoc,
        uploadInfo,
        scheduledAt,
      });

      await createTimeseriesTasks({
        db,
        runId,
        userId,
        channelId: resolved.channelId,
        feedbackPostId: String(feedbackPost._id),
        scheduledPostId,
        scheduledAt,
      });

      scheduledEntries.push({
        scheduledPostId,
        feedbackPostId: String(feedbackPost._id),
        scheduledAt: scheduledAt.toISOString(),
        selectedTextVariantId: selectedTextDoc?.variantId || null,
        selectedImageVariantId: selectedImageDoc?.variantId || null,
        mode: selection?.selected?.mode || "text_only",
        mediaAttached: Boolean(mediaId),
        mediaId: mediaId || null,
        uploadInfo,
      });
    }

    const primaryEntry = scheduledEntries[0] || null;

    const finishedAt = new Date();
    await runsColl.updateOne(
      { runId },
      {
        $set: {
          status: "completed",
          finishedAt,
          updatedAt: finishedAt,
          summary: {
            previewOnly: false,
            selectedMode: quickTest ? "text_only_batch_quick_test" : persisted.selectionDoc.selectedMode,
            scheduledCount: scheduledEntries.length,
            scheduledPostId: primaryEntry?.scheduledPostId || "",
            feedbackPostId: primaryEntry?.feedbackPostId || "",
            scheduledPostIds: scheduledEntries.map((item) => item.scheduledPostId),
            feedbackPostIds: scheduledEntries.map((item) => item.feedbackPostId),
            scheduledAt: primaryEntry?.scheduledAt ? new Date(primaryEntry.scheduledAt) : null,
            mediaAttached: Boolean(primaryEntry?.mediaAttached),
            mediaUploadSource: primaryEntry?.uploadInfo?.source || null,
            quickTest,
            testSpacingMinutes: quickTest ? testSpacingMinutes : null,
            plannedCount,
            requestedRunCount,
            todayCount,
          },
        },
      }
    );

    return {
      ok: true,
      runId,
      previewOnly: false,
      scheduledPostId: primaryEntry?.scheduledPostId || "",
      feedbackPostId: primaryEntry?.feedbackPostId || "",
      scheduledAt: primaryEntry?.scheduledAt || null,
      scheduledCount: scheduledEntries.length,
      scheduledPosts: scheduledEntries,
      accountHandle: resolved.accountHandle,
      quickTest,
      contextSignals: {
        usedAccountContext: groundingContext.usedAccountContext,
        xContextLength: groundingContext.xContext.length,
      },
      selection: persisted.selectionDoc,
      textVariants: persisted.textDocs,
      imageVariants: persisted.imageDocs,
    };
  } catch (err) {
    const finishedAt = new Date();
    await runsColl.updateOne(
      { runId },
      {
        $set: {
          status: "failed",
          finishedAt,
          updatedAt: finishedAt,
          error: {
            message: err instanceof Error ? err.message : String(err),
          },
        },
      }
    );
    throw err;
  } finally {
    runLocks.delete(lockKey);
  }
}

export async function getFeedbackGenerationHistory({ userId, channelId = "", limit = 20 }) {
  const db = await getDb();
  const resolved = await resolveXAccount({ db, userId, channelId });
  const selectionColl = db.collection(FEEDBACK_COLLECTIONS.GENERATION_SELECTION);
  const textColl = db.collection(FEEDBACK_COLLECTIONS.GENERATION_TEXT);
  const imageColl = db.collection(FEEDBACK_COLLECTIONS.GENERATION_IMAGE);
  const postsColl = db.collection(FEEDBACK_COLLECTIONS.POSTS);

  const rows = await selectionColl
    .find({ userId, channelId: resolved.channelId, platform: "x" })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(100, Number(limit) || 20)))
    .toArray();

  const runIds = rows.map((row) => row.runId).filter(Boolean);

  const [textDocs, imageDocs, posts] = await Promise.all([
    textColl.find({ runId: { $in: runIds } }).toArray(),
    imageColl.find({ runId: { $in: runIds } }).toArray(),
    postsColl.find({ runId: { $in: runIds } }).toArray(),
  ]);

  const textMap = new Map(textDocs.map((doc) => [doc.variantId, doc]));
  const imageMap = new Map(imageDocs.map((doc) => [doc.variantId, doc]));
  const textByRunMap = new Map();
  const imageByRunMap = new Map();
  for (const doc of textDocs) {
    if (!textByRunMap.has(doc.runId)) textByRunMap.set(doc.runId, []);
    textByRunMap.get(doc.runId).push(doc);
  }
  for (const doc of imageDocs) {
    if (!imageByRunMap.has(doc.runId)) imageByRunMap.set(doc.runId, []);
    imageByRunMap.get(doc.runId).push(doc);
  }
  const postMap = new Map(posts.map((doc) => [doc.runId, doc]));

  return rows.map((row) => {
    const selectedText = textMap.get(row.selectedTextVariantId) || null;
    const selectedImage = imageMap.get(row.selectedImageVariantId) || null;
    const textVariants = (textByRunMap.get(row.runId) || []).sort((a, b) => String(a.variantId).localeCompare(String(b.variantId)));
    const imageVariants = (imageByRunMap.get(row.runId) || []).sort((a, b) => String(a.variantId).localeCompare(String(b.variantId)));
    const post = postMap.get(row.runId) || null;

    return {
      runId: row.runId,
      createdAt: row.createdAt,
      selectedMode: row.selectedMode,
      selectedScore: row.selectedScore,
      policy: row.policy || {},
      selectedTextVariantId: row.selectedTextVariantId || null,
      selectedImageVariantId: row.selectedImageVariantId || null,
      candidateCount: safeNumber(row?.candidateCount),
      candidates: cloneForStorage(row?.candidates || []),
      textVariants: textVariants.map((variant) => ({
        variantId: variant.variantId,
        caption: variant.caption,
        hookStyle: variant.hookStyle,
        tone: variant.tone,
        ctaType: variant.ctaType,
        hashtags: Array.isArray(variant?.hashtags) ? variant.hashtags : [],
        reasoning: variant.reasoning || "",
        fallback: Boolean(variant?.fallback),
      })),
      imageVariants: imageVariants.map((variant) => ({
        variantId: variant.variantId,
        imagePrompt: variant.imagePrompt,
        visualStyle: variant.visualStyle,
        composition: variant.composition,
        reasoning: variant.reasoning || "",
        imageKey: variant.imageKey || "",
        imageUrl: variant.imageUrl || "",
        fallback: Boolean(variant?.fallback),
      })),
      selectedText: selectedText
        ? {
            variantId: selectedText.variantId,
            caption: selectedText.caption,
            hookStyle: selectedText.hookStyle,
            tone: selectedText.tone,
            ctaType: selectedText.ctaType,
            hashtags: selectedText.hashtags || [],
          }
        : null,
      selectedImage: selectedImage
        ? {
            variantId: selectedImage.variantId,
            imagePrompt: selectedImage.imagePrompt,
            imageKey: selectedImage.imageKey,
            imageUrl: selectedImage.imageUrl || "",
          }
        : null,
      performance: {
        feedbackPostId: post ? String(post._id) : null,
        status: post?.status || null,
        scheduledAt: post?.scheduledAt || null,
        postedAt: post?.postedAt || null,
        metrics: post?.metrics || null,
      },
    };
  });
}

async function syncFeedbackPostsWithScheduledState({ db, userId, channelId, limit = 120 }) {
  const postsColl = db.collection(FEEDBACK_COLLECTIONS.POSTS);
  const scheduledColl = db.collection("ScheduledPosts");
  const feedbackPosts = await postsColl
    .find({
      userId,
      channelId,
      platform: "x",
      status: { $in: ["scheduled", "processing", "pending"] },
    })
    .sort({ updatedAt: -1 })
    .limit(Math.max(1, Math.min(500, Number(limit) || 120)))
    .toArray();

  if (!feedbackPosts.length) return { scanned: 0, updated: 0 };

  const scheduledIds = feedbackPosts
    .map((post) => toObjectId(post?.scheduledPostId))
    .filter(Boolean);
  if (!scheduledIds.length) return { scanned: feedbackPosts.length, updated: 0 };

  const scheduledDocs = await scheduledColl.find({ _id: { $in: scheduledIds } }).toArray();
  const scheduledById = new Map(scheduledDocs.map((doc) => [String(doc._id), doc]));

  let updated = 0;
  for (const post of feedbackPosts) {
    const scheduled = scheduledById.get(String(post?.scheduledPostId || ""));
    if (!scheduled) continue;
    const next = await syncFeedbackPostFromScheduledPost({ db, feedbackPost: post, scheduledPost: scheduled });
    if (String(next?.status || "") !== String(post?.status || "")) {
      updated += 1;
    }
  }

  return { scanned: feedbackPosts.length, updated };
}

export async function getFeedbackLoopDashboard({ userId, channelId = "" }) {
  const db = await getDb();
  const resolved = await resolveXAccount({ db, userId, channelId });
  const config = await getFeedbackLoopConfig({ userId, channelId: resolved.channelId });
  await syncFeedbackPostsWithScheduledState({
    db,
    userId,
    channelId: resolved.channelId,
    limit: 160,
  });

  const [latestRun, recentRuns, recentPosts, taskSummary, generationHistory] = await Promise.all([
    db.collection(FEEDBACK_COLLECTIONS.RUNS).findOne({ userId, channelId: resolved.channelId }, { sort: { createdAt: -1 } }),
    db
      .collection(FEEDBACK_COLLECTIONS.RUNS)
      .find({ userId, channelId: resolved.channelId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray(),
    db
      .collection(FEEDBACK_COLLECTIONS.POSTS)
      .find({ userId, channelId: resolved.channelId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray(),
    db
      .collection(FEEDBACK_COLLECTIONS.TASKS)
      .aggregate([
        { $match: { userId, channelId: resolved.channelId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
      .toArray(),
    getFeedbackGenerationHistory({ userId, channelId: resolved.channelId, limit: 8 }),
  ]);

  const taskCounts = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  };

  for (const row of taskSummary) {
    const key = normalizeText(row?._id || "").toLowerCase();
    if (Object.prototype.hasOwnProperty.call(taskCounts, key)) {
      taskCounts[key] = safeNumber(row?.count);
    }
  }

  const postedCount = recentPosts.filter((item) => item?.status === "posted").length;
  const pendingCount = recentPosts.filter((item) => item?.status === "scheduled").length;
  const avgEngagementRate = recentPosts.length
    ? Number(
        (
          recentPosts.reduce((sum, row) => sum + safeNumber(row?.metrics?.engagementRate), 0) /
          recentPosts.length
        ).toFixed(4)
      )
    : 0;

  return {
    ok: true,
    context: {
      userId,
      platform: "x",
      channelId: resolved.channelId,
      channelLabel: resolved.accountLabel,
      channelHandle: resolved.accountHandle,
      usedAccountContext: Boolean(latestRun?.contextSignals?.usedAccountContext),
      xContextLength: safeNumber(latestRun?.contextSignals?.xContextLength),
    },
    config,
    latestRun,
    recentRuns,
    posts: recentPosts,
    taskCounts,
    kpis: {
      postedCount,
      pendingCount,
      avgEngagementRate,
      generationHistoryCount: generationHistory.length,
    },
    generationHistory,
  };
}

export async function listFeedbackLoopRuns({ userId, channelId = "", limit = 50 }) {
  const db = await getDb();
  const resolved = await resolveXAccount({ db, userId, channelId });
  return db
    .collection(FEEDBACK_COLLECTIONS.RUNS)
    .find({ userId, channelId: resolved.channelId })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(200, Number(limit) || 50)))
    .toArray();
}

export async function listFeedbackLoopTasks({ userId, channelId = "", limit = 100 }) {
  const db = await getDb();
  const resolved = await resolveXAccount({ db, userId, channelId });
  return db
    .collection(FEEDBACK_COLLECTIONS.TASKS)
    .find({ userId, channelId: resolved.channelId })
    .sort({ scheduledFor: -1 })
    .limit(Math.max(1, Math.min(300, Number(limit) || 100)))
    .toArray();
}

export async function listFeedbackLoopPosts({ userId, channelId = "", limit = 100 }) {
  const db = await getDb();
  const resolved = await resolveXAccount({ db, userId, channelId });
  await syncFeedbackPostsWithScheduledState({
    db,
    userId,
    channelId: resolved.channelId,
    limit: Math.max(80, Number(limit) || 100),
  });
  return db
    .collection(FEEDBACK_COLLECTIONS.POSTS)
    .find({ userId, channelId: resolved.channelId })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(300, Number(limit) || 100)))
    .toArray();
}

export async function setFeedbackLoopStatus({ userId, channelId = "", enabled, status }) {
  return updateFeedbackLoopConfig({
    userId,
    channelId,
    patch: {
      enabled: Boolean(enabled),
      status: normalizeText(status || (enabled ? "running" : "paused")) || (enabled ? "running" : "paused"),
    },
  });
}

async function syncFeedbackPostFromScheduledPost({ db, feedbackPost, scheduledPost }) {
  if (!feedbackPost || !scheduledPost) return feedbackPost;

  const postsColl = db.collection(FEEDBACK_COLLECTIONS.POSTS);
  const patch = {
    updatedAt: new Date(),
  };

  if (scheduledPost?.platformPostId && !feedbackPost?.platformPostId) {
    patch.platformPostId = String(scheduledPost.platformPostId);
  }
  if (scheduledPost?.status === "posted") {
    patch.status = "posted";
    patch.postedAt = scheduledPost?.executedAt || new Date();
  } else if (["failed", "cancelled"].includes(String(scheduledPost?.status || ""))) {
    patch.status = String(scheduledPost.status);
  }

  if (Object.keys(patch).length > 1) {
    await postsColl.updateOne({ _id: feedbackPost._id }, { $set: patch });
    return { ...feedbackPost, ...patch };
  }

  return feedbackPost;
}

async function processTimeseriesTask({ db, task }) {
  const postsColl = db.collection(FEEDBACK_COLLECTIONS.POSTS);
  const tasksColl = db.collection(FEEDBACK_COLLECTIONS.TASKS);
  const scheduledColl = db.collection("ScheduledPosts");
  const timeseriesColl = db.collection(FEEDBACK_COLLECTIONS.TIMESERIES);

  const feedbackPostId = toObjectId(task?.payload?.feedbackPostId);
  const scheduledPostId = toObjectId(task?.payload?.scheduledPostId);
  if (!feedbackPostId) {
    throw new Error("Task missing valid feedbackPostId");
  }

  let feedbackPost = await postsColl.findOne({ _id: feedbackPostId });
  if (!feedbackPost) {
    throw new Error("FeedbackLoopPost not found");
  }

  const scheduledPost = scheduledPostId ? await scheduledColl.findOne({ _id: scheduledPostId }) : null;
  feedbackPost = await syncFeedbackPostFromScheduledPost({ db, feedbackPost, scheduledPost });

  const account = await db.collection("SocialAccounts").findOne({
    userId: task.userId,
    platform: "x",
    platformUserId: task.channelId,
  });

  if (!account?.accessToken) {
    throw new Error("Connected X account/access token missing for metrics collection");
  }

  if (!feedbackPost?.platformPostId) {
    const attempts = safeNumber(task?.attempts);
    if (attempts >= 20) {
      await tasksColl.updateOne(
        { _id: task._id },
        {
          $set: {
            status: "failed",
            error: {
              message: "platformPostId still unavailable after retries",
            },
            updatedAt: new Date(),
          },
        }
      );
      return;
    }

    await tasksColl.updateOne(
      { _id: task._id },
      {
        $set: {
          status: "pending",
          scheduledFor: new Date(Date.now() + 10 * 60 * 1000),
          updatedAt: new Date(),
        },
        $inc: { attempts: 1 },
      }
    );
    return;
  }

  const metricResponse = await fetchTweetMetricsById({
    accessToken: account.accessToken,
    postId: feedbackPost.platformPostId,
  });

  const now = new Date();
  const snapshotDoc = {
    runId: task.runId,
    userId: task.userId,
    platform: "x",
    channelId: task.channelId,
    feedbackPostId: String(feedbackPost._id),
    scheduledPostId: String(task?.payload?.scheduledPostId || ""),
    platformPostId: String(feedbackPost.platformPostId || ""),
    type: "checkpoint",
    checkpoint: String(task?.checkpoint || task?.payload?.checkpoint || "unknown"),
    status: metricResponse?.status || "unknown",
    metrics: metricResponse?.metrics || {
      likes: 0,
      replies: 0,
      reposts: 0,
      quotes: 0,
      bookmarks: 0,
      impressions: 0,
      engagementTotal: 0,
      engagementRate: 0,
    },
    raw: cloneForStorage(metricResponse?.raw || null),
    createdAt: now,
    updatedAt: now,
  };

  await timeseriesColl.updateOne(
    {
      feedbackPostId: snapshotDoc.feedbackPostId,
      checkpoint: snapshotDoc.checkpoint,
      type: "checkpoint",
    },
    {
      $set: snapshotDoc,
      $setOnInsert: {
        firstSeenAt: now,
      },
    },
    { upsert: true }
  );

  await postsColl.updateOne(
    { _id: feedbackPost._id },
    {
      $set: {
        metrics: snapshotDoc.metrics,
        updatedAt: now,
      },
    }
  );

  await db.collection(FEEDBACK_COLLECTIONS.PUBLISHED_POST).updateOne(
    {
      feedbackPostId: String(feedbackPost._id),
      type: "post_level",
    },
    {
      $set: {
        runId: task.runId,
        userId: task.userId,
        platform: "x",
        channelId: task.channelId,
        feedbackPostId: String(feedbackPost._id),
        platformPostId: String(feedbackPost.platformPostId || ""),
        metrics: snapshotDoc.metrics,
        updatedAt: now,
        type: "post_level",
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  await tasksColl.updateOne(
    { _id: task._id },
    {
      $set: {
        status: "completed",
        completedAt: now,
        updatedAt: now,
      },
    }
  );
}

export async function runDueFeedbackTasks(limit = 40) {
  const db = await getDb();
  const tasksColl = db.collection(FEEDBACK_COLLECTIONS.TASKS);
  const now = new Date();

  const tasks = await tasksColl
    .find({
      status: "pending",
      scheduledFor: { $lte: now },
    })
    .sort({ scheduledFor: 1 })
    .limit(Math.max(1, Math.min(200, Number(limit) || 40)))
    .toArray();

  let processed = 0;
  let failed = 0;

  for (const task of tasks) {
    const lock = await tasksColl.findOneAndUpdate(
      { _id: task._id, status: "pending" },
      {
        $set: {
          status: "processing",
          startedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    const lockedTask = lock?.value || lock;
    if (!lockedTask) continue;

    try {
      if (lockedTask.type === "timeseries_checkpoint") {
        await processTimeseriesTask({ db, task: lockedTask });
      } else {
        await tasksColl.updateOne(
          { _id: task._id },
          {
            $set: {
              status: "cancelled",
              error: { message: `Unsupported task type: ${task.type}` },
              updatedAt: new Date(),
            },
          }
        );
      }
      processed += 1;
    } catch (err) {
      failed += 1;
      const attempts = safeNumber(task?.attempts) + 1;
      await tasksColl.updateOne(
        { _id: task._id },
        {
          $set: {
            status: attempts >= 6 ? "failed" : "pending",
            scheduledFor: attempts >= 6 ? task?.scheduledFor || now : new Date(Date.now() + attempts * 2 * 60 * 1000),
            error: {
              message: err instanceof Error ? err.message : String(err),
            },
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: task?.createdAt || new Date(),
          },
          $inc: {
            attempts: 1,
          },
        }
      );
    }
  }

  return { processed, failed, scanned: tasks.length };
}

export async function runAutonomousFeedbackLoop(limit = 5) {
  const db = await getDb();
  const configColl = db.collection(FEEDBACK_COLLECTIONS.CONFIG);

  const configs = await configColl
    .find({
      platform: "x",
      enabled: true,
      status: "running",
      autonomousMode: true,
    })
    .sort({ updatedAt: 1 })
    .limit(Math.max(1, Math.min(50, Number(limit) || 5)))
    .toArray();

  let triggered = 0;
  let skipped = 0;

  for (const config of configs) {
    const checkedAt = new Date();
    const lockKey = `${config.userId}:x:${config.channelId}`;
    if (runLocks.has(lockKey)) {
      await configColl.updateOne(
        { _id: config._id },
        {
          $set: {
            lastAutoCheckAt: checkedAt,
            lastAutoDecision: "skipped_in_progress",
            lastAutoError: null,
          },
        }
      );
      skipped += 1;
      continue;
    }

    const todayCount = await countTodaysPlannedPosts({
      db,
      userId: config.userId,
      channelId: config.channelId,
    });

    if (todayCount >= safeNumber(config?.maxPostsPerDay, DEFAULT_CONFIG.maxPostsPerDay)) {
      await configColl.updateOne(
        { _id: config._id },
        {
          $set: {
            lastAutoCheckAt: checkedAt,
            lastAutoDecision: "skipped_daily_cap",
            lastAutoTodayCount: todayCount,
            lastAutoError: null,
          },
        }
      );
      skipped += 1;
      continue;
    }

    const lastAutoRunAt = config?.lastAutoRunAt ? new Date(config.lastAutoRunAt) : null;
    if (lastAutoRunAt && !Number.isNaN(lastAutoRunAt.getTime())) {
      const minGapMs = safeNumber(config?.minGapMinutes, DEFAULT_CONFIG.minGapMinutes) * 60 * 1000;
      if (Date.now() - lastAutoRunAt.getTime() < minGapMs) {
        await configColl.updateOne(
          { _id: config._id },
          {
            $set: {
              lastAutoCheckAt: checkedAt,
              lastAutoDecision: "skipped_min_gap",
              nextAutoEligibleAt: new Date(lastAutoRunAt.getTime() + minGapMs),
              lastAutoError: null,
            },
          }
        );
        skipped += 1;
        continue;
      }
    }

    try {
      const result = await triggerFeedbackLoopRun({
        userId: config.userId,
        channelId: config.channelId,
        previewOnly: false,
        triggerSource: "auto_tick",
      });

      await configColl.updateOne(
        { _id: config._id },
        {
          $set: {
            lastAutoCheckAt: checkedAt,
            lastAutoRunAt: new Date(),
            lastAutoDecision: "triggered",
            lastAutoTriggeredRunId: String(result?.runId || ""),
            lastAutoError: null,
          },
        }
      );
      triggered += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await configColl.updateOne(
        { _id: config._id },
        {
          $set: {
            lastAutoCheckAt: checkedAt,
            lastAutoDecision: "failed",
            lastAutoError: message,
          },
        }
      );
      skipped += 1;
    }
  }

  return { scanned: configs.length, triggered, skipped };
}

export function startFeedbackLoopWorkers() {
  if (workersStarted) return;
  workersStarted = true;

  const loopEnabled = String(process.env.FEEDBACK_LOOP_ENABLED || "true").toLowerCase() !== "false";
  const loopIntervalMs = Math.max(30_000, Number(process.env.FEEDBACK_LOOP_INTERVAL_MS) || 5 * 60_000);
  const taskIntervalMs = Math.max(15_000, Number(process.env.FEEDBACK_LOOP_TASK_INTERVAL_MS) || 60_000);

  if (!loopEnabled) {
    console.log("[feedback-loop] workers disabled via FEEDBACK_LOOP_ENABLED=false");
    return;
  }

  let loopInFlight = false;
  const loopTimer = setInterval(async () => {
    if (loopInFlight) return;
    loopInFlight = true;
    try {
      const result = await runAutonomousFeedbackLoop(8);
      if (safeNumber(result?.triggered) > 0) {
        console.log(`[feedback-loop] autonomous runs triggered: ${result.triggered}`);
      }
    } catch (err) {
      console.error("[feedback-loop] autonomous tick failed:", err);
    } finally {
      loopInFlight = false;
    }
  }, loopIntervalMs);

  let taskInFlight = false;
  const taskTimer = setInterval(async () => {
    if (taskInFlight) return;
    taskInFlight = true;
    try {
      const result = await runDueFeedbackTasks(40);
      if (safeNumber(result?.processed) > 0 || safeNumber(result?.failed) > 0) {
        console.log(`[feedback-loop] task tick processed=${result.processed} failed=${result.failed}`);
      }
    } catch (err) {
      console.error("[feedback-loop] task tick failed:", err);
    } finally {
      taskInFlight = false;
    }
  }, taskIntervalMs);

  if (typeof loopTimer.unref === "function") loopTimer.unref();
  if (typeof taskTimer.unref === "function") taskTimer.unref();

  console.log(`[feedback-loop] started (autonomous=${loopIntervalMs}ms, tasks=${taskIntervalMs}ms)`);
}
