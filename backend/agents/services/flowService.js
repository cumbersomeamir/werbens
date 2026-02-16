/**
 * Flow service - persists flow definitions to Flows collection
 *
 * Schema:
 * - agentId: ObjectId (indexed)
 * - blocks: Array of flow blocks
 * - version: number (incremented per agent)
 * - createdAt: Date
 */
import { getDb } from "../../db.js";
import { ObjectId } from "mongodb";

const COLLECTION = "Flows";

/**
 * Save a flow for an agent. Creates new doc or updates latest.
 * @param {string} agentId - Agent _id
 * @param {Array} blocks - Flow blocks
 * @returns {Promise<{ _id, agentId, blocks, version, createdAt }>}
 */
export async function saveFlow(agentId, blocks) {
  const db = await getDb();
  const coll = db.collection(COLLECTION);
  const id = ObjectId.isValid(agentId) ? new ObjectId(agentId) : null;
  if (!id) throw new Error("Invalid agentId");

  const latest = await coll.findOne({ agentId: id }, { sort: { version: -1 } });
  const version = latest ? (latest.version || 0) + 1 : 1;
  const now = new Date();

  const doc = {
    agentId: id,
    blocks: Array.isArray(blocks) ? blocks : [],
    version,
    createdAt: now,
  };

  const result = await coll.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/**
 * Get flows for an agent, newest first
 * @param {string} agentId
 * @param {number} [limit=10]
 */
export async function getFlowsByAgentId(agentId, limit = 10) {
  const db = await getDb();
  const coll = db.collection(COLLECTION);
  const id = ObjectId.isValid(agentId) ? new ObjectId(agentId) : null;
  if (!id) return [];

  return coll
    .find({ agentId: id })
    .sort({ version: -1 })
    .limit(limit)
    .toArray();
}

/**
 * Get the latest flow for an agent
 */
export async function getLatestFlow(agentId) {
  const db = await getDb();
  const coll = db.collection(COLLECTION);
  const id = ObjectId.isValid(agentId) ? new ObjectId(agentId) : null;
  if (!id) return null;

  return coll.findOne({ agentId: id }, { sort: { version: -1 } });
}

/**
 * Delete all flows for an agent (when agent is deleted)
 */
export async function deleteFlowsByAgentId(agentId) {
  const db = await getDb();
  const coll = db.collection(COLLECTION);
  const id = ObjectId.isValid(agentId) ? new ObjectId(agentId) : null;
  if (!id) return 0;

  const result = await coll.deleteMany({ agentId: id });
  return result.deletedCount;
}
