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
  CONTEXT_UPDATE_PLATFORM: "/api/context/update-platform",

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
  SOCIAL_YOUTUBE_REPLY: "/api/social/youtube/reply",
  SOCIAL_YOUTUBE_REPLY_STREAM: "/api/social/youtube/reply/stream",
  SOCIAL_YOUTUBE_IDEATION_ENGINE: "/api/social/youtube/ideation-engine",
  SOCIAL_YOUTUBE_IDEATION_ENGINE_SEARCH: "/api/social/youtube/ideation-engine/search",
  SOCIAL_YOUTUBE_IDEATION_ENGINE_TRACKED: "/api/social/youtube/ideation-engine/tracked",
  SOCIAL_YOUTUBE_REPORT_TIME_POSTING: "/api/social/youtube/reports/time-of-posting",
  SOCIAL_YOUTUBE_REPORT_TIME_POSTING_EXCEL: "/api/social/youtube/reports/time-of-posting/excel",
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
  AUTOMATIC_DELETE_IMAGE: "/api/automatic/images/delete",

  // Feedback Loop (X Phase-1)
  FEEDBACK_LOOP_CONFIG: "/api/feedback-loop/config",
  FEEDBACK_LOOP_START: "/api/feedback-loop/start",
  FEEDBACK_LOOP_PAUSE: "/api/feedback-loop/pause",
  FEEDBACK_LOOP_TRIGGER: "/api/feedback-loop/trigger",
  FEEDBACK_LOOP_GENERATE_PREVIEW: "/api/feedback-loop/generate-preview",
  FEEDBACK_LOOP_GENERATION_HISTORY: "/api/feedback-loop/generation-history",
  FEEDBACK_LOOP_DASHBOARD: "/api/feedback-loop/dashboard",
  FEEDBACK_LOOP_RUNS: "/api/feedback-loop/runs",
  FEEDBACK_LOOP_TASKS: "/api/feedback-loop/tasks",
  FEEDBACK_LOOP_POSTS: "/api/feedback-loop/posts",
  FEEDBACK_LOOP_TASKS_RUN: "/api/feedback-loop/tasks/run",
  FEEDBACK_LOOP_AUTONOMOUS_RUN: "/api/feedback-loop/autonomous/run",

  // Agents (human-in-the-loop flows)
  AGENTS: "/api/agents",
  AGENTS_CONSTANTS: "/api/agents/constants",
  AGENT_BY_ID: (id) => `/api/agents/${id}`,
  AGENT_GENERATE_FLOW: (id) => `/api/agents/${id}/generate-flow`,
  AGENT_RUN: (id) => `/api/agents/${id}/run`,
};
