"use client";

import { useState } from "react";

const PLATFORM_META = {
  instagram: { name: "Instagram", icon: "📷", color: "bg-pink-500/10" },
  facebook: { name: "Facebook", icon: "👍", color: "bg-blue-500/10" },
  twitter: { name: "X (Twitter)", icon: "𝕏", color: "bg-gray-900/10" },
  linkedin: { name: "LinkedIn", icon: "💼", color: "bg-blue-600/10" },
  youtube: { name: "YouTube", icon: "▶️", color: "bg-red-500/10" },
  tiktok: { name: "TikTok", icon: "🎵", color: "bg-black/10" },
  pinterest: { name: "Pinterest", icon: "📌", color: "bg-red-600/10" },
};

export function AccountCard({
  platformId,
  accounts,
  platformContext,
  onConnect,
  onRemoveAccount,
  onRemoveAll,
  onManage,
  onSaveContext,
  connectLoading,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(platformContext || "");
  const meta = PLATFORM_META[platformId] ?? { name: platformId, icon: "🔗", color: "bg-gray-500/10" };
  const normalizedAccounts = Array.isArray(accounts) ? accounts : [];
  const connected = normalizedAccounts.length > 0;

  return (
    <div
      className={`group relative rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
        connected
          ? "bg-white border border-werbens-light-cyan/30 border-l-[3px] border-l-werbens-light-cyan shadow-elevated hover-lift"
          : "bg-white/60 border border-dashed border-werbens-steel/30 hover:border-werbens-steel/50 hover:bg-white/80"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Platform info */}
        <div className="flex items-center gap-4">
          <div
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl transition-all duration-300 ${
              connected
                ? "bg-gradient-to-br from-werbens-light-cyan/20 to-werbens-dark-cyan/10 ring-2 ring-werbens-light-cyan/20"
                : "bg-werbens-surface ring-1 ring-werbens-steel/20 opacity-60 group-hover:opacity-80"
            }`}
          >
            {meta.icon}
          </div>
          <div className="min-w-0">
            <h3 className={`font-semibold transition-colors duration-200 ${
              connected ? "text-werbens-text" : "text-werbens-muted"
            }`}>
              {meta.name}
            </h3>
            {connected ? (
              <p className="mt-0.5 text-sm text-werbens-dark-cyan/80 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {normalizedAccounts.length} connected
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-werbens-muted/70">
                Not connected
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={() => onConnect(platformId)}
            disabled={connectLoading}
            className="rounded-lg bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:glow-sm focus-ring disabled:opacity-70 disabled:pointer-events-none"
          >
            {connectLoading ? "Connecting…" : (connected ? "Add another account" : "Add account")}
          </button>
          {connected && (
            <button
              type="button"
              onClick={() => onManage(platformId)}
              className="rounded-lg border border-werbens-steel/20 bg-transparent px-4 py-2 text-sm font-medium text-werbens-text/80 transition-all duration-200 hover:border-werbens-dark-cyan/30 hover:text-werbens-dark-cyan hover:bg-werbens-light-cyan/5 focus-ring"
            >
              Manage
            </button>
          )}
        </div>
      </div>

      {/* Current Context (only for connected platforms) */}
      {connected && (
        <div className="mt-4 pt-4 border-t border-werbens-steel/10">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-werbens-dark-cyan/90 uppercase tracking-wide">Current Context</span>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setEditValue(platformContext || "");
                  setIsEditing(true);
                }}
                className="rounded-lg border border-werbens-steel/20 bg-white/60 px-3 py-1.5 text-xs font-medium text-werbens-text/80 transition-all duration-200 hover:border-werbens-dark-cyan/30 hover:text-werbens-dark-cyan hover:bg-werbens-light-cyan/5 focus-ring"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onSaveContext) onSaveContext(platformId, editValue);
                    setIsEditing(false);
                  }}
                  className="rounded-lg bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan px-3 py-1.5 text-xs font-semibold text-white transition-all hover:shadow-md focus-ring"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditValue(platformContext || "");
                    setIsEditing(false);
                  }}
                  className="rounded-lg border border-werbens-steel/20 px-3 py-1.5 text-xs font-medium text-werbens-muted hover:text-werbens-text focus-ring"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          {isEditing ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-werbens-steel/20 bg-werbens-mist/30 px-4 py-3 text-sm text-werbens-text placeholder:text-werbens-muted/50 focus:outline-none focus:border-werbens-dark-cyan focus:ring-2 focus:ring-werbens-dark-cyan/20"
              placeholder="Context extracted from this platform..."
            />
          ) : (
            <p className="text-sm text-werbens-muted leading-relaxed whitespace-pre-wrap">
              {platformContext || "No context yet. Run Update Context to extract."}
            </p>
          )}
        </div>
      )}

      {/* Connected accounts list */}
      {connected && (
        <div className="mt-4 space-y-2">
          {normalizedAccounts.map((acct) => (
            <div
              key={acct.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-werbens-steel/10 bg-werbens-mist/20 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-werbens-text truncate">
                  {acct.username || "Connected"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:shrink-0">
                <button
                  type="button"
                  onClick={() => onManage(platformId)}
                  className="rounded-lg border border-werbens-steel/20 bg-white/60 px-3 py-1.5 text-xs font-medium text-werbens-text/80 transition-all duration-200 hover:border-werbens-dark-cyan/30 hover:text-werbens-dark-cyan hover:bg-werbens-light-cyan/5 focus-ring"
                >
                  Manage
                </button>
                {!!onRemoveAccount && (
                  <button
                    type="button"
                    onClick={() => onRemoveAccount(platformId, acct)}
                    className="rounded-lg border border-transparent bg-white/60 px-3 py-1.5 text-xs font-medium text-werbens-muted transition-all duration-200 hover:text-red-500 hover:bg-red-50 hover:border-red-100 focus-ring"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          {!!onRemoveAll && normalizedAccounts.length > 1 && (
            <button
              type="button"
              onClick={() => onRemoveAll(platformId)}
              className="text-xs text-werbens-muted hover:text-red-600 hover:underline mt-2"
            >
              Remove all {meta.name} accounts
            </button>
          )}
        </div>
      )}
    </div>
  );
}
