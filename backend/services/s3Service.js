/**
 * AWS S3 service - handles image uploads
 */
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
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
 * Upload image to S3 (private bucket, use presigned URLs for access)
 * @param {Object} params
 * @param {Buffer} params.buffer - Image buffer
 * @param {string} params.key - S3 key (path)
 * @param {string} params.contentType - MIME type (e.g., "image/png")
 * @returns {Promise<void>} Uploads to S3, no return value
 */
export async function uploadImageToS3({ buffer, key, contentType = "image/png" }) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    // No ACL - bucket is private, access via presigned URLs
  });

  await s3Client.send(command);
}

/**
 * Generate presigned URL for S3 object
 * @param {string} key - S3 key (path)
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @param {boolean} forceDownload - If true, sets Content-Disposition header to force download
 * @returns {Promise<string>} Presigned URL
 */
export async function getPresignedUrl(key, expiresIn = 3600, forceDownload = false) {
  const commandParams = {
    Bucket: BUCKET,
    Key: key,
  };

  // If forceDownload is true, set Content-Disposition header to force download
  if (forceDownload) {
    // Extract filename from key (last part after /)
    const filename = key.split("/").pop() || "download.png";
    commandParams.ResponseContentDisposition = `attachment; filename="${filename}"`;
  }

  const command = new GetObjectCommand(commandParams);
  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
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
