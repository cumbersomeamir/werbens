/**
 * Onboarding model - global defaults only.
 * Per-account overrides will live in /accounts Manage later, not in onboarding.
 */

export const PRIMARY_ROLES = ["founder", "creator", "marketer", "freelancer", "student", "other"];
export const CONTENT_GOALS = ["growAudience", "getLeads", "buildAuthority", "sellProduct", "stayVisible"];
export const PRIORITY_PLATFORMS = ["instagram", "facebook", "x", "linkedin", "youtube", "pinterest", "threads", "reddit", "other"];
export const POSTING_CADENCE = ["low", "medium", "daily"];
export const VISUAL_VIBES = ["minimal", "cinematic", "bold", "cleanCorporate", "playful", "darkMoody", "futuristic", "lifestyle"];
export const VISUAL_THEMES = ["light", "dark", "brandNeutral"];
export const FACE_USAGE = ["myFace", "otherPeople", "noFaces"];
export const FRAMING = ["closeUp", "wide", "mixed"];
export const TONES = ["direct", "professional", "casual", "inspirational", "opinionated"];
export const EMOJI_LEVELS = ["none", "few", "normal", "heavy"];
export const CTA_STYLES = ["never", "soft", "clear"];

export const OnboardingSchema = {
  userId: { type: String, required: true, unique: true },
  primaryRole: String,
  industries: [String], // max 2
  audienceTypes: [String],
  primaryGoal: String,
  secondaryGoal: String,
  priorityPlatform: String,
  postingCadence: String,
  visualVibes: [String], // max 3
  visualTheme: String,
  complexityPreference: Number, // 0..100
  showPeople: Boolean,
  faceUsage: String,
  framing: String,
  tone: String,
  emojiLevel: String,
  ctaStyle: String,
  formality: Number, // 0..100
  version: { type: Number, default: 1 },
  source: { type: String, default: "onboarding_v1" },
  createdAt: Date,
  updatedAt: Date,
};
