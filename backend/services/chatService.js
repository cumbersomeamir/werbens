/**
 * Chat service - handles Gemini chat with memory
 */
import { GoogleGenAI } from "@google/genai";
import { CHAT_CONSTANTS } from "../constants/chat.js";
import { loadHistory, saveHistory, loadSummary, saveSummary } from "./memory.js";

function clip(text, maxChars) {
  if (!text) return "";
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

function safeTextFromResp(resp) {
  const parts = resp?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("").trim();
}

function trimToLastMessages(history) {
  if (history.length > CHAT_CONSTANTS.MAX_MESSAGES) {
    return history.slice(-CHAT_CONSTANTS.MAX_MESSAGES);
  }
  return history;
}

/** Compress older history into summary when it exceeds MAX_MESSAGES */
async function maybeSummarize({ ai, sessionId, history }) {
  if (history.length <= CHAT_CONSTANTS.MAX_MESSAGES) {
    return { history, summary: await loadSummary(sessionId) };
  }

  const existingSummary = await loadSummary(sessionId);
  const overflowCount = history.length - CHAT_CONSTANTS.MAX_MESSAGES;
  const toSummarize = history.slice(0, overflowCount);
  const keep = history.slice(overflowCount);

  const summarizeContents = [];
  if (existingSummary) {
    summarizeContents.push({
      role: "user",
      parts: [{ text: `Existing summary:\n${existingSummary}` }],
    });
  }
  summarizeContents.push({
    role: "user",
    parts: [
      {
        text:
          "Summarize the following conversation history into bullet points of stable facts, preferences, decisions, and open tasks. " +
          "Be concise. Do NOT include chatter.\n\n" +
          JSON.stringify(toSummarize),
      },
    ],
  });

  const resp = await ai.models.generateContent({
    model: CHAT_CONSTANTS.MODEL,
    contents: summarizeContents,
    config: {
      temperature: CHAT_CONSTANTS.SUMMARY_TEMPERATURE,
      maxOutputTokens: CHAT_CONSTANTS.SUMMARY_MAX_TOKENS,
    },
  });

  const newSummary = safeTextFromResp(resp);
  const mergedSummary = existingSummary ? `${existingSummary}\n${newSummary}` : newSummary;
  await saveSummary(sessionId, mergedSummary);
  return { history: keep, summary: mergedSummary };
}

/**
 * Generate chat response using Gemini with memory
 * @param {Object} params
 * @param {string} params.apiKey - Gemini API key
 * @param {string} params.sessionId - Session ID for memory
 * @param {string} params.message - User message
 * @param {string} [params.system] - System prompt/instructions
 * @returns {Promise<{message: string, text: string, usage?: object}>}
 */
export async function generateChatResponse({ apiKey, sessionId, message, system }) {
  const ai = new GoogleGenAI({ apiKey });

  let history = await loadHistory(sessionId);
  history.push({
    role: "user",
    parts: [{ text: clip(message, CHAT_CONSTANTS.MAX_CHARS_PER_MSG) }],
  });
  history = trimToLastMessages(history);

  const { history: compressedHistory, summary } = await maybeSummarize({
    ai,
    sessionId,
    history,
  });

  const contents = [];
  if (system) {
    contents.push({ role: "user", parts: [{ text: `Instruction:\n${clip(system, 800)}` }] });
  }
  if (summary) {
    contents.push({
      role: "user",
      parts: [{ text: `Conversation summary (memory):\n${summary}` }],
    });
  }
  contents.push(...compressedHistory);

  const resp = await ai.models.generateContent({
    model: CHAT_CONSTANTS.MODEL,
    contents,
    config: {
      temperature: CHAT_CONSTANTS.TEMPERATURE,
      maxOutputTokens: CHAT_CONSTANTS.MAX_OUTPUT_TOKENS,
    },
  });

  const text =
    typeof resp?.text === "string"
      ? resp.text
      : safeTextFromResp(resp);

  compressedHistory.push({
    role: "model",
    parts: [{ text: clip(text, 2000) }],
  });
  const finalHistory = trimToLastMessages(compressedHistory);
  await saveHistory(sessionId, finalHistory);

  const usage = resp?.usageMetadata;

  return {
    message: text,
    text,
    usage,
  };
}
