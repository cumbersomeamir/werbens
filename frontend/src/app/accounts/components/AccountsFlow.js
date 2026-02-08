"use client";

import { useState, useEffect } from "react";
import { AccountsLayout } from "./AccountsLayout";
import { AccountCard } from "./AccountCard";
import { ManageAccountModal } from "./ManageAccountModal";

const PLATFORM_IDS = [
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "youtube",
  "tiktok",
  "pinterest",
];

const STORAGE_KEY = "werbens-connected-accounts";

function loadAccounts() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAccounts(accounts) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {}
}

export function AccountsFlow() {
  const [accounts, setAccounts] = useState({});
  const [managePlatform, setManagePlatform] = useState(null);

  useEffect(() => {
    setAccounts(loadAccounts());
  }, []);

  const handleConnect = (platformId) => {
    setAccounts((prev) => {
      const next = {
        ...prev,
        [platformId]: { username: null, connectedAt: new Date().toISOString() },
      };
      saveAccounts(next);
      return next;
    });
  };

  const handleRemove = (platformId) => {
    setAccounts((prev) => {
      const next = { ...prev };
      delete next[platformId];
      saveAccounts(next);
      return next;
    });
    if (managePlatform === platformId) setManagePlatform(null);
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
        {connectedCount > 0 && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-werbens-light-cyan/15 px-3 py-1 text-xs font-semibold text-werbens-dark-cyan ring-1 ring-werbens-light-cyan/25">
            <span className="h-1.5 w-1.5 rounded-full bg-werbens-light-cyan animate-pulse-glow" />
            {connectedCount} connected
          </span>
        )}
      </div>

      <div className="space-y-4 sm:space-y-5">
        {PLATFORM_IDS.map((id, i) => (
          <AccountCard
            key={id}
            platformId={id}
            isConnected={!!accounts[id]}
            username={accounts[id]?.username}
            onConnect={handleConnect}
            onRemove={handleRemove}
            onManage={handleManage}
          />
        ))}
      </div>

      {managePlatform && (
        <ManageAccountModal
          platformId={managePlatform}
          onClose={() => setManagePlatform(null)}
        />
      )}
    </AccountsLayout>
  );
}
