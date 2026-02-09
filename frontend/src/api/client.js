/**
 * Centralized API client with error handling and interceptors
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(
        data.error || data.message || "Request failed",
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
      error.message || "Network error",
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
 * DELETE request
 */
export async function del(url, options = {}) {
  return apiRequest(url, { ...options, method: "DELETE" });
}

export { ApiError };
export { API_BASE };
