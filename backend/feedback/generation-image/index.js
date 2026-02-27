import { jsonrepair } from "jsonrepair";
import { runCommonChat } from "../../services/commonChat.js";
import { runCommonImage } from "../../services/commonImage.js";
import { uploadImageToS3, getPresignedUrl } from "../../services/s3Service.js";
import { normalizeText, parseJsonArrayFromText, hashFingerprint, truncateText } from "../lib/utils.js";

const IMAGE_PROMPT_TIMEOUT_MS = Math.max(5000, Number(process.env.FEEDBACK_IMAGE_PROMPT_TIMEOUT_MS) || 30000);
const IMAGE_GEN_TIMEOUT_MS = Math.max(5000, Number(process.env.FEEDBACK_IMAGE_GEN_TIMEOUT_MS) || 35000);

function parsePrompts(rawText) {
  const extracted = parseJsonArrayFromText(rawText);
  let parsed;
  try {
    parsed = JSON.parse(extracted);
  } catch {
    try {
      parsed = JSON.parse(jsonrepair(extracted));
    } catch {
      parsed = [];
    }
  }
  return Array.isArray(parsed) ? parsed : [];
}

function mimeFromDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  return match ? match[1] : "image/png";
}

function bufferFromDataUrl(dataUrl) {
  const base64 = String(dataUrl || "").replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  return Buffer.from(base64, "base64");
}

function buildImagePromptRequest({ accountHandle, feedbackSummary, textVariants, variantCount = 2 }) {
  const variantText = (Array.isArray(textVariants) ? textVariants : [])
    .slice(0, 4)
    .map((item, idx) => `${idx + 1}. ${truncateText(item?.caption || "", 180)}`)
    .join("\n");

  return [
    "Generate image prompts for X posts.",
    `Account: ${accountHandle || "unknown"}`,
    `Need exactly ${variantCount} prompts as a JSON array.`,
    "Return only JSON array.",
    "Each object schema:",
    '{"imagePrompt":"string","visualStyle":"string","composition":"string","reasoning":"string"}',
    "Constraints:",
    "- Must be high-contrast for social feed",
    "- Avoid text-heavy designs",
    "- Keep prompts suitable for business/creator growth content",
    "Feedback summary:",
    normalizeText(feedbackSummary || "No feedback summary."),
    "Text candidates:",
    variantText || "No text candidates provided.",
  ].join("\n");
}

export async function generateImageVariants({
  apiKey,
  userId,
  runId,
  accountHandle,
  feedbackSummary,
  textVariants,
  variantCount = 2,
}) {
  if (!apiKey) throw new Error("generateImageVariants: apiKey is required");

  const prompt = buildImagePromptRequest({
    accountHandle,
    feedbackSummary,
    textVariants,
    variantCount,
  });

  let llm = { text: "", usage: null, error: null };
  try {
    const response = await Promise.race([
      runCommonChat({
        apiKey,
        prompt,
        temperature: 0.9,
        maxOutputTokens: 1000,
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Image prompt generation timed out after ${IMAGE_PROMPT_TIMEOUT_MS}ms`)),
          IMAGE_PROMPT_TIMEOUT_MS
        )
      ),
    ]);
    llm = {
      text: response?.text || "",
      usage: response?.usage || null,
      error: null,
    };
  } catch (err) {
    llm = {
      text: "",
      usage: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const promptRows = parsePrompts(llm?.text || "").slice(0, variantCount);
  const variants = [];

  for (let idx = 0; idx < promptRows.length; idx += 1) {
    const row = promptRows[idx] || {};
    const imagePrompt = normalizeText(row?.imagePrompt || row?.prompt || "");
    if (!imagePrompt) continue;

    try {
      const generation = await Promise.race([
        runCommonImage({
          apiKey,
          prompt: imagePrompt,
          aspectRatio: "1:1",
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Image generation timed out after ${IMAGE_GEN_TIMEOUT_MS}ms`)), IMAGE_GEN_TIMEOUT_MS)
        ),
      ]);

      const dataUrl = generation?.image || "";
      if (!dataUrl) continue;

      const mimeType = mimeFromDataUrl(dataUrl);
      const imageBuffer = bufferFromDataUrl(dataUrl);
      const extension = mimeType.includes("jpeg") ? "jpg" : "png";
      const imageKey = `feedback-loop/${userId}/${runId}/variant-${idx + 1}.${extension}`;

      await uploadImageToS3({
        buffer: imageBuffer,
        key: imageKey,
        contentType: mimeType,
      });

      const imageUrl = await getPresignedUrl(imageKey, 3600);

      variants.push({
        imagePrompt,
        visualStyle: normalizeText(row?.visualStyle || "high-contrast social style"),
        composition: normalizeText(row?.composition || "centered subject, clean background"),
        reasoning: normalizeText(row?.reasoning || "Generated from feedback-driven visual exploration."),
        imageKey,
        imageUrl,
        mimeType,
        fingerprint: hashFingerprint(`${imagePrompt}|${row?.visualStyle || ""}|${row?.composition || ""}`),
        usage: generation?.usage || null,
      });
    } catch {
      continue;
    }
  }

  while (variants.length < variantCount) {
    variants.push({
      imagePrompt: "A clean, modern social graphic symbolizing experimentation and growth with cyan accents and strong contrast.",
      visualStyle: "minimal",
      composition: "single focal icon with subtle gradient background",
      reasoning: "Fallback visual candidate when image generation returns fewer variants.",
      imageKey: "",
      imageUrl: "",
      mimeType: "image/png",
      fingerprint: hashFingerprint(`fallback-${variants.length + 1}-${runId}`),
      fallback: true,
      usage: null,
    });
  }

  return {
    prompt,
    usage: llm?.usage || null,
    llmError: llm?.error || null,
    variants,
  };
}
