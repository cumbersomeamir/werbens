import { jsonrepair } from "jsonrepair";
import { runCommonChat } from "../../services/commonChat.js";
import {
  normalizeText,
  parseJsonArrayFromText,
  sanitizeHashtags,
  truncateText,
  hashFingerprint,
} from "../lib/utils.js";

const BANNED_WORDS = ["hate", "kill", "idiot", "stupid", "racist", "nsfw"];
const TEXT_GEN_TIMEOUT_MS = Math.max(5000, Number(process.env.FEEDBACK_TEXT_GEN_TIMEOUT_MS) || 30000);

function containsUnsafeText(text) {
  const lower = String(text || "").toLowerCase();
  return BANNED_WORDS.some((term) => lower.includes(term));
}

function parseVariantsFromResponse(text) {
  const extracted = parseJsonArrayFromText(text);
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

function buildPrompt({ accountHandle, feedbackSummary, recentPosts, variantCount = 4, allowTags = true, allowCta = true }) {
  const compactHistory = (Array.isArray(recentPosts) ? recentPosts : [])
    .slice(0, 8)
    .map((post, idx) => {
      const text = normalizeText(post?.text || "").slice(0, 220);
      const score = Number(post?.engagementRate || 0).toFixed(2);
      return `${idx + 1}. ${text} | engagementRate=${score}%`;
    })
    .join("\n");

  return [
    "You are generating X post variants for an autonomous growth optimizer.",
    `Target account: ${accountHandle || "unknown"}`,
    "Return ONLY valid JSON array. No markdown. No explanation.",
    `Generate exactly ${variantCount} variants with diverse hook styles and tones.`,
    "Constraints:",
    "- Each caption <= 280 chars",
    "- No spammy or toxic language",
    "- Keep content practical and high-signal",
    `- Include CTA only if allowCta=${allowCta ? "true" : "false"}`,
    `- Include hashtags only if allowTags=${allowTags ? "true" : "false"}`,
    "JSON schema per item:",
    "{",
    '  "caption": "string",',
    '  "hookStyle": "question|story|claim|data-point",',
    '  "tone": "friendly|authoritative|playful|educational",',
    '  "ctaType": "follow|reply|share|none",',
    '  "hashtags": ["string"],',
    '  "reasoning": "short string"',
    "}",
    "Performance summary:",
    normalizeText(feedbackSummary || "No historical summary available."),
    "Recent post history:",
    compactHistory || "No post history available.",
  ].join("\n");
}

function extractContextHint(accountContext) {
  const cleaned = normalizeText(accountContext || "");
  if (!cleaned) return "";
  const words = cleaned.split(" ").filter(Boolean).slice(0, 10);
  return words.join(" ");
}

export async function generateTextVariants({
  apiKey,
  accountHandle,
  feedbackSummary,
  recentPosts,
  accountContext = "",
  variantCount = 4,
  allowTags = true,
  allowCta = true,
  excludeFingerprints = [],
}) {
  if (!apiKey) throw new Error("generateTextVariants: apiKey is required");

  const prompt = buildPrompt({
    accountHandle,
    feedbackSummary: [normalizeText(accountContext || ""), normalizeText(feedbackSummary || "")]
      .filter(Boolean)
      .join("\n\n"),
    recentPosts,
    variantCount,
    allowTags,
    allowCta,
  });

  let llm = { text: "", usage: null, error: null };
  try {
    const response = await Promise.race([
      runCommonChat({
        apiKey,
        prompt,
        temperature: 0.8,
        maxOutputTokens: 1400,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Text generation timed out after ${TEXT_GEN_TIMEOUT_MS}ms`)), TEXT_GEN_TIMEOUT_MS)
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

  const parsed = parseVariantsFromResponse(llm?.text || "");
  const excluded = new Set((excludeFingerprints || []).map(String));
  const variants = [];

  for (const row of parsed) {
    const caption = truncateText(row?.caption || "", 280);
    if (!caption || containsUnsafeText(caption)) continue;

    const hashtags = allowTags ? sanitizeHashtags(row?.hashtags || []) : [];
    const ctaType = allowCta ? normalizeText(row?.ctaType || "none").toLowerCase() || "none" : "none";

    const fingerprint = hashFingerprint(
      `${caption.toLowerCase()}|${hashtags.join(",").toLowerCase()}|${ctaType}`
    );
    if (excluded.has(fingerprint)) continue;

    excluded.add(fingerprint);
    variants.push({
      caption,
      hookStyle: normalizeText(row?.hookStyle || "claim") || "claim",
      tone: normalizeText(row?.tone || "educational") || "educational",
      ctaType,
      hashtags,
      reasoning: normalizeText(row?.reasoning || "Variant generated from feedback context."),
      fingerprint,
    });

    if (variants.length >= variantCount) break;
  }

  while (variants.length < variantCount) {
    const idx = variants.length + 1;
    const contextHint = extractContextHint(accountContext);
    const fallbackCaption = truncateText(
      contextHint
        ? `Daily build insight ${idx}: ${contextHint}. We tested one idea today and shared what moved engagement.`
        : `Daily build insight ${idx}: we tested one growth hypothesis today and shared what actually moved engagement. Follow for tomorrow's experiment.`,
      280
    );
    const fingerprint = hashFingerprint(fallbackCaption.toLowerCase());
    if (excluded.has(fingerprint)) continue;
    excluded.add(fingerprint);
    variants.push({
      caption: fallbackCaption,
      hookStyle: "data-point",
      tone: "educational",
      ctaType: "follow",
      hashtags: allowTags ? ["buildinpublic", "growth", "ai"] : [],
      reasoning: "Fallback variant when LLM output is insufficient.",
      fingerprint,
      fallback: true,
    });
  }

  return {
    prompt,
    usage: llm?.usage || null,
    llmError: llm?.error || null,
    variants,
  };
}
