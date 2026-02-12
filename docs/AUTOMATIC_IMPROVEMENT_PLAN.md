# Automatic Content Generation — Implementation Plan

## Executive Summary

After inspecting actual data, the core issues are:

1. **Automatic uses only onboarding** — The Context collection (platform data summarized by Gemini) is never used. Context has real business info (Werbens, Ideaverse AI, etc.) that onboarding lacks.
2. **No platform segregation** — Same generic prompt for all platforms; no platform selector.
3. **Placeholders in prompts** — Onboarding has no product/service specifics; Context has them but we ignore it.
4. **Platform data availability varies** — X: none; Instagram: 25 media; LinkedIn: 0 posts; Facebook: 25 posts; Pinterest: 50 pins. We must handle sparse data gracefully.

---

## Architecture Principles

- **Modular & segregated** — Each module can be toggled or replaced independently.
- **Feedback loop** — Every process outputs inspectable data; run `node scripts/inspect-automatic-data.js [userId]` to validate.
- **Graceful degradation** — When platform returns little/no data, fall back to onboarding + general context.
- **No external scraping** — Integrations only; no browser automation.
- **No iterative prompt refinement** — Single prompt per generation; learning comes from user feedback (future), not from converging prompts.
- **Don't mess with existing functionality** — Add new paths; keep existing flows working.

---

## Phase 1: Data Pipeline (Modular Context for Automatic)

### 1.1 Create `automatic-context` Module

**Location:** `backend/automatic-context/`

**Purpose:** Dedicated module to assemble context for automatic generation. Keeps automatic logic separate from existing `/context` (used for accounts page) and `/onboarding-context`.

**Structure:**
```
backend/automatic-context/
├── index.js              # exports
├── sources/
│   ├── onboarding-source.js   # getOnboardingContext (reuse)
│   ├── platform-source.js     # getPlatformContext (from Context collection)
│   └── raw-platform-source.js # optional: raw SocialMedia per platform when Context is empty
├── collator/
│   ├── collate-automatic-raw.js   # combines onboarding + platform context into raw text
│   └── collate-automatic-gemini.js # uses Gemini to produce structured prompt-ready context
└── getAutomaticContext.js  # main entry: getAutomaticContext(userId, platform?)
```

**Output:** For each call, write to `temp/automatic-context-raw-{userId}.txt` and `temp/automatic-context-structured-{userId}.json` (or similar) so we can inspect.

**Platform parameter:** `getAutomaticContext(userId, platform)` — when `platform` is provided (e.g. `"x"`, `"instagram"`), prioritize that platform's context; when empty, use general + priority platform from onboarding.

### 1.2 Data Sources (What We Have)

| Source | Used for | Available | Notes |
|--------|----------|-----------|-------|
| Onboarding | Preferences, tone, style | Always | No product specifics |
| Context | Platform summaries | After update | Gemini-summarized from raw SocialMedia |
| SocialMedia raw | Posts, media, captions | Per platform | X: 0, IG: 25, FB: 25, LinkedIn: 0, Pinterest: 50 |
| general_onboarding_context | Current automatic input | Always | Onboarding only |

**When platform has no posts:** Use profile + onboarding + general context only. Do not inject empty or fake data.

### 1.3 Collator Logic (Raw → Structured)

**Input:** Onboarding text + platform context (from Context collection) + platform-specific raw SocialMedia (if Context has little data for that platform).

**Gemini prompt:** "Given the user's onboarding preferences and their platform data below, produce a structured JSON: { generalPromptContext, platformPromptContext }." — generalPromptContext = usable for any platform; platformPromptContext = specific to the requested platform (e.g. X, LinkedIn).

**Output:** Store in `AutomaticContext` collection or temp file; return to caller. Log for inspection.

---

## Phase 2: Prompt Generation (Platform-Specific)

### 2.1 Create `automatic-prompts` Module

**Location:** `backend/automatic-prompts/`

