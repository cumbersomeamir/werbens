"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AccountsLayout } from "./AccountsLayout";
import { AccountCard } from "./AccountCard";
import { ManageAccountModal } from "./ManageAccountModal";
import Link from "next/link";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import { getSocialAccounts, getXAuthUrl, getYoutubeAuthUrl, getLinkedInAuthUrl, getPinterestAuthUrl, getMetaAuthUrl, getInstagramAuthUrl, disconnectAccount } from "@/lib/socialApi";
import { updateContext } from "@/api/services/contextService.js";

const PLATFORM_IDS = [
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "youtube",
  "tiktok",
  "pinterest",
];

const BACKEND_PLATFORM_MAP = { twitter: "x" };
const FRONTEND_PLATFORM_MAP = { x: "twitter" };

export function AccountsFlow() {
  const searchParams = useSearchParams();
  const { userId, loading: userLoading } = useCurrentUser();
  const [accountsByPlatform, setAccountsByPlatform] = useState({});
  const [managePlatform, setManagePlatform] = useState(null);
  const [connectLoading, setConnectLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [contextUpdating, setContextUpdating] = useState(false);

  const loadAccounts = useCallback(async () => {
    if (!userId) {
      setAccountsByPlatform({});
      return;
    }
    const { accounts: list } = await getSocialAccounts(userId);
    const byFrontendId = {};
    const seenKeys = new Set();
    for (const a of list || []) {
      if (!a?.platform) continue;
      const frontendId = FRONTEND_PLATFORM_MAP[a.platform] ?? a.platform;
      if (!byFrontendId[frontendId]) byFrontendId[frontendId] = [];
      const platformUserId = a.platformUserId ?? null;
      const username = a.username ?? a.displayName ?? "";
      const stableKey = `${a.platform}::${platformUserId || username || a.id || "default"}`;
      if (seenKeys.has(stableKey)) {
        // Avoid showing duplicate entries for the same underlying channel/account
        continue;
      }
      seenKeys.add(stableKey);
      const id =
        a.id ??
        a._id ??
        (platformUserId ? `${a.platform}-${platformUserId}` : `${a.platform}-${username || "connected"}`);
      byFrontendId[frontendId].push({
        id,
        backendPlatform: a.platform,
        platformUserId,
        username,
        displayName: a.displayName,
        profileImageUrl: a.profileImageUrl ?? null,
        connectedAt: a.connectedAt,
        updatedAt: a.updatedAt,
        channels: a.channels ?? null,
        source: a.source ?? "socialAccounts",
      });
    }
    // Stable ordering within each platform
    for (const key of Object.keys(byFrontendId)) {
      byFrontendId[key].sort((a, b) => {
        const ua = (a.username || "").toLowerCase();
        const ub = (b.username || "").toLowerCase();
        return ua.localeCompare(ub);
      });
    }
    setAccountsByPlatform(byFrontendId);
  }, [userId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) {
      const label = connected === "x" ? "X (Twitter)" : connected === "youtube" ? "YouTube" : connected === "linkedin" ? "LinkedIn" : connected === "pinterest" ? "Pinterest" : connected === "facebook" ? "Facebook" : connected;
      const text = connected === "facebook" ? "Facebook connected. Your Pages and linked Instagram accounts will appear in Analytics." : connected === "instagram" ? "Instagram connected successfully." : `${label} connected successfully.`;
      setMessage({ type: "success", text });
      loadAccounts();
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (error) {
      let text;
      if (error === "invalid_state") {
        text = "Connection expired. Try again.";
      } else if (error === "no_channels") {
        text = "No YouTube channels found for that Google account. Switch to an account that owns a YouTube channel and try again.";
      } else if (error === "access_denied") {
        text = "Connection was cancelled. No changes were made.";
      } else {
        text = "Connection failed. Try again.";
      }
      setMessage({
        type: "error",
        text,
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, loadAccounts]);

  const handleConnect = async (platformId) => {
    if (platformId === "twitter") {
      if (!userId) {
        setMessage({ type: "error", text: "Sign in to connect accounts." });
        return;
      }
      setConnectLoading("twitter");
      setMessage(null);
      try {
        const url = await getXAuthUrl(userId);
        window.location.href = url;
      } catch (err) {
        setMessage({ type: "error", text: err.message || "Could not start connection." });
        setConnectLoading(null);
      }
      return;
    }
    if (platformId === "youtube") {
      if (!userId) {
        setMessage({ type: "error", text: "Sign in to connect accounts." });
        return;
      }
      setConnectLoading("youtube");
      setMessage(null);
      try {
        const url = await getYoutubeAuthUrl(userId);
        window.location.href = url;
      } catch (err) {
        setMessage({ type: "error", text: err.message || "Could not start connection." });
        setConnectLoading(null);
      }
      return;
    }
    if (platformId === "linkedin") {
      if (!userId) {
        setMessage({ type: "error", text: "Sign in to connect accounts." });
        return;
      }
      setConnectLoading("linkedin");
      setMessage(null);
      try {
        const url = await getLinkedInAuthUrl(userId);
        window.location.href = url;
      } catch (err) {
        setMessage({ type: "error", text: err.message || "Could not start connection." });
        setConnectLoading(null);
      }
      return;
    }
    if (platformId === "pinterest") {
      if (!userId) {
        setMessage({ type: "error", text: "Sign in to connect accounts." });
        return;
      }
      setConnectLoading("pinterest");
      setMessage(null);
      try {
        const url = await getPinterestAuthUrl(userId);
        window.location.href = url;
      } catch (err) {
        setMessage({ type: "error", text: err.message || "Could not start connection." });
        setConnectLoading(null);
      }
      return;
    }
    if (platformId === "facebook") {
      if (!userId) {
        setMessage({ type: "error", text: "Sign in to connect accounts." });
        return;
      }
      setConnectLoading("facebook");
      setMessage(null);
      try {
        const url = await getMetaAuthUrl(userId);
        window.location.href = url;
      } catch (err) {
        setMessage({ type: "error", text: err.message || "Could not start connection." });
        setConnectLoading(null);
      }
      return;
    }
    if (platformId === "instagram") {
      if (!userId) {
        setMessage({ type: "error", text: "Sign in to connect accounts." });
        return;
      }
      setConnectLoading("instagram");
      setMessage(null);
      try {
        const url = await getInstagramAuthUrl(userId);
        window.location.href = url;
      } catch (err) {
        setMessage({ type: "error", text: err.message || "Could not start connection." });
        setConnectLoading(null);
      }
      return;
    }
    setMessage({ type: "info", text: "Coming soon." });
  };

  const handleRemove = async (platformId) => {
    const backendPlatform = BACKEND_PLATFORM_MAP[platformId] ?? platformId;
    if (!userId) return;
    try {
      // Back-compat: if called without an account, disconnect ALL for that platform.
      await disconnectAccount(userId, backendPlatform);
      setAccountsByPlatform((prev) => {
        const next = { ...prev };
        delete next[platformId];
        return next;
      });
      if (managePlatform === platformId) setManagePlatform(null);
      setMessage({ type: "success", text: "Account disconnected." });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to disconnect." });
    }
  };

  const handleRemoveAccount = async (platformId, account) => {
    const backendPlatform = BACKEND_PLATFORM_MAP[platformId] ?? platformId;
    if (!userId) return;
    try {
      const accountId = account?.source === "socialMedia" ? null : account?.id;
      const channelId = account?.source === "socialMedia" ? account?.platformUserId : null;
      await disconnectAccount(userId, backendPlatform, accountId, channelId);
      setAccountsByPlatform((prev) => {
        const current = Array.isArray(prev?.[platformId]) ? prev[platformId] : [];
        const filtered = current.filter((a) => a.id !== account?.id);
        const next = { ...prev };
        if (filtered.length === 0) delete next[platformId];
        else next[platformId] = filtered;
        return next;
      });
      setMessage({ type: "success", text: "Account disconnected." });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to disconnect." });
    }
  };

  const handleManage = (platformId) => {
    setManagePlatform(platformId);
  };

  const handleUpdateContext = async () => {
    if (!userId) {
      setMessage({ type: "error", text: "Sign in to update context." });
      return;
    }
    setContextUpdating(true);
    setMessage(null);
    try {
      await updateContext(userId);
      setMessage({ type: "success", text: "Context updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to update context." });
    } finally {
      setContextUpdating(false);
    }
  };

  const connectedCount = Object.values(accountsByPlatform).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

  return (
    <AccountsLayout>
      <div className="mb-8 sm:mb-10 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-werbens-text">
          Social media{" "}
          <span className="gradient-text">accounts</span>
        </h1>
        <p className="mt-3 text-base sm:text-lg text-werbens-muted max-w-2xl leading-relaxed">
          Connect and manage your platforms in one place. Link at least one
          account to start publishing content.
        </p>
        {!userLoading && !userId && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-werbens-muted">
              Sign in to connect your accounts.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md focus-ring"
            >
              Sign in
            </Link>
          </div>
        )}
        {connectedCount > 0 && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-werbens-light-cyan/15 px-3 py-1 text-xs font-semibold text-werbens-dark-cyan ring-1 ring-werbens-light-cyan/25">
            <span className="h-1.5 w-1.5 rounded-full bg-werbens-light-cyan animate-pulse-glow" />
            {connectedCount} connected
          </span>
        )}
        {userId && (
          <div className="mt-4">
            <button
              onClick={handleUpdateContext}
              disabled={contextUpdating}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-werbens-dark-cyan to-werbens-midnight px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {contextUpdating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating Context...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Update Context
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            message.type === "error"
              ? "bg-red-50 text-red-800 border border-red-100"
              : message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                : "bg-werbens-surface text-werbens-text border border-werbens-steel/20"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {userLoading ? (
        <div className="text-werbens-muted text-sm">Loading…</div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {PLATFORM_IDS.map((id) => (
            <AccountCard
              key={id}
              platformId={id}
              accounts={accountsByPlatform[id] || []}
              onConnect={handleConnect}
              onRemoveAll={handleRemove}
              onRemoveAccount={handleRemoveAccount}
              onManage={handleManage}
              connectLoading={connectLoading === id}
            />
          ))}
        </div>
      )}

      {managePlatform && (
        <ManageAccountModal
          platformId={managePlatform}
          onClose={() => setManagePlatform(null)}
        />
      )}
    </AccountsLayout>
  );
}
