"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AccountsLayout } from "./AccountsLayout";
import { AccountCard } from "./AccountCard";
import { ManageAccountModal } from "./ManageAccountModal";
import Link from "next/link";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import { getSocialAccounts, getXAuthUrl, getYoutubeAuthUrl, getLinkedInAuthUrl, disconnectAccount } from "@/lib/socialApi";

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
  const [accounts, setAccounts] = useState({});
  const [managePlatform, setManagePlatform] = useState(null);
  const [connectLoading, setConnectLoading] = useState(null);
  const [message, setMessage] = useState(null);

  const loadAccounts = useCallback(async () => {
    if (!userId) {
      setAccounts({});
      return;
    }
    const { accounts: list } = await getSocialAccounts(userId);
    const byFrontendId = {};
    for (const a of list) {
      const frontendId = FRONTEND_PLATFORM_MAP[a.platform] ?? a.platform;
      byFrontendId[frontendId] = {
        username: a.username ?? a.displayName,
        connectedAt: a.connectedAt,
      };
    }
    setAccounts(byFrontendId);
  }, [userId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) {
      const label = connected === "x" ? "X (Twitter)" : connected === "youtube" ? "YouTube" : connected === "linkedin" ? "LinkedIn" : connected;
      setMessage({ type: "success", text: `${label} connected successfully.` });
      loadAccounts();
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (error) {
      setMessage({
        type: "error",
        text: error === "invalid_state" ? "Connection expired. Try again." : "Connection failed. Try again.",
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
    setMessage({ type: "info", text: "Coming soon." });
  };

  const handleRemove = async (platformId) => {
    const backendPlatform = BACKEND_PLATFORM_MAP[platformId] ?? platformId;
    if (!userId) return;
    try {
      await disconnectAccount(userId, backendPlatform);
      setAccounts((prev) => {
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

  const handleManage = (platformId) => {
    setManagePlatform(platformId);
  };

  const connectedCount = Object.keys(accounts).length;

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
              isConnected={!!accounts[id]}
              username={accounts[id]?.username}
              onConnect={handleConnect}
              onRemove={handleRemove}
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
