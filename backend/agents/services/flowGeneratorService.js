/**
 * Flow generator service - uses LLM to generate flow from user description
 */
import { jsonrepair } from "jsonrepair";
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

  // Extract JSON - handle markdown code blocks, extra text, etc.
  let jsonStr = text;
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  } else {
    // Fallback: find first [ and last ] for array
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start !== -1 && end !== -1 && end > start) {
      jsonStr = text.slice(start, end + 1);
    }
  }

  // Strip any remaining backticks, "json" label, or stray chars at start/end
  jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "").replace(/^[`\s]+|[`\s]+$/g, "").trim();

  let blocks;
  try {
    blocks = JSON.parse(jsonStr);
  } catch (e) {
    try {
      const repaired = jsonrepair(jsonStr);
      blocks = JSON.parse(repaired);
    } catch (e2) {
      throw new Error(`Flow generator returned invalid JSON: ${e.message}`);
    }
  }

  if (!Array.isArray(blocks)) {
    throw new Error("Flow generator must return an array of blocks");
  }

  // Ensure each block has id, type, label, config; strip "Optional" from labels
  blocks = blocks.map((b, i) => {
    let label = b.label || `Step ${i + 1}`;
    label = label.replace(/\s*\(optional\)\s*/gi, " ").replace(/\s*\(Optional\)\s*/g, " ").trim();
    return {
      id: b.id || `block_${i + 1}`,
      type: b.type || "llm",
      label,
      config: b.config || {},
      inputs: Array.isArray(b.inputs) ? b.inputs : [],
    };
  });

  return { blocks };
}
