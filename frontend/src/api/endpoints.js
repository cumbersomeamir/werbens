/**
 * API endpoint constants
 */
export const API_ENDPOINTS = {
  // Health
  HEALTH: "/api/health",

  // Onboarding
  ONBOARDING: "/api/onboarding",

  // Chat & Image Generation
  CHAT: "/api/chat",
  GENERATE_IMAGE: "/api/generate-image",
  MODEL_SWITCHER_CLASSIFY: "/api/model-switcher/classify",

  // Sessions
  SESSIONS_GET_OR_CREATE: "/api/sessions/get-or-create",
  SESSIONS_CLEAR: "/api/sessions/clear",
  SESSIONS_MESSAGES: (sessionId) => `/api/sessions/${sessionId}/messages`,

  // Context
  CONTEXT: "/api/context",
  CONTEXT_UPDATE: "/api/context/update",

  // Social Accounts
  SOCIAL_ACCOUNTS: "/api/social/accounts",
  SOCIAL_ACCOUNT_DISCONNECT: (platform) => `/api/social/accounts/${platform}`,
  SOCIAL_ANALYTICS: "/api/social/analytics",

  // Social OAuth URLs
  SOCIAL_X_AUTH_URL: "/api/social/x/auth-url",
  SOCIAL_YOUTUBE_AUTH_URL: "/api/social/youtube/auth-url",
  SOCIAL_LINKEDIN_AUTH_URL: "/api/social/linkedin/auth-url",
  SOCIAL_PINTEREST_AUTH_URL: "/api/social/pinterest/auth-url",
  SOCIAL_META_AUTH_URL: "/api/social/meta/auth-url",
  SOCIAL_INSTAGRAM_AUTH_URL: "/api/social/instagram/auth-url",

  // Social OAuth Callbacks
  SOCIAL_X_CALLBACK: "/api/social/x/callback",
  SOCIAL_YOUTUBE_CALLBACK: "/api/social/youtube/callback",
  SOCIAL_LINKEDIN_CALLBACK: "/api/social/linkedin/callback",
  SOCIAL_PINTEREST_CALLBACK: "/api/social/pinterest/callback",
  SOCIAL_META_CALLBACK: "/api/social/meta/callback",
  SOCIAL_INSTAGRAM_CALLBACK: "/api/social/instagram/callback",

  // Social Sync
  SOCIAL_X_SYNC: "/api/social/x/sync",
  SOCIAL_YOUTUBE_SYNC: "/api/social/youtube/sync",
  SOCIAL_LINKEDIN_SYNC: "/api/social/linkedin/sync",
  SOCIAL_PINTEREST_SYNC: "/api/social/pinterest/sync",
  SOCIAL_META_SYNC: "/api/social/meta/sync",
  SOCIAL_INSTAGRAM_SYNC: "/api/social/instagram/sync",

  // Social Posting
  SOCIAL_POST: "/api/social/post", // Legacy endpoint (still works)
  SOCIAL_POST_NOW: "/api/social/post/now",
  SOCIAL_POST_SCHEDULE: "/api/social/post/schedule",
  SOCIAL_POST_AUTOMATE: "/api/social/post/automate",
  SOCIAL_POSTING_RUN: "/api/social/posting/run",

  // Automatic personalised content
  AUTOMATIC_GENERATE: "/api/automatic/generate",
  AUTOMATIC_IMAGES: "/api/automatic/images",
  AUTOMATIC_DOWNLOAD: "/api/automatic/download",
};
