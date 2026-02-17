/**
 * Prompt for AI to generate flow from user's agent description
 */
import { BLOCK_TYPES, HUMAN_TASK_INPUT_TYPES } from "../constants/blockTypes.js";

export const FLOW_GENERATOR_SYSTEM = `You are a flow designer for a content creation platform. Given a user's description of an app/service they want, you must output a JSON flow (array of blocks) that achieves the desired output.

## Available block types

**Platform blocks (automated):**
- ${BLOCK_TYPES.LLM}: Text generation, structuring, filtering. Config: { prompt: string (use {{var}} for inputs), outputKey: string }
- ${BLOCK_TYPES.IMAGE_GEN}: Image generation (Nano Banana Pro). Receives: reference_image (style), fetched_image (content from url_fetch), and prompt. Config: { prompt: string, aspectRatio?: "1:1"|"16:9"|"9:16" }
- ${BLOCK_TYPES.URL_FETCH}: Download content from URL (e.g. image). Config: { urlKey?: string (context key), outputKey?: string }
- ${BLOCK_TYPES.POST}: Post to social (not implemented yet - avoid)

**Human blocks (user provides input):**
- ${BLOCK_TYPES.HUMAN_TASK}: User must provide input. Config: { inputType: string, instruction: string, outputKey: string, useLlmToStructure?: boolean, structurePrompt?: string }

Human input types: ${Object.values(HUMAN_TASK_INPUT_TYPES).join(", ")}

## CRITICAL - You MUST include these blocks when relevant

- **LLM block**: REQUIRED when the flow involves comments, text, or any content that needs structuring, filtering, or formatting. The LLM processes user input before image generation.
- **image_gen (Nano Banana Pro) block**: REQUIRED when the flow produces a final image, styled output, or "comments to image". This is the platform's image generation—without it there is NO output.

## Rules

1. Use human blocks ONLY for what the platform cannot do (e.g. pasting comments, providing a link, uploading an image).
2. Create a SEQUENTIAL flow: blocks execute one after another. Each block (except the first) must list the previous block(s) in inputs.
3. Chain blocks: each block can reference outputs from previous blocks via {{outputKey}}.
4. Output ONLY a raw JSON array. No markdown code blocks (no \`\`\`), no explanation, no text before or after.
5. Each block needs: id (unique, e.g. "block_1"), type, label, config, inputs (array of block ids this depends on).
6. Human task: ALWAYS set inputType explicitly—"url" for links, "text" for comma-separated lists (e.g. comments), "image" for reference images. Never use "Optional" in labels. Reference image: use outputKey "reference_image". Comments: use outputKey "comments" or "top_comments".
7. **Comments-to-image flow ORDER (strict)**: human(url,outputKey:"url") → url_fetch(urlKey:"url",outputKey:"fetched_image") → human(image,outputKey:"reference_image") → human(text,outputKey:"comments") → llm(prompt with {{comments}}, outputKey:"structured_comments") → image_gen. The image_gen receives: reference_image (style), fetched_image (content), and prompt with {{structured_comments}}.
8. **image_gen prompt MUST say**: "First image is the STYLE REFERENCE - match this aesthetic. Second image is the CONTENT from Instagram - use as base. Overlay these comments: {{structured_comments}}"
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

  prompt += `\nOutput ONLY a raw JSON array (no \`\`\`json, no markdown). Example: [{"id":"block_1","type":"human_task","label":"Get URL","config":{"inputType":"url","instruction":"Paste the post URL","outputKey":"url"},"inputs":[]}]`;

  return prompt;
}
