import crypto from "crypto";
import { getDb } from "../../db.js";
import { upsertUser } from "../../lib/users.js";

const PINTEREST_AUTH_URL = "https://www.pinterest.com/oauth/";
const PINTEREST_TOKEN_URL = "https://api.pinterest.com/v5/oauth/token";
const PINTEREST_API_BASE = "https://api.pinterest.com/v5";
const SCOPES = ["user_accounts:read", "boards:read", "pins:read"];
const STATE_TTL_MS = 10 * 60 * 1000;

const stateStore = new Map();

function pruneStates() {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > STATE_TTL_MS) stateStore.delete(state);
  }
}

function getBasicAuth(clientId, clientSecret) {
  return "Basic " + Buffer.from(`${clientId}:${clientSecret || ""}`).toString("base64");
}

/** Fetch user account, then boards, then pins from first few boards. */
async function fetchPinterestData(accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const userRes = await fetch(`${PINTEREST_API_BASE}/user_account`, { headers });
  if (!userRes.ok) return null;
  const userData = await userRes.json();
  const account = userData?.data ?? userData; // v5 may wrap in .data
  const profile = {
    id: account.id ?? account.username,
    username: account.username ?? null,
    profile_image: account.profile_image ?? null,
    account_type: account.account_type ?? null,
    website_url: account.website_url ?? null,
    business_name: account.business_name ?? null,
  };
  let boards = [];
  const boardsRes = await fetch(`${PINTEREST_API_BASE}/boards?page_size=25`, { headers });
  if (boardsRes.ok) {
    const boardsData = await boardsRes.json();
    const boardItems = boardsData?.items ?? boardsData?.data ?? [];
    boards = (Array.isArray(boardItems) ? boardItems : []).map((b) => ({
      id: b.id,
      name: b.name ?? "",
      description: b.description ?? null,
      pin_count: b.pin_count ?? 0,
    }));
  }
  let pins = [];
  for (const board of boards.slice(0, 5)) {
    const pinsRes = await fetch(`${PINTEREST_API_BASE}/boards/${encodeURIComponent(board.id)}/pins?page_size=25`, { headers });
    if (pinsRes.ok) {
      const pinsData = await pinsRes.json();
      const pinItems = pinsData?.items ?? pinsData?.data ?? [];
      const items = (Array.isArray(pinItems) ? pinItems : []).map((p) => ({
        id: p.id,
        link: p.link ?? null,
        title: p.title ?? null,
        description: p.description ?? null,
        dominant_color: p.dominant_color ?? null,
        media: p.media ?? null,
        board_id: board.id,
      }));
      pins.push(...items);
    }
  }
  pins = pins.slice(0, 50);
  return { profile, boards, pins };
}

export function getPinterestAuthUrl(req, res) {
  const userId = req.query.userId;
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" });
  }
  const clientId = process.env.PINTEREST_APP_ID || process.env.PINTEREST_CLIENT_ID;
  const redirectUri = process.env.PINTEREST_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return res.status(503).json({
      error: "Pinterest integration is not configured. Set PINTEREST_APP_ID and PINTEREST_CALLBACK_URL.",
    });
  }
  pruneStates();
  const state = crypto.randomUUID();
  stateStore.set(state, { userId: userId.trim(), createdAt: Date.now() });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(","),
    state,
  });
  res.json({ url: `${PINTEREST_AUTH_URL}?${params.toString()}` });
}

export async function pinterestCallback(req, res) {
  const { code, state } = req.query;
  const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";
  if (!code || !state) {
    return res.redirect(`${frontendBase}/accounts?error=missing_params`);
  }
  const data = stateStore.get(state);
  stateStore.delete(state);
  if (!data) {
    return res.redirect(`${frontendBase}/accounts?error=invalid_state`);
  }
  const userId = data.userId;
  const clientId = process.env.PINTEREST_APP_ID || process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_APP_SECRET || process.env.PINTEREST_CLIENT_SECRET;
  const redirectUri = process.env.PINTEREST_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return res.redirect(`${frontendBase}/accounts?error=server_config`);
  }
  try {
    const tokenRes = await fetch(PINTEREST_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: getBasicAuth(clientId, clientSecret),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: redirectUri,
      }).toString(),
    });
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Pinterest token exchange failed:", tokenRes.status, errText);
      return res.redirect(`${frontendBase}/accounts?error=token_exchange`);
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;
    const pinData = await fetchPinterestData(accessToken);
    if (!pinData || !pinData.profile) {
      return res.redirect(`${frontendBase}/accounts?error=user_fetch`);
    }
    const db = await getDb();
    const displayName = pinData.profile.username || pinData.profile.business_name || "Pinterest";
    await upsertUser({ userId, username: displayName });
    const accountsColl = db.collection("SocialAccounts");
    const now = new Date();
    const channelId = String(pinData.profile.id || pinData.profile.username || "pinterest");
    await accountsColl.updateOne(
      { userId, platform: "pinterest" },
      {
        $set: {
          userId,
          platform: "pinterest",
          accessToken,
          refreshToken,
          platformUserId: channelId,
          username: displayName,
          displayName: "Pinterest",
          profileImageUrl: pinData.profile.profile_image ?? null,
          updatedAt: now,
        },
        $setOnInsert: { connectedAt: now },
      },
      { upsert: true }
    );
    const socialColl = db.collection("SocialMedia");
    const usersColl = db.collection("Users");
    const userDoc = await usersColl.findOne({ userId });
    const appUsername = userDoc?.username || displayName;
    await socialColl.updateOne(
      { userId, platform: "pinterest", channelId },
      {
        $set: {
          userId,
          username: appUsername,
          platform: "pinterest",
          channelId,
          profile: pinData.profile,
          boards: pinData.boards,
          pins: pinData.pins,
          lastFetchedAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
    return res.redirect(`${frontendBase}/accounts?connected=pinterest`);
  } catch (err) {
    console.error("Pinterest callback error:", err);
    return res.redirect(`${frontendBase}/accounts?error=callback`);
  }
}

/** POST /api/social/pinterest/sync — re-fetch user, boards, pins. */
export async function syncPinterest(req, res) {
  const userId = (req.body?.userId ?? req.query?.userId)?.trim();
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  const db = await getDb();
  const accountsColl = db.collection("SocialAccounts");
  const account = await accountsColl.findOne({ userId, platform: "pinterest" });
  if (!account?.accessToken) {
    return res.status(404).json({ error: "Pinterest account not connected for this user" });
  }
  const pinData = await fetchPinterestData(account.accessToken);
  if (!pinData || !pinData.profile) {
    return res.status(502).json({ error: "Failed to fetch data from Pinterest" });
  }
  const channelId = String(pinData.profile.id || pinData.profile.username || "pinterest");
  const usersColl = db.collection("Users");
  const userDoc = await usersColl.findOne({ userId });
  const appUsername = userDoc?.username || pinData.profile.username || "Pinterest";
  const socialColl = db.collection("SocialMedia");
  const now = new Date();
  await socialColl.updateOne(
    { userId, platform: "pinterest", channelId },
    {
      $set: {
        userId,
        username: appUsername,
        platform: "pinterest",
        channelId,
        profile: pinData.profile,
        boards: pinData.boards,
        pins: pinData.pins,
        lastFetchedAt: now,
        updatedAt: now,
      },
    },
    { upsert: true }
  );
  return res.json({ ok: true, platform: "pinterest" });
}
