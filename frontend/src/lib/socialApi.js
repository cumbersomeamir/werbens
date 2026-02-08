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
