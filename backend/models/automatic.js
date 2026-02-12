/**
 * Automatic model - stores generated automatic personalised content
 * 
 * Schema:
 * - userId: string (required, indexed)
 * - items: array of objects
 *   - prompt: string (the prompt used to generate the image)
 *   - imageUrl: string (S3 URL of the generated image)
 *   - imageKey: string (S3 key for reference)
 *   - createdAt: Date
 * - createdAt: Date (when the document was first created)
 * - updatedAt: Date (last update time)
 */

export const AutomaticSchema = {
  userId: String, // Required, indexed
  items: [
    {
      prompt: String,
      imageUrl: String, // S3 public URL
      imageKey: String, // S3 key for reference
      createdAt: Date,
    },
  ],
  createdAt: Date,
  updatedAt: Date,
};
