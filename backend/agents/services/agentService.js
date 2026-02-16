/**
 * Agent service - CRUD and flow operations
 */
import { getDb } from "../../db.js";
import { generateFlowFromDescription } from "./flowGeneratorService.js";
import { executeFlow } from "../orchestrator/flowOrchestrator.js";
import { BLOCK_TYPES, PLATFORM_SERVICES, HUMAN_TASK_INPUT_TYPES } from "../constants/blockTypes.js";

const COLLECTION = "Agents";

export async function createAgent(userId, { name, description, context, referenceImageKeys = [] }) {
  const db = await getDb();
  const coll = db.collection(COLLECTION);
  const now = new Date();

  const doc = {
    userId: userId.trim(),
    name: name?.trim() || "Untitled Agent",
    description: description?.trim() || "",
    context: context?.trim() || "",
    referenceImageKeys: Array.isArray(referenceImageKeys) ? referenceImageKeys : [],
    flow: { blocks: [] },
    createdAt: now,
    updatedAt: now,
  };

  const result = await coll.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getAgents(userId) {
  const db = await getDb();
  const coll = db.collection(COLLECTION);
  const list = await coll
    .find({ userId: userId.trim() })
    .sort({ updatedAt: -1 })
    .toArray();
  return list;
}

export async function getAgentById(userId, agentId) {
  const db = await getDb();
  const coll = db.collection(COLLECTION);
  const { ObjectId } = await import("mongodb");
  const id = ObjectId.isValid(agentId) ? new ObjectId(agentId) : null;
  if (!id) return null;
  const doc = await coll.findOne({ _id: id, userId: userId.trim() });
  return doc;
}

export async function updateAgent(userId, agentId, updates) {
  const db = await getDb();
  const coll = db.collection(COLLECTION);
  const { ObjectId } = await import("mongodb");
  const id = ObjectId.isValid(agentId) ? new ObjectId(agentId) : null;
  if (!id) return null;

  const allowed = ["name", "description", "context", "referenceImageKeys", "flow"];
  const set = {};
  for (const k of allowed) {
    if (updates[k] !== undefined) set[k] = updates[k];
  }
  set.updatedAt = new Date();

  const result = await coll.findOneAndUpdate(
    { _id: id, userId: userId.trim() },
    { $set: set },
    { returnDocument: "after" }
  );
  return result;
}

export async function deleteAgent(userId, agentId) {
  const db = await getDb();
  const coll = db.collection(COLLECTION);
  const { ObjectId } = await import("mongodb");
  const id = ObjectId.isValid(agentId) ? new ObjectId(agentId) : null;
  if (!id) return false;
  const result = await coll.deleteOne({ _id: id, userId: userId.trim() });
  return result.deletedCount > 0;
}

/**
 * Generate flow for an agent using AI
 */
export async function generateFlow(apiKey, userId, agentId) {
  const agent = await getAgentById(userId, agentId);
  if (!agent) throw new Error("Agent not found");

  const { blocks } = await generateFlowFromDescription({
    apiKey,
    name: agent.name,
    description: agent.description,
    context: agent.context,
    referenceImages: agent.referenceImageKeys || [],
  });

  await updateAgent(userId, agentId, { flow: { blocks } });
  return { blocks };
}

/**
 * Execute agent flow
 */
export async function runAgent(apiKey, userId, agentId, { initialContext = {}, humanInputs = {} }) {
  const agent = await getAgentById(userId, agentId);
  if (!agent) throw new Error("Agent not found");

  const blocks = agent.flow?.blocks || [];
  if (blocks.length === 0) throw new Error("Agent has no flow. Generate flow first.");

  return executeFlow({
    blocks,
    initialContext,
    humanInputs,
    options: { apiKey, userId },
  });
}

export { PLATFORM_SERVICES, HUMAN_TASK_INPUT_TYPES, BLOCK_TYPES };
