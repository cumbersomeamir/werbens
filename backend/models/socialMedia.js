/**
 * Social media analytics model - data structure definitions
 */

export const SocialMediaSchema = {
  userId: String,
  username: String,
  platform: String,
  channelId: String,
  profile: Object,
  posts: Array,
  videos: Array,
  boards: Array,
  pins: Array,
  media: Array,
  insights: Object,
  lastFetchedAt: Date,
  updatedAt: Date,
};
