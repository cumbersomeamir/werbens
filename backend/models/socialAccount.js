/**
 * Social account model - data structure definitions
 */

export const SocialAccountSchema = {
  userId: String,
  platform: String,
  username: String,
  displayName: String,
  profileImageUrl: String,
  connectedAt: Date,
  updatedAt: Date,
  channels: Array,
};
