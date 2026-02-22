import {
  INSTAGRAM_COMMENTS_AGENT_KEY,
  INSTAGRAM_COMMENTS_AGENT_NAME,
  INSTAGRAM_COMMENTS_AGENT_DESCRIPTION,
  INSTAGRAM_COMMENTS_FLOW_VERSION,
  buildInstagramCommentsFlowBlocks,
} from "../flows/instagramCommentsFeature.js";

export const PREDEFINED_AGENT_TEMPLATES = [
  {
    key: INSTAGRAM_COMMENTS_AGENT_KEY,
    name: INSTAGRAM_COMMENTS_AGENT_NAME,
    description: INSTAGRAM_COMMENTS_AGENT_DESCRIPTION,
    flowVersion: INSTAGRAM_COMMENTS_FLOW_VERSION,
    memorySeed:
      "This agent converts Instagram comments into styled image-ready copy. Preserve meaning and keep overlays concise.",
    buildBlocks: buildInstagramCommentsFlowBlocks,
  },
];

export function getPredefinedAgentTemplate(templateKey) {
  return PREDEFINED_AGENT_TEMPLATES.find((t) => t.key === templateKey) || null;
}
