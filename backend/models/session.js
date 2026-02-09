/**
 * Session model - data structure definitions for chat sessions
 */

export const SessionSchema = {
  sessionId: String, // Unique session identifier
  userId: String, // User ID (from auth)
  messages: Array, // Array of message objects
  createdAt: Date,
  updatedAt: Date,
  lastActivityAt: Date, // For detecting "after a while"
};

/**
 * Message structure within session
 */
export const MessageSchema = {
  type: String, // "user" or "assistant"
  content: String, // Text content or image URL
  contentType: String, // "text" or "image"
  prompt: String, // Original user prompt (for image generation)
  aspectRatio: String, // Aspect ratio if image (e.g., "1:1")
  imageUrl: String, // S3 URL if image
  timestamp: Date,
};
