import { safeNumber } from "../lib/utils.js";

export function buildPlatformSignalFeedback({ recentPosts }) {
  const rows = Array.isArray(recentPosts) ? recentPosts : [];

  if (!rows.length) {
    return {
      status: "insufficient_data",
      shareToLikeRatio: 0,
      replyToLikeRatio: 0,
      avgBookmarks: 0,
      signalScore: 0,
    };
  }

  const aggregate = rows.reduce(
    (acc, row) => {
      acc.likes += safeNumber(row?.metrics?.likes);
      acc.replies += safeNumber(row?.metrics?.replies);
      acc.reposts += safeNumber(row?.metrics?.reposts);
      acc.bookmarks += safeNumber(row?.metrics?.bookmarks);
      return acc;
    },
    { likes: 0, replies: 0, reposts: 0, bookmarks: 0 }
  );

  const likes = Math.max(1, aggregate.likes);
  const shareToLikeRatio = Number((aggregate.reposts / likes).toFixed(4));
  const replyToLikeRatio = Number((aggregate.replies / likes).toFixed(4));
  const avgBookmarks = Number((aggregate.bookmarks / rows.length).toFixed(2));
  const signalScore = Number((shareToLikeRatio * 40 + replyToLikeRatio * 35 + avgBookmarks * 2).toFixed(2));

  return {
    status: "ok",
    shareToLikeRatio,
    replyToLikeRatio,
    avgBookmarks,
    signalScore,
    sampleSize: rows.length,
  };
}
