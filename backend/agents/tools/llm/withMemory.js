/**
 * Agent LLM tool with memory.
 * Wraps the shared chat service so each app/agent keeps isolated memory.
 */
import { generateChatResponse } from "../../../services/chatService.js";
import { loadHistory, loadSummary, saveHistory, saveSummary } from "../../../services/memory.js";

const DEFAULT_NAMESPACE = "agents";

function cleanSegment(value, fallback) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  return raw.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Build an isolated memory session id for an app agent.
 */
export function buildAgentMemorySessionId({
  userId,
  agentKey,
  agentId,
  namespace = DEFAULT_NAMESPACE,
}) {
  if (!userId?.trim()) {
    throw new Error("buildAgentMemorySessionId: userId is required");
  }
  const ns = cleanSegment(namespace, DEFAULT_NAMESPACE);
  const user = cleanSegment(userId, "unknown_user");
  const key = cleanSegment(agentKey, "generic_agent");
  const id = cleanSegment(agentId, "global");
  return `${ns}:${user}:${key}:${id}`;
}

/**
 * Initialize memory bucket for an agent/app.
 * Safe to call repeatedly.
 */
export async function initializeAgentMemory({
  userId,
  agentKey,
  agentId,
  namespace = DEFAULT_NAMESPACE,
  seedSummary = "",
}) {
  const sessionId = buildAgentMemorySessionId({
    userId,
    agentKey,
    agentId,
    namespace,
  });

  const [history, summary] = await Promise.all([
    loadHistory(sessionId),
    loadSummary(sessionId),
  ]);

  if (!Array.isArray(history) || history.length === 0) {
    await saveHistory(sessionId, []);
  }

  if (seedSummary?.trim() && !summary?.trim()) {
    await saveSummary(sessionId, seedSummary.trim());
  }

  return {
    sessionId,
    hasHistory: Array.isArray(history) && history.length > 0,
    hasSummary: Boolean(summary?.trim() || seedSummary?.trim()),
  };
}

/**
 * Execute an LLM prompt with agent-scoped memory.
 */
export async function runAgentLlmWithMemory({
  apiKey,
  userId,
  agentKey,
  agentId,
  prompt,
  system,
  namespace = DEFAULT_NAMESPACE,
}) {
  const sessionId = buildAgentMemorySessionId({
    userId,
    agentKey,
    agentId,
    namespace,
  });

  const result = await generateChatResponse({
    apiKey,
    sessionId,
    message: prompt,
    system,
  });

  return {
    ...result,
    sessionId,
  };
}
