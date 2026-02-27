export function buildGeminiPostFeedback({ textVariants, imageVariants, selection }) {
  return {
    status: "ok",
    textVariantCount: Array.isArray(textVariants) ? textVariants.length : 0,
    imageVariantCount: Array.isArray(imageVariants) ? imageVariants.length : 0,
    selectedMode: selection?.selected?.mode || null,
    rationale: selection?.selected?.textVariant?.reasoning || "Selected based on policy score and constraints.",
  };
}