**Purpose:** Generate image-generation prompts from structured context. No placeholders; use real data or explicit "no specific product" when missing.

**Structure:**
```
backend/automatic-prompts/
├── index.js
├── templates/
│   ├── base.js           # shared instructions (no placeholders)
│   ├── platform-x.js     # X-specific
│   ├── platform-instagram.js
│   ├── platform-linkedin.js
│   ├── platform-facebook.js
│   └── platform-default.js
└── generatePrompt.js     # main: generatePrompt(userId, platform, apiKey)
```

**Templates:** Each platform template has format/length guidelines. Example: X = short, punchy; LinkedIn = professional, longer. No `[insert X]` placeholders. If product/service is unknown, say "a tech product" or "their product" not "[insert specific product]".

**Flow:** `generatePrompt` calls `getAutomaticContext(userId, platform)` → receives structured context → selects platform template → injects context into template → single Gemini call → returns final image prompt.

**Output:** Log the final prompt (and intermediate context) to a file or collection for inspection.

### 2.2 Platform Selection

**UI:** Add platform selector on `/automatic` page (dropdown or chips). Options: "All" (use priority from onboarding), "X", "Instagram", "LinkedIn", "Facebook", etc. Only show platforms user has connected.

**API:** Extend `POST /api/automatic/generate` to accept `platform` query/body param. When present, use platform-specific prompt.

---

## Phase 3: Onboarding Enhancements (Minimal, Optional)

### 3.1 Optional Product/Business Fields

**Add only if needed:** 1–2 optional fields in onboarding:
- `productOrService` (optional string): "What do you create or sell? e.g. AI tools, custom T-shirts"
- `brandOrBusinessName` (optional string): "What's your brand or business name?"

**Keep onboarding short.** These are optional; if empty, we rely on Context (platform data) to infer.

### 3.2 Platform-Specific Onboarding (Optional)

**Option:** Add a single optional step: "For each platform you use, what's your main focus?" — e.g. `{ x: "AI tips", linkedin: "Career advice" }`. Stored as `platformFocus: { x: string, linkedin: string, ... }`.

**Recommendation:** Start without this. Use platform data first; add only if we see quality issues.

---

## Phase 4: Feedback Loop & Validation

### 4.1 Inspect Script

**Existing:** `scripts/inspect-automatic-data.js`

**Extend:** Add sections for:
- `automatic-context` output (raw + structured)
- `generatePrompt` final prompt
- Platform used

### 4.2 Validation Outputs

Every new process must write its output somewhere inspectable:

| Process | Output Location |
|---------|-----------------|
| automatic-context raw | `temp/automatic-context-raw-{userId}.txt` |
| automatic-context structured | `temp/automatic-context-structured-{userId}.json` |
| generated prompt | `Automatic.items[].prompt` ( existing ) + optional `temp/automatic-prompt-{userId}-{ts}.txt` |

### 4.3 Run-Full-Cycle Script

**New script:** `scripts/run-automatic-cycle.js [userId] [platform]`

**Behavior:**
1. Call `getAutomaticContext(userId, platform)`
2. Call `generatePrompt(userId, platform, apiKey)`
3. Log outputs to console + temp files
4. Optionally call image generation (or stop before that for faster iteration)

**Purpose:** Validate that context + prompt changes improve output before deploying to UI.

---

## Phase 5: UI Changes

### 5.1 Platform Selector

- Add platform dropdown/chips above "Generate" button.
- Default: "General" or "Priority platform" from onboarding.
- Pass `platform` to `generateAutomatic` API.

### 5.2 Store Platform in Automatic Items

- Add `platform` field to each `Automatic.items[]` entry.
- Display platform badge on cards when present.

---

## Implementation Order

