/**
 * Agent service - CRUD and flow operations
 */
import { getDb } from "../../db.js";
import { executeFlow } from "../orchestrator/flowOrchestrator.js";
import { saveFlow, deleteFlowsByAgentId } from "./flowService.js";
import { BLOCK_TYPES, PLATFORM_SERVICES, HUMAN_TASK_INPUT_TYPES } from "../constants/blockTypes.js";
import {
  ensurePredefinedAgentsForUser,
  upsertPredefinedAgent,
} from "./predefinedAgentService.js";
import { getPredefinedAgentTemplate } from "../tools/catalog/predefinedAgents.js";

const COLLECTION = "Agents";

export async function createAgent(
  userId,
  { name, description, context, referenceImageKeys = [], templateKey }
) {
  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) throw new Error("userId required");

  // Predefined templates are initialized with fixed backend flow/tooling.
  if (templateKey) {
    const template = getPredefinedAgentTemplate(templateKey);
    if (!template) {
      throw new Error(`Unknown agent template: ${templateKey}`);
    }
    return upsertPredefinedAgent(normalizedUserId, template.key);
  }

  const db = await getDb();
  const coll = db.collection(COLLECTION);
  const now = new Date();

  const doc = {
    userId: normalizedUserId,
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
  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) return [];

  await ensurePredefinedAgentsForUser(normalizedUserId);

  const db = await getDb();
  const coll = db.collection(COLLECTION);
  const list = await coll
    .find({ userId: normalizedUserId })
    .sort({ updatedAt: -1 })
    .toArray();
  return list;
}

export async function getAgentById(userId, agentId) {
  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) return null;

  const db = await getDb();
  const coll = db.collection(COLLECTION);
  const { ObjectId } = await import("mongodb");
  const id = ObjectId.isValid(agentId) ? new ObjectId(agentId) : null;
  if (!id) return null;
  const doc = await coll.findOne({ _id: id, userId: normalizedUserId });
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
  if (result.deletedCount > 0) {
    await deleteFlowsByAgentId(agentId);
  }
  return result.deletedCount > 0;
}

/**
 * Returns fixed flow for predefined agents.
 * Dynamic flow generation is intentionally disabled.
 */
export async function generateFlow(apiKey, userId, agentId) {
  const agent = await getAgentById(userId, agentId);
  if (!agent) throw new Error("Agent not found");

  if (!agent.templateKey) {
    throw new Error("Flow generation is disabled. This app now uses predefined backend flows.");
  }

  const updated = await upsertPredefinedAgent(userId, agent.templateKey);
  const blocks = updated?.flow?.blocks || [];

  await saveFlow(agentId, blocks);
  await updateAgent(userId, agentId, { flow: { blocks } });
  return { blocks };
}

/**
 * Execute agent flow
 */
export async function runAgent(apiKey, userId, agentId, { initialContext = {}, humanInputs = {} }) {
  let agent = await getAgentById(userId, agentId);
  if (!agent) throw new Error("Agent not found");

  if (agent.templateKey) {
    agent = (await upsertPredefinedAgent(userId, agent.templateKey)) || agent;
  }

  const blocks = agent.flow?.blocks || [];
  if (blocks.length === 0) throw new Error("Agent has no configured flow.");

  return executeFlow({
    blocks,
    initialContext,
    humanInputs,
    options: {
      apiKey,
      userId,
      agentId: String(agent._id),
      agentTemplateKey: agent.templateKey,
    },
  });
}

export { PLATFORM_SERVICES, HUMAN_TASK_INPUT_TYPES, BLOCK_TYPES };
