/**
 * Flow schema for agent execution.
 * A flow is a directed graph of blocks with inputs/outputs.
 */

/**
 * Block schema - each node in the flow
 * @typedef {Object} FlowBlock
 * @property {string} id - Unique block id (e.g. "block_1")
 * @property {string} type - One of BLOCK_TYPES
 * @property {string} label - Human-readable label
 * @property {Object} config - Block-specific config
 * @property {string[]} [inputs] - Array of block ids this block depends on (for execution order)
 * @property {Object} [inputMapping] - Map output keys from previous blocks to this block's inputs
 */

/**
 * Human task block config
 * @typedef {Object} HumanTaskConfig
 * @property {string} inputType - HUMAN_TASK_INPUT_TYPES
 * @property {string} instruction - What to ask the user
 * @property {string} [outputKey] - Key to store result in flow context
 * @property {boolean} [useLlmToStructure] - Whether to use LLM to structure raw input
 * @property {string} [structurePrompt] - Prompt for LLM when structuring
 */

/**
 * LLM block config
 * @typedef {Object} LlmConfig
 * @property {string} prompt - Prompt template (can use {{var}} from previous blocks)
 * @property {string} [outputKey] - Key to store result
 */

/**
 * Image gen block config
 * @typedef {Object} ImageGenConfig
 * @property {string} prompt - Prompt template
 * @property {string} [referenceFromBlock] - Block id that provides reference image
 * @property {string} [aspectRatio] - e.g. "1:1", "16:9"
 */

/**
 * @typedef {Object} AgentFlow
 * @property {string} id
 * @property {string} agentId
 * @property {FlowBlock[]} blocks
 * @property {Object} [metadata] - Optional metadata
 */
