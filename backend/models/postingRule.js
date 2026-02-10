/**
 * PostingRule model - configuration for automatic / recurring posting.
 *
 * A rule specifies how often to post, on which platforms + channels, and
 * how to source content (manual queue, AI-generated, etc.).
 */

export const PostingRuleSchema = {
  userId: String,
  name: String,

  platforms: Array, // [{ platform: "youtube", channelId: "..." }, ...]

  frequency: {
    type: String, // "per_day" | "per_week" | "per_month"
    count: Number, // e.g. 3 posts per_week
  },

  daysOfWeek: Array, // [0-6] (Sunday=0)
  timeWindows: Array, // [{ start: "09:00", end: "11:00" }, ...] in user local time

  contentSource: {
    type: String, // "manual_queue" | "ai_generated" | "mixed"
    params: Object,
  },

  safety: {
    maxPostsPerDayPerPlatform: Number,
    minIntervalMinutes: Number,
  },

  isActive: Boolean,
  nextRunAt: Date,

  createdAt: Date,
  updatedAt: Date,
};

