/**
 * Normalize Google API errors (429, resource exhausted) to user-friendly messages
 */
function normalizeApiError(err) {
  const raw = String(err?.message ?? err ?? "");
  if (/429|resource exhausted|RESOURCE_EXHAUSTED/i.test(raw)) {
    return "Your Google AI API quota is exhausted. Please try again later or check your quota at console.cloud.google.com.";
  }
  return err?.message || "Request failed";
}

/**
 * Agents API routes
 */
import {
  createAgent,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
  generateFlow,
  runAgent,
  PLATFORM_SERVICES,
  HUMAN_TASK_INPUT_TYPES,
} from "../services/agentService.js";

/**
 * POST /api/agents - Create new agent
 */
export async function createAgentHandler(req, res) {
  try {
    const userId = req.body?.userId?.trim();
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }
    const agent = await createAgent(userId, {
      name: req.body.name,
      description: req.body.description,
      context: req.body.context,
      referenceImageKeys: req.body.referenceImageKeys,
      templateKey: req.body.templateKey,
    });
    res.json(agent);
  } catch (err) {
    console.error("createAgent error:", err.message);
    res.status(500).json({ error: err.message || "Failed to create agent" });
  }
}

/**
 * GET /api/agents?userId= - List agents
 */
export async function getAgentsHandler(req, res) {
  try {
    const userId = req.query?.userId?.trim();
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }
    const list = await getAgents(userId);
    res.json(list);
  } catch (err) {
    console.error("getAgents error:", err.message);
    res.status(500).json({ error: err.message || "Failed to list agents" });
  }
}

/**
 * GET /api/agents/:id?userId= - Get single agent
 */
export async function getAgentByIdHandler(req, res) {
  try {
    const userId = req.query?.userId?.trim();
    const agentId = req.params?.id;
    if (!userId || !agentId) {
      return res.status(400).json({ error: "userId and agentId required" });
    }
    const agent = await getAgentById(userId, agentId);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.json(agent);
  } catch (err) {
    console.error("getAgentById error:", err.message);
    res.status(500).json({ error: err.message || "Failed to get agent" });
  }
}

/**
 * PATCH /api/agents/:id - Update agent
 */
export async function updateAgentHandler(req, res) {
  try {
    const userId = req.body?.userId?.trim();
    const agentId = req.params?.id;
    if (!userId || !agentId) {
      return res.status(400).json({ error: "userId and agentId required" });
    }
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.context !== undefined) updates.context = req.body.context;
    if (req.body.referenceImageKeys !== undefined) updates.referenceImageKeys = req.body.referenceImageKeys;
    if (req.body.flow !== undefined) updates.flow = req.body.flow;
    const agent = await updateAgent(userId, agentId, updates);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.json(agent);
  } catch (err) {
    console.error("updateAgent error:", err.message);
    res.status(500).json({ error: err.message || "Failed to update agent" });
  }
}

/**
 * DELETE /api/agents/:id - Delete agent
 */
export async function deleteAgentHandler(req, res) {
  try {
    const userId = req.query?.userId?.trim();
    const agentId = req.params?.id;
    if (!userId || !agentId) {
      return res.status(400).json({ error: "userId and agentId required" });
    }
    const deleted = await deleteAgent(userId, agentId);
    if (!deleted) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("deleteAgent error:", err.message);
    res.status(500).json({ error: err.message || "Failed to delete agent" });
  }
}

/**
 * POST /api/agents/:id/generate-flow - Return predefined flow for template agents
 */
export async function generateFlowHandler(req, res) {
  try {
    const userId = req.body?.userId?.trim();
    const agentId = req.params?.id;
    if (!userId || !agentId) {
      return res.status(400).json({ error: "userId and agentId required" });
    }
    const { blocks } = await generateFlow(null, userId, agentId);
    res.json({ blocks });
  } catch (err) {
    console.error("generateFlow error:", err.message);
    const msg = normalizeApiError(err);
    res.status(500).json({ error: msg });
  }
}

/**
 * POST /api/agents/:id/run - Execute agent flow
 */
export async function runAgentHandler(req, res) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: "GEMINI_API_KEY not configured" });
    }
    const userId = req.body?.userId?.trim();
    const agentId = req.params?.id;
    if (!userId || !agentId) {
      return res.status(400).json({ error: "userId and agentId required" });
    }
    const initialContext = req.body.initialContext || {};
    const humanInputs = req.body.humanInputs || {};

    const result = await runAgent(apiKey, userId, agentId, {
      initialContext,
      humanInputs,
    });
    res.json(result);
  } catch (err) {
    console.error("runAgent error:", err.message);
    const msg = normalizeApiError(err);
    res.status(500).json({ error: msg });
  }
}

/**
 * GET /api/agents/constants - Get block types, human input types, etc.
 */
export async function getConstantsHandler(req, res) {
  res.json({
    platformServices: PLATFORM_SERVICES,
    humanTaskInputTypes: HUMAN_TASK_INPUT_TYPES,
  });
}
