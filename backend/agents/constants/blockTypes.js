/**
 * Block types available in agent flows.
 * Each block maps to a platform capability or a human task.
 */
export const BLOCK_TYPES = {
  /** LLM - text generation, structuring, filtering */
  LLM: "llm",
  /** Image generation via Nano Banana Pro */
  IMAGE_GEN: "image_gen",
  /** Social media posting */
  POST: "post",
  /** Human-in-the-loop: user provides input */
  HUMAN_TASK: "human_task",
  /** URL fetch / download (e.g. image from URL) */
  URL_FETCH: "url_fetch",
};

/** Human task input types */
export const HUMAN_TASK_INPUT_TYPES = {
  TEXT: "text",
  URL: "url",
  IMAGE: "image",
  /** Multiple URLs (e.g. post link + comments) */
  URLS: "urls",
  /** Free-form: user pastes whatever */
  FREEFORM: "freeform",
};

/** Available platform services for flow generation */
export const PLATFORM_SERVICES = [
  { id: BLOCK_TYPES.LLM, label: "LLM", description: "Text generation, structuring, filtering" },
  { id: BLOCK_TYPES.IMAGE_GEN, label: "Image Generation", description: "Nano Banana Pro - create images from prompts" },
  { id: BLOCK_TYPES.POST, label: "Post to Social", description: "Publish to connected platforms" },
  { id: BLOCK_TYPES.URL_FETCH, label: "URL Fetch", description: "Download content from URL (e.g. image)" },
];
