/**
 * Agent model - stores agent definitions and flows
 *
 * Schema:
 * - userId: string (required, indexed)
 * - name: string
 * - description: string
 * - context: string (user-provided context)
 * - referenceImageKeys: string[] (S3 keys for reference images)
 * - flow: { blocks: Array }
 * - createdAt: Date
 * - updatedAt: Date
 */

export const AgentSchema = {
  userId: String,
  name: String,
  description: String,
  context: String,
  referenceImageKeys: [String],
  flow: {
    blocks: [
      {
        id: String,
        type: String,
        label: String,
        config: Object,
        inputs: [String],
      },
    ],
  },
  createdAt: Date,
  updatedAt: Date,
};
