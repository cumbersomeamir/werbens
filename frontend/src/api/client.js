/**
 * Centralized API client with error handling and interceptors
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function normalizeServerErrorMessage(message) {
  const text = String(message || "");
  const lower = text.toLowerCase();
  if (
    lower.includes("gemini_api_key") ||
    lower.includes("missing gemini") ||
    lower.includes("api key not valid") ||
    lower.includes("api key is invalid")
  ) {
    return "Gemini is not configured correctly on backend. Set GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLE_GENAI_API_KEY) and redeploy.";
  }
  return text;
}

function buildClientNetworkErrorMessage(originalMessage) {
  const text = String(originalMessage || "Network error");
  if (typeof window === "undefined") return text;

  const host = String(window.location?.hostname || "").toLowerCase();
  const isLocalHost = host === "localhost" || host === "127.0.0.1";
  const apiLooksLocal = String(API_BASE || "").includes("localhost");

  if (!isLocalHost && apiLooksLocal) {
    return "Client API URL is misconfigured. NEXT_PUBLIC_API_URL points to localhost; set it to your deployed backend URL and redeploy frontend.";
  }

  return text;
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Base API request function with error handling
 */
async function apiRequest(url, options = {}) {
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, config);
    
    // Check content type before parsing JSON
    const contentType = response.headers.get("content-type");
    let data = {};
    
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        const text = await response.text();
        throw new ApiError(
          `Invalid JSON response: ${text.substring(0, 200)}`,
          response.status,
          { raw: text }
        );
      }
    } else {
      const text = await response.text();
      throw new ApiError(
        `Expected JSON but got ${contentType || "unknown"}: ${text.substring(0, 200)}`,
        response.status,
        { raw: text }
      );
    }

    if (!response.ok) {
      throw new ApiError(
        normalizeServerErrorMessage(data.error || data.message || "Request failed"),
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or other errors
    throw new ApiError(
      buildClientNetworkErrorMessage(error.message || "Network error"),
      0,
      { originalError: error }
    );
  }
}

/**
 * GET request
 */
export async function get(url, options = {}) {
  return apiRequest(url, { ...options, method: "GET" });
}

/**
 * POST request
 */
export async function post(url, body, options = {}) {
  return apiRequest(url, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * PUT request
 */
export async function put(url, body, options = {}) {
  return apiRequest(url, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * PATCH request
 */
export async function patch(url, body, options = {}) {
  return apiRequest(url, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request
 */
export async function del(url, options = {}) {
  return apiRequest(url, { ...options, method: "DELETE" });
}

export { ApiError };
export { API_BASE };
