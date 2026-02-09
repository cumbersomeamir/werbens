/**
 * Session service - handles session data operations
 */
import { getDb } from "../db.js";
import { uploadImageToS3, generateImageKey } from "./s3Service.js";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity

/**
 * Create a new session
 * @param {string} userId
 * @param {string} sessionId
 * @returns {Promise<Object>} Created session
 */
export async function createSession(userId, sessionId) {
  const db = await getDb();
  const collection = db.collection("Sessions");

  const session = {
    sessionId,
    userId,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActivityAt: new Date(),
  };

  await collection.insertOne(session);
  return session;
}

/**
 * Get or create session for user
 * @param {string} userId
 * @param {string} sessionId
 * @returns {Promise<Object>} Session object
 */
export async function getOrCreateSession(userId, sessionId) {
  const db = await getDb();
  const collection = db.collection("Sessions");

  // Check if session exists and is still active
  const existing = await collection.findOne({ sessionId, userId });
  
  if (existing) {
    const timeSinceActivity = Date.now() - existing.lastActivityAt.getTime();
    // If session is older than timeout, it's expired - create a new one
    // (frontend will have already generated a new sessionId)
    if (timeSinceActivity > SESSION_TIMEOUT_MS) {
      return createSession(userId, sessionId);
    }
    return existing;
  }

  // Create new session
  return createSession(userId, sessionId);
}

/**
 * Add message to session
 * @param {Object} params
 * @param {string} params.sessionId
 * @param {string} params.userId
 * @param {string} params.type - "user" or "assistant"
 * @param {string} params.content - Text content or image URL
 * @param {string} params.contentType - "text" or "image"
 * @param {string} [params.prompt] - Original prompt (for image generation)
 * @param {string} [params.aspectRatio] - Aspect ratio if image
 * @param {string} [params.imageUrl] - S3 URL if image
 * @returns {Promise<void>}
 */
export async function addMessageToSession({
  sessionId,
  userId,
  type,
  content,
  contentType,
  prompt,
  aspectRatio,
  imageUrl,
}) {
  const db = await getDb();
  const collection = db.collection("Sessions");

  const message = {
    type,
    content,
    contentType,
    prompt: prompt || null,
    aspectRatio: aspectRatio || null,
    imageUrl: imageUrl || null,
    timestamp: new Date(),
  };

  await collection.updateOne(
    { sessionId, userId },
    {
      $push: { messages: message },
      $set: {
        updatedAt: new Date(),
        lastActivityAt: new Date(),
      },
    }
  );
}

/**
 * Upload image buffer to S3 and return URL
 * @param {Object} params
 * @param {Buffer} params.buffer - Image buffer
 * @param {string} params.sessionId
 * @param {string} params.messageId - Unique message ID
 * @param {string} params.contentType - MIME type
 * @returns {Promise<string>} S3 URL
 */
export async function uploadSessionImage({ buffer, sessionId, messageId, contentType }) {
  const key = generateImageKey(sessionId, messageId);
  return uploadImageToS3({
    buffer: Buffer.from(buffer),
    key,
    contentType,
  });
}

/**
 * Get session messages
 * @param {string} sessionId
 * @param {string} userId
 * @returns {Promise<Array>} Messages array
 */
export async function getSessionMessages(sessionId, userId) {
  const db = await getDb();
  const collection = db.collection("Sessions");

  const session = await collection.findOne(
    { sessionId, userId },
    { projection: { messages: 1 } }
  );

  return session?.messages || [];
}

/**
 * Clear session (for "New Chat")
 * @param {string} sessionId
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function clearSession(sessionId, userId) {
  const db = await getDb();
  const collection = db.collection("Sessions");

  await collection.updateOne(
    { sessionId, userId },
    {
      $set: {
        messages: [],
        updatedAt: new Date(),
        lastActivityAt: new Date(),
      },
    }
  );
}
