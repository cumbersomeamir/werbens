/**
 * Agents module - human-in-the-loop agent flows
 *
 * Structure:
 * - constants/   Block types, human task input types
 * - schema/      Flow schema (JSDoc)
 * - blocks/      Block executors (llm, imageGen, humanTask, urlFetch)
 * - prompts/     AI prompts for flow generation
 * - services/    agentService, flowGeneratorService
 * - orchestrator/ flowOrchestrator
 * - models/      agentModel
 * - routes/      API handlers
 */

export {
  createAgentHandler,
  getAgentsHandler,
  getAgentByIdHandler,
  updateAgentHandler,
  deleteAgentHandler,
  generateFlowHandler,
  runAgentHandler,
  getConstantsHandler,
} from "./routes/agents.js";
