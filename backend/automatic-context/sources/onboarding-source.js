/**
 * Onboarding source for automatic context - reuses onboarding-context
 */
import { getOnboardingContext } from "../../onboarding-context/getOnboardingContext.js";

export async function getOnboardingSource(userId) {
  return getOnboardingContext(userId);
}
