/**
 * AWS S3 service - handles image uploads
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || "werbens";

/**
 * Upload image to S3
 * @param {Object} params
 * @param {Buffer} params.buffer - Image buffer
 * @param {string} params.key - S3 key (path)
 * @param {string} params.contentType - MIME type (e.g., "image/png")
 * @returns {Promise<string>} Public URL of uploaded image
 */
export async function uploadImageToS3({ buffer, key, contentType = "image/png" }) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: "public-read", // Make image publicly accessible
  });

  await s3Client.send(command);

  // Return public URL (format: https://bucket-name.s3.region.amazonaws.com/key)
  const region = process.env.AWS_REGION || "eu-north-1";
  return `https://${BUCKET}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Generate S3 key for session image
 * @param {string} sessionId
 * @param {string} messageId
 * @returns {string} S3 key
 */
export function generateImageKey(sessionId, messageId) {
  const timestamp = Date.now();
  return `sessions/${sessionId}/images/${messageId}-${timestamp}.png`;
}
