/**
 * Flow orchestrator - executes a flow of blocks, handling human tasks
 */
import { getBlockExecutor } from "../blocks/registry.js";
import { BLOCK_TYPES } from "../constants/blockTypes.js";

/**
 * Topological sort of blocks by inputs
 * @param {Array} blocks
 * @returns {Array} Sorted block ids
 */
function topologicalOrder(blocks) {
  const idToBlock = new Map(blocks.map((b) => [b.id, b]));
  const visited = new Set();
  const order = [];

  function visit(id) {
    if (visited.has(id)) return;
    visited.add(id);
    const block = idToBlock.get(id);
    if (block?.inputs) {
      for (const inp of block.inputs) visit(inp);
    }
    order.push(id);
  }

  for (const b of blocks) visit(b.id);
  return order;
}

/**
 * Execute a flow up to the first human task (or completion)
 * @param {Object} params
 * @param {Array} params.blocks - Flow blocks
 * @param {Object} params.initialContext - Initial context (e.g. { url: "..." })
 * @param {Object} params.humanInputs - Map of blockId -> value for human tasks
 * @param {Object} params.options - { apiKey, userId }
 * @returns {Promise<{ status: "completed"|"human_required", context: Object, humanTask?: Object }>}
 */
export async function executeFlow({ blocks, initialContext = {}, humanInputs = {}, options = {} }) {
  const context = { ...initialContext };
  const order = topologicalOrder(blocks);

  for (const blockId of order) {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) continue;

    const executor = getBlockExecutor(block.type);
    if (!executor) {
      throw new Error(`Block type "${block.type}" has no executor`);
    }

    const result = await executor(block, context, { ...options, humanInputs });

    // Human task: pause and return
    if (result?.__humanTask) {
      return {
        status: "human_required",
        context,
        humanTask: result,
      };
    }

    // Merge result into context
    Object.assign(context, result);
  }

  return {
    status: "completed",
    context,
  };
}
