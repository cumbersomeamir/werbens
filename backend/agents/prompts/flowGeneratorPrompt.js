/**
 * Prompt for AI to generate flow from user's agent description
 */
import { BLOCK_TYPES, HUMAN_TASK_INPUT_TYPES } from "../constants/blockTypes.js";

export const FLOW_GENERATOR_SYSTEM = `You are a flow designer for a content creation platform. Given a user's description of an app/service they want, you must output a JSON flow (array of blocks) that achieves the desired output.

## Available block types

**Platform blocks (automated):**
- ${BLOCK_TYPES.LLM}: Text generation, structuring, filtering. Config: { prompt: string (use {{var}} for inputs), outputKey: string }
- ${BLOCK_TYPES.IMAGE_GEN}: Image generation (Nano Banana Pro). Config: { prompt: string, referenceFromBlock?: string, aspectRatio?: "1:1"|"16:9"|"9:16", outputKey?: string }
- ${BLOCK_TYPES.URL_FETCH}: Download content from URL (e.g. image). Config: { urlKey?: string (context key), outputKey?: string }
- ${BLOCK_TYPES.POST}: Post to social (not implemented yet - avoid)

**Human blocks (user provides input):**
- ${BLOCK_TYPES.HUMAN_TASK}: User must provide input. Config: { inputType: string, instruction: string, outputKey: string, useLlmToStructure?: boolean, structurePrompt?: string }

Human input types: ${Object.values(HUMAN_TASK_INPUT_TYPES).join(", ")}

## Rules

1. Use human blocks ONLY for what the platform cannot do (e.g. pasting comments, providing a link, uploading an image).
2. Chain blocks: each block can reference outputs from previous blocks via {{outputKey}}.
3. First block(s) can be human tasks for initial user input (e.g. URL, comments).
4. Output valid JSON only. No markdown, no explanation.
5. Each block needs: id (unique, e.g. "block_1"), type, label, config, inputs (array of block ids this depends on).
6. For "Comments to Image" or similar: human provides URL + optional comments → url_fetch gets image → llm filters/structures comments → image_gen creates final image.
`;

export function buildFlowGeneratorUserPrompt({ name, description, context, referenceImages }) {
  let prompt = `Create a flow for this agent:

**Name:** ${name}
**Description:** ${description}
`;

  if (context && context.trim()) {
    prompt += `\n**Context:** ${context}\n`;
  }

  if (referenceImages && referenceImages.length > 0) {
    prompt += `\n**Reference images:** User has ${referenceImages.length} reference image(s) for style.\n`;
  }

  prompt += `\nOutput a JSON array of blocks. Each block: { "id": "block_1", "type": "...", "label": "...", "config": {...}, "inputs": [] }`;

  return prompt;
}
