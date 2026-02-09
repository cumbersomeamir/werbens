/**
 * Data Collator Gemini - uses Gemini API to summarize and structure context
 */
import { GoogleGenAI } from "@google/genai";
import { readFile } from "fs/promises";
import { collateRawContext, getRawContextFilePath } from "./data-collator-raw.js";

const GEMINI_MODEL = "gemini-2.0-flash";
const PROMPT = `Summarise what the user wants to achieve in general. And also describe it one by one according to platform. 

The final output MUST be a JSON object with exactly these keys:
{
  "general_context": "summary of general goals",
  "instagram_context": "summary for Instagram platform",
  "x_context": "summary for X/Twitter platform",
  "youtube_context": "summary for YouTube platform",
  "linkedin_context": "summary for LinkedIn platform",
  "pinterest_context": "summary for Pinterest platform",
  "facebook_context": "summary for Facebook platform"
}

Return ONLY valid JSON. Include all platforms even if empty (use empty string ""). No other text.`;

/**
 * Parse Gemini response to extract structured context
 * @param {string} responseText
 * @returns {Object} Structured context object
 */
function parseGeminiResponse(responseText) {
  const result = {
    general_context: "",
    instagram_context: "",
    x_context: "",
    youtube_context: "",
    linkedin_context: "",
    pinterest_context: "",
    facebook_context: "",
  };

  // Try to extract JSON-like structure from response
  // Handle various formats: ["key" = "value"], {key: "value"}, key="value", etc.
  
  // Normalize the response text
  let normalized = responseText.trim();
  
  // Try to find JSON object (preferred format)
  const jsonMatch = normalized.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      Object.keys(result).forEach((key) => {
        if (parsed[key] !== undefined) {
          result[key] = String(parsed[key] || "").trim();
        }
      });
      // Validate all keys are present
      const allKeysPresent = Object.keys(result).every(key => parsed.hasOwnProperty(key));
      if (allKeysPresent) {
        return result;
      }
    } catch (e) {
      // Not valid JSON, continue with regex parsing
    }
  }

  // Regex parsing for ["key" = "value"] format
  const keyValuePattern = /["']?(\w+_context)["']?\s*=\s*["']([^"']*)["']/gi;
  let match;
  while ((match = keyValuePattern.exec(normalized)) !== null) {
    const key = match[1];
    const value = match[2] || "";
    if (result.hasOwnProperty(key)) {
      result[key] = value.trim();
    }
  }

  // Also try "general context" = "value" format (with spaces)
  const generalPattern = /["']?general\s+context["']?\s*=\s*["']([^"']*)["']/i;
  const generalMatch = normalized.match(generalPattern);
  if (generalMatch && !result.general_context) {
    result.general_context = generalMatch[1].trim();
  }

  return result;
}

/**
 * Collate and summarize context using Gemini
 * @param {string} userId
 * @returns {Promise<Object>} Structured context object
 */
export async function collateAndSummarizeContext(userId) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  try {
    // Step 1: Collate raw context (creates all-context-raw.txt)
    await collateRawContext(userId);

    // Step 2: Read the raw context file
    const rawContextPath = getRawContextFilePath();
    const rawContextText = await readFile(rawContextPath, "utf-8");

    // Step 3: Call Gemini API (new instance, no memory)
    const client = new GoogleGenAI({ apiKey });

    const fullPrompt = `${PROMPT}\n\nUser Data:\n${rawContextText}`;

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }],
        },
      ],
    });

    // Extract text from response (same pattern as chatService)
    const parts = response?.candidates?.[0]?.content?.parts ?? [];
    const responseText = parts.map((p) => p.text ?? "").join("").trim();
    
    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    // Step 4: Parse and structure the response
    const structuredContext = parseGeminiResponse(responseText);

    // Step 5: Validate all platforms are present
    const requiredKeys = [
      "general_context",
      "instagram_context",
      "x_context",
      "youtube_context",
      "linkedin_context",
      "pinterest_context",
      "facebook_context",
    ];

    const missingKeys = requiredKeys.filter((key) => !structuredContext[key] && structuredContext[key] !== "");
    
    // If any keys are missing, try to extract them again or set empty string
    requiredKeys.forEach((key) => {
      if (!structuredContext.hasOwnProperty(key)) {
        structuredContext[key] = "";
      }
    });

    return structuredContext;
  } catch (err) {
    console.error("Error in collateAndSummarizeContext:", err);
    throw err;
  }
}
