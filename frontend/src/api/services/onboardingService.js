/**
 * Onboarding API service
 */
import { post } from "../client.js";
import { API_ENDPOINTS } from "../endpoints.js";

/**
 * Save onboarding data
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} [params.username]
 * @param {string[]} params.platforms
 * @param {Object} [params.business]
 * @param {string[]} [params.goals]
 * @returns {Promise<{success: boolean, id: string}>}
 */
export async function saveOnboarding({ userId, username, platforms, business, goals }) {
  return post(API_ENDPOINTS.ONBOARDING, {
    userId,
    username,
    platforms,
    business,
    goals,
  });
}
