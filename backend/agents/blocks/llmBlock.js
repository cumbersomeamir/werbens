/**
 * LLM block executor - uses runCommonChat for text generation
 */
import { runCommonChat } from "../../services/commonChat.js";

/**
 * Resolve template with context variables. {{key}} -> context[key]
 */
function resolveTemplate(template, context) {
  if (!template || typeof template !== "string") return "";
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = context[key];
    return val != null ? String(val) : "";
  });
}

/**
 * Execute LLM block
 * @param {Object} block - Flow block
 * @param {Object} context - Flow execution context { key: value }
 * @param {Object} options - { apiKey, userId }
 * @returns {Promise<{ [outputKey]: string }>}
 */
export async function executeLlmBlock(block, context, options = {}) {
  const { apiKey } = options;
  if (!apiKey) throw new Error("LLM block requires apiKey");

  const prompt = resolveTemplate(block.config?.prompt || "", context);
  if (!prompt.trim()) throw new Error("LLM block: empty prompt after template resolution");

  const result = await runCommonChat({ apiKey, prompt });
  const outputKey = block.config?.outputKey || "llm_output";

  return { [outputKey]: result.text };
}
