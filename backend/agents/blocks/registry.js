/**
 * Block executor registry.
 * Maps block types to their executor functions.
 */
import { BLOCK_TYPES } from "../constants/blockTypes.js";
import { executeLlmBlock } from "./llmBlock.js";
import { executeImageGenBlock } from "./imageGenBlock.js";
import { executeHumanTaskBlock } from "./humanTaskBlock.js";
import { executeUrlFetchBlock } from "./urlFetchBlock.js";

const registry = new Map();

registry.set(BLOCK_TYPES.LLM, executeLlmBlock);
registry.set(BLOCK_TYPES.IMAGE_GEN, executeImageGenBlock);
registry.set(BLOCK_TYPES.HUMAN_TASK, executeHumanTaskBlock);
registry.set(BLOCK_TYPES.URL_FETCH, executeUrlFetchBlock);
// POST block - can be added when needed
registry.set(BLOCK_TYPES.POST, async () => {
  throw new Error("Post block not yet implemented in orchestrator");
});

/**
 * Get executor for a block type
 * @param {string} blockType
 * @returns {Function|null}
 */
export function getBlockExecutor(blockType) {
  return registry.get(blockType) || null;
}

/**
 * Check if a block type is executable (not human-only)
 * @param {string} blockType
 * @returns {boolean}
 */
export function isAutomatedBlock(blockType) {
  return blockType !== BLOCK_TYPES.HUMAN_TASK;
}
