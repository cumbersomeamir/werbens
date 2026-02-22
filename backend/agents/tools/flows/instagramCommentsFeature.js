import { BLOCK_TYPES, HUMAN_TASK_INPUT_TYPES } from "../../constants/blockTypes.js";

export const INSTAGRAM_COMMENTS_AGENT_KEY = "instagram_comments_feature";
export const INSTAGRAM_COMMENTS_FLOW_VERSION = 1;

export const INSTAGRAM_COMMENTS_AGENT_NAME = "Instagram Comments Feature agent";
export const INSTAGRAM_COMMENTS_AGENT_DESCRIPTION =
  "Fixed pipeline: Instagram post link -> image fetch -> reference image + comments -> structured comments -> Nano Banana styled image.";

/**
 * Constant flow blocks for the Instagram comments-to-image app.
 */
export function buildInstagramCommentsFlowBlocks() {
  return [
    {
      id: "instagram_post_link",
      type: BLOCK_TYPES.HUMAN_TASK,
      label: "Instagram Post Link",
      config: {
        inputType: HUMAN_TASK_INPUT_TYPES.URL,
        instruction: "Paste the Instagram post URL",
        outputKey: "instagram_post_url",
      },
      inputs: [],
    },
    {
      id: "instagram_image_download",
      type: BLOCK_TYPES.URL_FETCH,
      label: "Instagram Image Download",
      config: {
        urlKey: "instagram_post_url",
        outputKey: "fetched_image",
        resolveInstagramPostImage: true,
        requireImage: true,
      },
      inputs: ["instagram_post_link"],
    },
    {
      id: "reference_image",
      type: BLOCK_TYPES.HUMAN_TASK,
      label: "Reference Image",
      config: {
        inputType: HUMAN_TASK_INPUT_TYPES.IMAGE,
        instruction: "Upload a reference image for styling",
        outputKey: "reference_image",
      },
      inputs: ["instagram_image_download"],
    },
    {
      id: "top_comments",
      type: BLOCK_TYPES.HUMAN_TASK,
      label: "Top Comments",
      config: {
        inputType: HUMAN_TASK_INPUT_TYPES.TEXT,
        instruction: "Paste the top comments (separated by commas or newlines)",
        outputKey: "top_comments",
      },
      inputs: ["reference_image"],
    },
    {
      id: "structure_comments",
      type: BLOCK_TYPES.LLM,
      label: "Structure Comments",
      config: {
        prompt:
          "You are formatting social comments for image overlay text.\n" +
          "Input comments:\n{{top_comments}}\n\n" +
          "Return short, readable lines only. Keep the original sentiment and language. " +
          "No numbering, no markdown, no intro.",
        outputKey: "structured_comments",
        useMemory: true,
        memoryNamespace: INSTAGRAM_COMMENTS_AGENT_KEY,
        memorySystem:
          "You are the formatting brain for this app. Keep outputs concise, clean, and ready to place on images.",
        memoryAgentKey: INSTAGRAM_COMMENTS_AGENT_KEY,
      },
      inputs: ["top_comments"],
    },
    {
      id: "generate_styled_image",
      type: BLOCK_TYPES.IMAGE_GEN,
      label: "Generate styled image (Nano Banana Pro)",
      config: {
        prompt:
          "Use image 1 as STYLE reference and image 2 as CONTENT base. " +
          "Overlay these comments in a readable and visually balanced layout:\n{{structured_comments}}\n\n" +
          "Output must look polished for Instagram.",
        aspectRatio: "1:1",
      },
      inputs: ["structure_comments"],
    },
  ];
}

export function buildInstagramCommentsAgentDoc({
  userId,
  now = new Date(),
  context = "",
  referenceImageKeys = [],
}) {
  return {
    userId: userId.trim(),
    templateKey: INSTAGRAM_COMMENTS_AGENT_KEY,
    isSystemAgent: true,
    flowVersion: INSTAGRAM_COMMENTS_FLOW_VERSION,
    name: INSTAGRAM_COMMENTS_AGENT_NAME,
    description: INSTAGRAM_COMMENTS_AGENT_DESCRIPTION,
    context,
    referenceImageKeys: Array.isArray(referenceImageKeys) ? referenceImageKeys : [],
    flow: { blocks: buildInstagramCommentsFlowBlocks() },
    createdAt: now,
    updatedAt: now,
  };
}
