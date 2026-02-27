import { safeNumber } from "../lib/utils.js";

function sampleHistoricalSignal(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return { avgEngagementRate: 0, bestHour: null };

  const avgEngagementRate =
    list.reduce((sum, row) => sum + safeNumber(row?.engagementRate || row?.metrics?.engagementRate), 0) /
    Math.max(1, list.length);

  const hourBuckets = new Map();
  for (const row of list) {
    const d = new Date(row?.scheduledAt || row?.createdAt || 0);
    if (Number.isNaN(d.getTime())) continue;
    const hour = d.getUTCHours();
    const current = hourBuckets.get(hour) || { total: 0, count: 0 };
    current.total += safeNumber(row?.engagementRate || row?.metrics?.engagementRate);
    current.count += 1;
    hourBuckets.set(hour, current);
  }

  let bestHour = null;
  let bestHourScore = -1;
  for (const [hour, bucket] of hourBuckets.entries()) {
    const score = bucket.total / Math.max(1, bucket.count);
    if (score > bestHourScore) {
      bestHourScore = score;
      bestHour = hour;
    }
  }

  return {
    avgEngagementRate: Number(avgEngagementRate.toFixed(4)),
    bestHour,
  };
}

function scoreTextVariant(variant, historicalSignal) {
  const base = 45;
  const ctaBonus = variant?.ctaType && variant.ctaType !== "none" ? 8 : 0;
  const hashtagBonus = Math.min(6, (Array.isArray(variant?.hashtags) ? variant.hashtags.length : 0) * 1.5);
  const hookBonus = ["question", "data-point"].includes(String(variant?.hookStyle || "")) ? 5 : 3;
  const historicalBonus = Math.min(10, safeNumber(historicalSignal?.avgEngagementRate) * 2);
  return base + ctaBonus + hashtagBonus + hookBonus + historicalBonus;
}

function scoreImageVariant(variant) {
  if (!variant || !variant.imageKey) return 0;
  const styleBonus = /contrast|clean|minimal|modern/i.test(String(variant?.visualStyle || "")) ? 6 : 3;
  return 20 + styleBonus;
}

function choosePostTime({ bestHourUtc = null }) {
  const now = new Date();
  const suggestedHour = Number.isInteger(bestHourUtc) ? bestHourUtc : (now.getUTCHours() + 1) % 24;
  const scheduled = new Date(now);
  scheduled.setUTCMinutes(15, 0, 0);
  scheduled.setUTCHours(suggestedHour);
  if (scheduled.getTime() <= now.getTime() + 5 * 60 * 1000) {
    scheduled.setUTCDate(scheduled.getUTCDate() + 1);
  }
  return scheduled;
}

export function selectGenerationWinner({
  textVariants,
  imageVariants,
  recentPosts,
  candidateLimit = 4,
  explorationRate = 0.3,
  allowImages = true,
  allowTextOnly = true,
}) {
  const text = Array.isArray(textVariants) ? textVariants : [];
  const images = Array.isArray(imageVariants) ? imageVariants : [];

  const historicalSignal = sampleHistoricalSignal(recentPosts);

  const bundles = [];
  for (const textVariant of text.slice(0, candidateLimit)) {
    const textScore = scoreTextVariant(textVariant, historicalSignal);
    if (allowTextOnly) {
      bundles.push({
        mode: "text_only",
        textVariant,
        imageVariant: null,
        score: textScore,
      });
    }
    if (allowImages) {
      for (const imageVariant of images.slice(0, Math.max(1, Math.ceil(candidateLimit / 2)))) {
        bundles.push({
          mode: "text_image",
          textVariant,
          imageVariant,
          score: textScore + scoreImageVariant(imageVariant),
        });
      }
    }
  }

  const unique = bundles
    .sort((a, b) => safeNumber(b?.score) - safeNumber(a?.score))
    .slice(0, Math.max(1, candidateLimit));

  if (!unique.length) {
    throw new Error("No candidate bundles available for selection");
  }

  const exploit = Math.random() >= explorationRate;
  const selected = exploit ? unique[0] : unique[Math.floor(Math.random() * unique.length)];
  const fallback = unique[0] === selected ? unique[1] || null : unique[0];

  const scheduledAt = choosePostTime({ bestHourUtc: historicalSignal?.bestHour });

  return {
    candidates: unique,
    selected,
    fallback,
    policy: {
      exploit,
      explorationRate,
      bestHourUtc: historicalSignal?.bestHour,
      historicalAvgEngagementRate: historicalSignal?.avgEngagementRate,
    },
    scheduledAt,
  };
}
