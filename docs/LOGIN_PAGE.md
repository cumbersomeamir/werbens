# Login Page — Vision & Purpose

## Overview

The Werbens login page is the first touchpoint for users. It’s designed to quickly convey what Werbens does and why it matters, while making sign-in straightforward.

---

## Our Vision

**Werbens is for businesses that want to create content without hiring more people.**

We believe:

- Content shouldn’t be a bottleneck. You should be able to scale your marketing without scaling your team.
- AI should handle the heavy lifting: writing copy, generating visuals, and keeping everything on-brand.
- The best content tools are autonomous: you set the strategy, Werbens executes it.

---

## What We’re Building

Werbens helps businesses and product teams:

1. **Create content autonomously** — From social posts to ads to emails, with minimal manual work.
2. **Stay on brand** — Consistent voice, tone, and visuals across all channels.
3. **Move fast** — Go from idea to published content in minutes instead of days.

---

## Login Page Design Intent

The login screen is structured to:

- **Left panel (desktop)** — Highlight value: autonomous content creation, brand consistency, and scale without scaling headcount.
- **Right panel** — A focused, simple sign-in flow so users can start quickly.
- **Mobile** — Compact layout with branding, value statement, and the same form.

---

## Login Fields & Behavior

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| Phone number | Tel | Yes | Primary identifier. User data will be stored in the `Users` MongoDB collection. |
| Apple Login | OAuth | No | Optional social sign-in via Apple. |
| Google Login | OAuth | No | Optional social sign-in via Google. |
| Skip | Link | — | Pre-production only. Lets users bypass login for testing. Will be removed at launch. |

---

## Data Storage (Post-Integration)

When backend integration is complete:

- All login-related data (phone, Apple/Google IDs, timestamps) will be stored in the **`Users`** MongoDB collection.
- Phone numbers will be validated and normalized before storage.
- OAuth tokens will be handled securely and stored in accordance with provider best practices.

---

## Current Status

- **Frontend**: Login page implemented with phone input, Apple/Google buttons, and Skip link.
- **Backend**: Not yet wired. Form submits and OAuth flows are prepared for future API integration.
- **Skip button**: Shown until production launch.

---

## Next Steps

1. Connect frontend to backend authentication API.
2. Implement phone verification (e.g. SMS OTP) if needed.
3. Integrate Apple and Google OAuth.
4. Create and use MongoDB `Users` schema.
5. Remove Skip button and enforce login for production.
