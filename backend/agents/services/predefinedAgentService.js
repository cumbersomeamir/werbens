import { getDb } from "../../db.js";
import { saveFlow } from "./flowService.js";
import {
  PREDEFINED_AGENT_TEMPLATES,
  getPredefinedAgentTemplate,
} from "../tools/catalog/predefinedAgents.js";
import { initializeAgentMemory } from "../tools/llm/withMemory.js";

const COLLECTION = "Agents";

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function areBlocksEqual(a, b) {
  return JSON.stringify(Array.isArray(a) ? a : []) === JSON.stringify(Array.isArray(b) ? b : []);
}

async function findTemplateAgent(coll, userId, template) {
  const byKey = await coll.findOne({
    userId,
    templateKey: template.key,
  });
  if (byKey) return byKey;

  const byName = await coll.findOne({
    userId,
    name: template.name,
  });
  return byName || null;
}

async function seedMemoryForAgent({ userId, template, agentId }) {
  try {
    await initializeAgentMemory({
      userId,
      agentKey: template.key,
      agentId,
      namespace: "agents",
      seedSummary: template.memorySeed,
    });
  } catch (err) {
    // Memory init should not block agent availability.
    console.warn(`predefinedAgentService: memory init failed for ${template.key}:`, err.message);
  }
}

/**
 * Ensure one predefined agent exists for a user.
 * Upgrades flow automatically when template version changes.
 */
export async function upsertPredefinedAgent(userId, templateKey) {
  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) throw new Error("userId required");

  const template = getPredefinedAgentTemplate(templateKey);
  if (!template) throw new Error(`Unknown predefined agent template: ${templateKey}`);

  const db = await getDb();
  const coll = db.collection(COLLECTION);
  const now = new Date();
  const blocks = template.buildBlocks();

  const existing = await findTemplateAgent(coll, normalizedUserId, template);
  if (!existing) {
    const doc = {
      userId: normalizedUserId,
      templateKey: template.key,
      isSystemAgent: true,
      flowVersion: template.flowVersion,
      name: template.name,
      description: template.description,
      context: "",
      referenceImageKeys: [],
      flow: { blocks },
      createdAt: now,
      updatedAt: now,
    };

    const inserted = await coll.insertOne(doc);
    const created = { ...doc, _id: inserted.insertedId };
    await saveFlow(String(created._id), blocks);
    await seedMemoryForAgent({
      userId: normalizedUserId,
      template,
      agentId: String(created._id),
    });
    return created;
  }

  const hasFlowMismatch = !areBlocksEqual(existing.flow?.blocks, blocks);
  const hasMetadataMismatch =
    normalizeText(existing.name) !== normalizeText(template.name) ||
    normalizeText(existing.description) !== normalizeText(template.description) ||
    existing.templateKey !== template.key ||
    existing.isSystemAgent !== true ||
    Number(existing.flowVersion || 0) !== Number(template.flowVersion);

  if (hasFlowMismatch || hasMetadataMismatch) {
    const updated = await coll.findOneAndUpdate(
      { _id: existing._id },
      {
        $set: {
          templateKey: template.key,
          isSystemAgent: true,
          flowVersion: template.flowVersion,
          name: template.name,
          description: template.description,
          flow: { blocks },
          updatedAt: now,
        },
      },
      { returnDocument: "after" }
    );

    if (hasFlowMismatch) {
      await saveFlow(String(existing._id), blocks);
    }

    await seedMemoryForAgent({
      userId: normalizedUserId,
      template,
      agentId: String(existing._id),
    });
    return updated || existing;
  }

  await seedMemoryForAgent({
    userId: normalizedUserId,
    template,
    agentId: String(existing._id),
  });
  return existing;
}

/**
 * Ensure all predefined app agents exist for a user.
 */
export async function ensurePredefinedAgentsForUser(userId) {
  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) throw new Error("userId required");

  const ensured = [];
  for (const template of PREDEFINED_AGENT_TEMPLATES) {
    // Sequential by design; each upsert touches the same collection and memory keys.
    const agent = await upsertPredefinedAgent(normalizedUserId, template.key);
    ensured.push(agent);
  }
  return ensured;
}
