export function buildAudienceFeedback({ recentPosts }) {
  const rows = Array.isArray(recentPosts) ? recentPosts : [];
  return {
    status: rows.length ? "partial" : "insufficient_data",
    followerVsNonFollower: {
      followerPct: null,
      nonFollowerPct: null,
      note: "X API follower-vs-non-follower split unavailable in current scope; storing placeholder for future expanded access.",
    },
    profileTypeSignals: {
      creator: null,
      brand: null,
      unknown: null,
    },
    sampleSize: rows.length,
  };
}
