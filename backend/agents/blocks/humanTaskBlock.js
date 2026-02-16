/**
 * Human task block - does NOT execute automatically.
 * Returns a placeholder indicating human input is required.
 * The orchestrator pauses and returns human task info to the client.
 */
import { BLOCK_TYPES, HUMAN_TASK_INPUT_TYPES } from "../constants/blockTypes.js";

/**
 * Human task blocks are never "executed" by the backend.
 * They return a special marker that the client uses to show an input form.
 *
 * @param {Object} block - Flow block
 * @param {Object} context - Flow execution context
 * @param {Object} options - { humanInputs?: { blockId: value } }
 * @returns {Promise<{ __humanTask: true, blockId, inputType, instruction, value? }>}
 */
export async function executeHumanTaskBlock(block, context, options = {}) {
  const { humanInputs } = options;

  // If human already provided input, use it
  if (humanInputs && humanInputs[block.id] !== undefined) {
    const value = humanInputs[block.id];
    const outputKey = block.config?.outputKey || `human_${block.id}`;
    return { [outputKey]: value };
  }

  // Otherwise, return human task request
  return {
    __humanTask: true,
    blockId: block.id,
    blockLabel: block.label,
    inputType: block.config?.inputType || HUMAN_TASK_INPUT_TYPES.TEXT,
    instruction: block.config?.instruction || "Please provide input",
    outputKey: block.config?.outputKey || `human_${block.id}`,
    useLlmToStructure: block.config?.useLlmToStructure || false,
    structurePrompt: block.config?.structurePrompt,
  };
}
