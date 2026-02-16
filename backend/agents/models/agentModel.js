/**
 * Agent model - stores agent definitions
 *
 * MongoDB collection: Agents
 * Schema:
 * - userId: string (required, indexed)
 * - name: string
 * - description: string
 * - context: string (user-provided context)
 * - referenceImageKeys: string[] (S3 keys for reference images)
 * - flow: { blocks: Array } (current flow; also persisted to Flows collection)
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

/**
 * Flow model - stored in Flows collection
 *
 * MongoDB collection: Flows
 * Schema:
 * - agentId: ObjectId (indexed)
 * - blocks: Array (flow blocks)
 * - version: number (incremented per agent)
 * - createdAt: Date
 */
export const FlowSchema = {
  agentId: "ObjectId",
  blocks: Array,
  version: Number,
  createdAt: Date,
};
