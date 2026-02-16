/**
 * Flow generator service - uses LLM to generate flow from user description
 */
import { runCommonChat } from "../../services/commonChat.js";
import { FLOW_GENERATOR_SYSTEM, buildFlowGeneratorUserPrompt } from "../prompts/flowGeneratorPrompt.js";

/**
 * Generate flow blocks from agent description
 * @param {Object} params
 * @param {string} params.apiKey - Gemini API key
 * @param {string} params.name - Agent name
 * @param {string} params.description - What the agent does
 * @param {string} [params.context] - Additional context
 * @param {Array} [params.referenceImages] - Reference images (count)
 * @returns {Promise<{ blocks: Array }>}
 */
export async function generateFlowFromDescription({ apiKey, name, description, context, referenceImages = [] }) {
  if (!apiKey) throw new Error("apiKey required");
  if (!name?.trim()) throw new Error("name required");
  if (!description?.trim()) throw new Error("description required");

  const userPrompt = buildFlowGeneratorUserPrompt({ name, description, context, referenceImages });

  const fullPrompt = `${FLOW_GENERATOR_SYSTEM}\n\n${userPrompt}`;

  const result = await runCommonChat({
    apiKey,
    prompt: fullPrompt,
    temperature: 0.3,
  });

  const text = result.text?.trim() || "";

  // Remove markdown code blocks if present
  let jsonStr = text;
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) jsonStr = match[1].trim();

  let blocks;
  try {
    blocks = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Flow generator returned invalid JSON: ${e.message}`);
  }

  if (!Array.isArray(blocks)) {
    throw new Error("Flow generator must return an array of blocks");
  }

  // Ensure each block has id, type, label, config
  blocks = blocks.map((b, i) => ({
    id: b.id || `block_${i + 1}`,
    type: b.type || "llm",
    label: b.label || `Step ${i + 1}`,
    config: b.config || {},
    inputs: Array.isArray(b.inputs) ? b.inputs : [],
  }));

  return { blocks };
}
