# X (Twitter) integration setup

This doc is for **platform 1 of N**: X (Twitter). Use it to get API keys and wire the backend so users can connect their X account and we can read profile + tweets and store them in the **Social Media** collection.

---

## 1. Create an X Developer app

1. Go to [developer.x.com](https://developer.x.com) and sign in (or create a developer account).
2. Create a **Project** and an **App** (or use an existing app).
3. In the app’s **Settings**:
   - **User authentication set up**: turn **on**.
   - **App permissions**: choose **Read and write** (or **Read** only if you don’t need posting yet).
   - **Type of App**: choose **Web App, Automated App or Bot** (confidential client) so you get a **Client Secret**.
4. Under **User authentication set up** → **OAuth 2.0**:
   - **Callback URI / Redirect URL**: must match exactly what your backend uses.
     - Local: `http://localhost:8080/api/social/x/callback`
     - Production: `https://<your-backend-host>/api/social/x/callback`
   - **Website URL**: your frontend URL (e.g. `http://localhost:3000` or your production frontend).
5. In **Keys and tokens**:
   - Copy **Client ID** (OAuth 2.0).
   - Generate / copy **Client Secret** (OAuth 2.0).

---

## 2. Backend environment variables

In `backend/.env` (or wherever your backend reads env from), set:

```env
# X (Twitter) OAuth 2.0 – required for “Connect X” to work
X_CLIENT_ID=your_client_id_here
X_CLIENT_SECRET=your_client_secret_here

# Callback URL – must match exactly what you set in the X Developer Portal
X_CALLBACK_URL=http://localhost:8080/api/social/x/callback

# Where to send the user after successful connection (frontend)
FRONTEND_URL=http://localhost:3000
```

- **X_CLIENT_ID** and **X_CLIENT_SECRET**: from the app’s Keys and tokens.
- **X_CALLBACK_URL**: same string as “Callback URI” in the X app (e.g. `http://localhost:8080/api/social/x/callback` for local).
- **FRONTEND_URL**: base URL of your Next.js app; after connecting X we redirect to `FRONTEND_URL/accounts?connected=x`.

---

## 3. MongoDB collections used

- **SocialAccounts**  
  One document per user per platform. For X we store: `userId`, `platform: "x"`, `accessToken`, `refreshToken`, `platformUserId`, `username`, `displayName`, `profileImageUrl`, `connectedAt`, `updatedAt`.  
  Tokens are stored in plain text in this implementation; for production you should encrypt them at rest.

- **SocialMedia**  
  One document per user per platform for **read** data. For X we store: `userId`, `platform: "x"`, `profile` (id, username, name, profile_image_url), `posts` (recent tweets with id, text, created_at, public_metrics), `lastFetchedAt`, `updatedAt`.  
  So “folder by platform” is represented as `platform: "x"` (and later `"instagram"`, etc.) inside the **SocialMedia** collection.

---

## 4. Flow summary

1. User clicks **Add account** on X (Twitter) on the Accounts page.
2. Frontend calls backend `GET /api/social/x/auth-url?userId=<current_user_id>` and gets a URL.
3. User is redirected to X, signs in and authorizes the app.
4. X redirects to `X_CALLBACK_URL` with `?code=...&state=...`.
5. Backend exchanges `code` for access + refresh token, fetches X user profile and recent tweets, then:
   - Upserts **SocialAccounts** for this user + platform `x`.
   - Upserts **SocialMedia** for this user + platform `x` with profile and posts.
6. Backend redirects to `FRONTEND_URL/accounts?connected=x`.
7. Frontend shows success and refetches the list of connected accounts.

---

## 5. Scopes we request

- `tweet.read` – read tweets (for saving to SocialMedia).
- `users.read` – read authenticated user profile.
- `offline.access` – so we get a refresh token and can get new access tokens without the user re-authorizing.

When you add **posting**, you’ll need to request `tweet.write` and ensure the app has “Read and write” permissions in the X Developer Portal.

---

## 6. Next platforms

Other platforms (Instagram, YouTube, Reddit, etc.) will each have their own:

- Env vars (e.g. `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, callback URL).
- OAuth or similar flow.
- Data we read (profile, posts) and how we store it under **SocialMedia** with a `platform` field (e.g. `instagram`, `youtube`, `reddit`).

We’ll add them one by one; each will need its own setup doc and API keys from you.
