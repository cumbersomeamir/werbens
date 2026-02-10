/**
 * ScheduledPost model - represents a single unit of content to be published
 * to a specific platform + channel/account at (or around) a given time.
 *
 * This is intentionally generic so multiple platforms can share the same
 * scheduling + execution infrastructure.
 */

export const ScheduledPostSchema = {
  userId: String,
  platform: String, // "youtube", "facebook", "instagram", "x", "linkedin", "pinterest"
  channelId: String, // platform-specific channel/page/account id

  mode: String, // "immediate" | "scheduled" | "automatic"
  status: String, // "pending" | "processing" | "posted" | "failed" | "cancelled"

  // Normalized content; per-platform adapters can interpret this structure
  content: {
    title: String,
    body: String,
    hashtags: Array,
    videoAssetId: String, // storage key / URL; actual upload handled elsewhere
    thumbnailAssetId: String,
    metadata: Object, // platform-specific extras (e.g. youtube tags/category)
  },

  scheduledAt: Date,
  executedAt: Date,

  // Optional reference back to the automatic rule that created this post
  ruleId: String,

  // Execution info
  platformPostId: String,
  error: Object,

  createdAt: Date,
  updatedAt: Date,
};

