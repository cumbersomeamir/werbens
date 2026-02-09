/**
 * Onboarding model - data structure definitions
 */

export const OnboardingSchema = {
  userId: String,
  username: String,
  platforms: Array,
  business: Object,
  goals: Array,
  completedAt: Date,
  updatedAt: Date,
};
