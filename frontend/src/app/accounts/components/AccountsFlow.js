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
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-werbens-dark-cyan">
          Social media accounts
        </h1>
        <p className="mt-2 text-werbens-text/80">
          Add, remove, and manage your connected platforms. Connect at least
          one account to start creating content.
        </p>
        {connectedCount > 0 && (
          <p className="mt-1 text-sm text-werbens-dark-cyan">
            {connectedCount} account{connectedCount !== 1 ? "s" : ""} connected
          </p>
        )}
      </div>

      <div className="space-y-4">
        {PLATFORM_IDS.map((id) => (
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
