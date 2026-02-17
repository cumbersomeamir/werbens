/**
 * Agent API service
 */
import { get, post, patch, del } from "../client.js";
import { API_ENDPOINTS } from "../endpoints.js";

export async function getAgents(userId) {
  if (!userId) return [];
  return get(`${API_ENDPOINTS.AGENTS}?userId=${encodeURIComponent(userId)}`);
}

export async function getAgent(userId, agentId) {
  if (!userId || !agentId) return null;
  return get(`${API_ENDPOINTS.AGENT_BY_ID(agentId)}?userId=${encodeURIComponent(userId)}`);
}

export async function createAgent(userId, { name, description, context, referenceImageKeys }) {
  const body = { userId, name, description, context, referenceImageKeys };
  return post(API_ENDPOINTS.AGENTS, body);
}

export async function updateAgent(userId, agentId, updates) {
  const body = { userId, ...updates };
  return patch(API_ENDPOINTS.AGENT_BY_ID(agentId), body);
}

export async function deleteAgent(userId, agentId) {
  return del(`${API_ENDPOINTS.AGENT_BY_ID(agentId)}?userId=${encodeURIComponent(userId)}`);
}

export async function generateFlow(userId, agentId) {
  return post(API_ENDPOINTS.AGENT_GENERATE_FLOW(agentId), { userId });
}

export async function runAgent(userId, agentId, { initialContext = {}, humanInputs = {} }) {
  return post(API_ENDPOINTS.AGENT_RUN(agentId), {
    userId,
    initialContext,
    humanInputs,
  });
}

export async function getAgentConstants() {
  return get(API_ENDPOINTS.AGENTS_CONSTANTS);
}
