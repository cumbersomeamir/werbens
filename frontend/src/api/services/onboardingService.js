/**
 * Onboarding API service - saves global defaults only.
 * Per-account overrides will live in /accounts Manage later.
 */
import { post } from "../client.js";
import { API_ENDPOINTS } from "../endpoints.js";

/**
 * Save onboarding data (global defaults)
 * @param {Object} params - full onboarding payload (userId required)
 * @returns {Promise<{success: boolean, id: string, onboarding?: object}>}
 */
export async function saveOnboarding(params) {
  return post(API_ENDPOINTS.ONBOARDING, params);
}
