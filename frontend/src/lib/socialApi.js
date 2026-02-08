const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function getSocialAccounts(userId) {
  if (!userId) return { accounts: [] };
  const res = await fetch(
    `${API_BASE}/api/social/accounts?userId=${encodeURIComponent(userId)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { accounts: data.accounts || [], error: data.error };
  return data;
}

export async function getXAuthUrl(userId) {
  if (!userId) throw new Error("Not signed in");
  const res = await fetch(
    `${API_BASE}/api/social/x/auth-url?userId=${encodeURIComponent(userId)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to get auth URL");
  return data.url;
}

export async function getYoutubeAuthUrl(userId) {
  if (!userId) throw new Error("Not signed in");
  const res = await fetch(
    `${API_BASE}/api/social/youtube/auth-url?userId=${encodeURIComponent(userId)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to get auth URL");
  return data.url;
}

export async function getLinkedInAuthUrl(userId) {
  if (!userId) throw new Error("Not signed in");
  const res = await fetch(
    `${API_BASE}/api/social/linkedin/auth-url?userId=${encodeURIComponent(userId)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to get auth URL");
  return data.url;
}

export async function getPinterestAuthUrl(userId) {
  if (!userId) throw new Error("Not signed in");
  const res = await fetch(
    `${API_BASE}/api/social/pinterest/auth-url?userId=${encodeURIComponent(userId)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to get auth URL");
  return data.url;
}

export async function disconnectAccount(userId, platform) {
  if (!userId || !platform) throw new Error("Missing userId or platform");
  const res = await fetch(
    `${API_BASE}/api/social/accounts/${encodeURIComponent(platform)}?userId=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to disconnect");
  return data;
}

export async function getSocialAnalytics(userId) {
  if (!userId) return { data: [] };
  const res = await fetch(
    `${API_BASE}/api/social/analytics?userId=${encodeURIComponent(userId)}`
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { data: [], error: json.error };
  return json;
}

export async function syncSocialPlatform(userId, platform) {
  if (!userId || !platform) throw new Error("Missing userId or platform");
  const url =
    platform === "x"
      ? `${API_BASE}/api/social/x/sync`
      : platform === "youtube"
        ? `${API_BASE}/api/social/youtube/sync`
        : platform === "linkedin"
          ? `${API_BASE}/api/social/linkedin/sync`
          : platform === "pinterest"
            ? `${API_BASE}/api/social/pinterest/sync`
            : `${API_BASE}/api/social/${platform}/sync`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Sync failed");
  return data;
}
