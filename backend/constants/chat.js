// Chat service constants
export const CHAT_CONSTANTS = {
  MAX_TURNS: 10,
  MAX_MESSAGES: 20, // MAX_TURNS * 2
  MAX_CHARS_PER_MSG: 1200,
  MAX_OUTPUT_TOKENS: 350,
  TEMPERATURE: 0.4,
  MODEL: "gemini-2.0-flash",
  TTL_SEC: 60 * 60 * 24 * 7, // 7 days
  SUMMARY_TEMPERATURE: 0.2,
  SUMMARY_MAX_TOKENS: 220,
};

export const CHAT_KEYS = {
  history: (sessionId) => `chat:${sessionId}:history`,
  summary: (sessionId) => `chat:${sessionId}:summary`,
};
