import crypto from "crypto";

export const FEEDBACK_COLLECTIONS = Object.freeze({
  CONFIG: "FeedbackLoopConfig",
  RUNS: "FeedbackLoopRun",
  TASKS: "FeedbackLoopTask",
  POSTS: "FeedbackLoopPost",
  GENERATION_TEXT: "FeedbackGenerationText",
  GENERATION_IMAGE: "FeedbackGenerationImage",
  GENERATION_SELECTION: "FeedbackGenerationSelection",
  GEMINI_POST: "FeedbackGeminiPost",
  PUBLISHED_POST: "FeedbackPublishedPost",
  TIMESERIES: "FeedbackTimeseriesService",
  AUDIENCE: "FeedbackAudience",
  CONTENT_COMPARISON: "FeedbackContentComparison",
  SENTIMENT: "FeedbackSentiment",
  COMPETITOR: "FeedbackCompetitorBenchmark",
  RETENTION: "FeedbackRetention",
  CROSS_POST: "FeedbackCrossPostCorrelation",
  PLATFORM_SIGNAL: "FeedbackPlatformSignal",
});

export const TIMESERIES_CHECKPOINTS = Object.freeze([
  { key: "5m", delayMs: 5 * 60 * 1000 },
  { key: "10m", delayMs: 10 * 60 * 1000 },
  { key: "30m", delayMs: 30 * 60 * 1000 },
  { key: "1h", delayMs: 60 * 60 * 1000 },
  { key: "4h", delayMs: 4 * 60 * 60 * 1000 },
  { key: "12h", delayMs: 12 * 60 * 60 * 1000 },
  { key: "24h", delayMs: 24 * 60 * 60 * 1000 },
  { key: "48h", delayMs: 48 * 60 * 60 * 1000 },
]);

export const DEFAULT_CONFIG = Object.freeze({
  enabled: false,
  status: "paused",
  autonomousMode: true,
  maxPostsPerDay: 4,
  minGapMinutes: 180,
  textVariantsPerRun: 4,
  imageVariantsPerRun: 2,
  candidateBundlesPerRun: 4,
  explorationRate: 0.3,
  allowImages: true,
  allowTextOnly: true,
  allowPromptMutation: true,
  allowCaptionMutation: true,
  allowTagsMutation: true,
  allowCtaMutation: true,
  allowFrequencyMutation: true,
  competitorMode: "api_first_scrape_fallback",
  competitorSeedMode: "auto_discover_only",
});

export function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeText(value) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateText(value, maxLength = 280) {
  const text = normalizeText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

export function buildRunId() {
  return crypto.randomUUID();
}

export function nowUtcIso() {
  return new Date().toISOString();
}

export function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function hashFingerprint(input) {
  return crypto.createHash("sha256").update(String(input || "")).digest("hex");
}

export function cloneForStorage(value) {
  if (value == null) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

export function startsOfDayUtc(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function getTodayRangeUtc(date = new Date()) {
  const start = startsOfDayUtc(date);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function parseJsonArrayFromText(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];

  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = codeBlock ? codeBlock[1].trim() : raw;

  const firstBracket = candidate.indexOf("[");
  const lastBracket = candidate.lastIndexOf("]");
  const jsonSlice =
    firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket
      ? candidate.slice(firstBracket, lastBracket + 1)
      : candidate;

  return jsonSlice;
}

export function sanitizeHashtags(value) {
  const list = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/[\s,]+/)
        .map((item) => item.trim())
        .filter(Boolean);

  return Array.from(
    new Set(
      list
        .map((tag) => tag.replace(/^#/, "").replace(/[^a-zA-Z0-9_]/g, ""))
        .filter((tag) => tag.length > 1)
        .slice(0, 8)
    )
  );
}

export function extractMetricBundle(tweet) {
  const publicMetrics = tweet?.public_metrics || {};
  const nonPublic = tweet?.non_public_metrics || tweet?.organic_metrics || {};

  const likes = safeNumber(publicMetrics.like_count);
  const replies = safeNumber(publicMetrics.reply_count);
  const reposts = safeNumber(publicMetrics.retweet_count) + safeNumber(publicMetrics.repost_count);
  const quotes = safeNumber(publicMetrics.quote_count);
  const bookmarks = safeNumber(nonPublic.bookmark_count);
  const impressions = safeNumber(nonPublic.impression_count);
  const engagementTotal = likes + replies + reposts + quotes + bookmarks;

  return {
    likes,
    replies,
    reposts,
    quotes,
    bookmarks,
    impressions,
    engagementTotal,
    engagementRate: impressions > 0 ? Number(((engagementTotal / impressions) * 100).toFixed(4)) : 0,
  };
}
