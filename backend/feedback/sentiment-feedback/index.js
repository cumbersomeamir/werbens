export function buildSentimentFeedback({ recentPosts }) {
  const rows = Array.isArray(recentPosts) ? recentPosts : [];
  return {
    status: rows.length ? "partial" : "insufficient_data",
    sentimentSummary: {
      positivePct: null,
      neutralPct: null,
      negativePct: null,
      questionIntentPct: null,
      note: "Reply/comment-level sentiment requires additional reply fetch scope; placeholder persisted for loop compatibility.",
    },
  };
}
