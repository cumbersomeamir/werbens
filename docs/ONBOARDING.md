# Onboarding Page — Design & Data Model

## Overview

The onboarding flow collects user and business data, with platform connection as the only required step. Users can skip optional steps and complete them later without data discrepancy.

---

## Structure

```
app/onboarding/
├── page.js              # Renders OnboardingFlow only
└── components/
    ├── OnboardingFlow.js    # Orchestrates steps and state
    ├── OnboardingLayout.js  # Layout with skip + progress
    ├── PlatformStep.js      # Step 1: Connect platforms (required)
    ├── BusinessInfoStep.js  # Step 2: Business details (optional)
    └── GoalsStep.js         # Step 3: Content goals (optional)
```

---

## Flow

| Step | Name        | Required | Skip |
|------|-------------|----------|------|
| 1    | Platforms   | Yes (≥1) | Global skip only |
| 2    | Business    | No       | Yes |
| 3    | Goals       | No       | Yes |

- **Platform step**: User must connect at least one platform (Instagram, Facebook, X, LinkedIn, YouTube, TikTok, Pinterest) before continuing.
- **Business step**: Optional. User can skip; data is still captured if they partially fill.
- **Goals step**: Optional. User can skip or select content types they want to create.

---

## Data Model (Onboarding collection in MongoDB)

```js
{
  _id: ObjectId,
  userId: string | null,      // NextAuth id or Firebase uid
  username: string | null,    // email, phone, or name
  platforms: ["instagram", "youtube"],  // at least 1 required
  business: {
    businessName: string,
    businessType: string,
    website: string
  } | null,
  goals: ["social", "ads", ...] | [],
  completedAt: Date,
  updatedAt: Date
}
```

- **userId / username**: From NextAuth session or Firebase auth. Null if user not logged in.
- **Platforms**: Array of connected platform IDs. Must have length ≥ 1.
- **Business**: Null if skipped; otherwise object with optional fields.
- **Goals**: Array of goal IDs; empty if skipped.

---

## Skip Behavior

- **Global skip**: Header "Skip for now" → redirects to `/`. Pre-production only; will be removed at launch.
- **Step skip**: Business and Goals steps have "Skip" buttons. Data entered before skip is still saved.
- **Adding platforms later**: When backend is integrated, a "Add platform" flow will append to `platforms` without invalidating onboarding completion.

---

## Discrepancy Prevention

- All step data is captured (even on skip) before moving forward.
- Partial business info (e.g. only name) is valid.
- Platform connection is the sole gate; business and goals can be filled later.
- Backend persistence will use upsert/merge so adding platforms or updating business info does not overwrite existing data incorrectly.