1. **Phase 1.1** — Create `automatic-context` module and `getAutomaticContext(userId, platform)`.
2. **Phase 4.1** — Extend inspect script to show automatic-context output.
3. **Phase 2.1** — Create `automatic-prompts` module and `generatePrompt`.
4. **Phase 4.3** — Add `run-automatic-cycle.js` script.
5. **Run cycle** — Execute script, inspect outputs, adjust prompts/templates.
6. **Phase 1.1 integration** — Wire `automaticService` to use `getAutomaticContext` + `generatePrompt` instead of `general_onboarding_context` + single metaPrompt.
7. **Phase 5** — Add platform selector and store platform in items.
8. **Phase 3** — Add optional onboarding fields only if validation shows need.

---

## What We Don't Changed

- `/context` (data-collator-raw, data-collator-gemini) — unchanged
- `/onboarding-context` — unchanged
- `Onboarding` schema — unchanged unless we add optional fields
- `Context` collection — unchanged
- Social sync flows — unchanged
- Existing automatic API contract — extended with optional `platform`, not breaking

---

## Addressing Your Feedback

### 1. "Just changing onboarding and adding new fields is not the problem — validating if choices help is the issue"

**Solution:** We do not change onboarding first. We:
- Use **existing** Context (platform data) that we currently ignore
- Add `run-automatic-cycle.js` to run the full pipeline and inspect outputs
- Compare before/after prompts and images
- Only add onboarding fields if validation shows they improve quality

### 2. "Multi-layer context: what if platform doesn't return enough post data?"

**Solution:** Graceful degradation:
- If platform has posts/media → use them (via Context or raw)
- If platform has profile only (e.g. LinkedIn) → use profile + onboarding + general context
- If platform not connected → use onboarding + general context only
- Never inject fake or placeholder data; use "generic" wording when specific data is missing

### 3. "Platform content analysis: integrations only, no external scraping"

**Solution:** We use only:
- SocialMedia collection (from sync)
- Context collection (Gemini-summarized from SocialMedia)
- Onboarding
No browser automation or external scraping.

### 4. "Iterative prompt refinement leads to convergence — we want to learn from user feedback, not one initial prompt"

**Solution:** Single prompt per generation. No iterative refinement in this plan. User feedback (thumbs up/down, "use this style") is out of scope for Phase 1; we design for it later (e.g. store feedback in Automatic collection, use in future prompt tuning).

### 5. "Platform-specific onboarding: don't make onboarding too comprehensive"

**Solution:** We do not add platform-specific onboarding in Phase 1. We use platform data from integrations. Optional `platformFocus` can be added later only if needed.

---

## Open Questions / Need Your Input

1. **LinkedIn posts:** LinkedIn API does not return user posts in our current sync. Should we add a LinkedIn posts API integration if available? (Requires research.)
2. **X (Twitter):** User has no X connected. Should we still support generating "for X" using onboarding + general context?
3. **Platform selector default:** When user selects "All" or "General", should we use `priorityPlatform` from onboarding or rotate through connected platforms?

---

## File Summary

| New File | Purpose |
|----------|---------|
| `backend/automatic-context/index.js` | Barrel exports |
| `backend/automatic-context/sources/onboarding-source.js` | Reuse getOnboardingContext |
| `backend/automatic-context/sources/platform-source.js` | Read Context collection per platform |
| `backend/automatic-context/sources/raw-platform-source.js` | Raw SocialMedia when Context sparse |
| `backend/automatic-context/collator/collate-automatic-raw.js` | Combine sources |
| `backend/automatic-context/collator/collate-automatic-gemini.js` | Gemini to structure |
| `backend/automatic-context/getAutomaticContext.js` | Main entry |
| `backend/automatic-prompts/index.js` | Barrel exports |
| `backend/automatic-prompts/templates/base.js` | Shared |
| `backend/automatic-prompts/templates/platform-*.js` | Per platform |
| `backend/automatic-prompts/generatePrompt.js` | Main entry |
| `backend/scripts/run-automatic-cycle.js` | Run full cycle for validation |
| `backend/scripts/inspect-automatic-data.js` | (extended) |
