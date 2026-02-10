/**
 * YouTube Analytics model - structured storage of per-channel analytics
 * sourced from the YouTube Analytics API.
 *
 * This is supplemental to SocialMedia, which already stores profile and videos.
 */

export const YouTubeAnalyticsSchema = {
  userId: String,
  channelId: String,
  username: String,
  profileTitle: String,
  analytics: Object, // { channelDaily, topVideos, trafficSources, geography, devices }
  lastFetchedAt: Date,
  updatedAt: Date,
};

