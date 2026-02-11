"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSocialAccounts } from "@/lib/socialApi";


const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "x", label: "X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "youtube", label: "YouTube" },
  { id: "pinterest", label: "Pinterest" },
  { id: "threads", label: "Threads" },
  { id: "reddit", label: "Reddit" },
  { id: "other", label: "Other" },
];

const CADENCE = [
  { id: "low", label: "Low (1–2/week)" },
  { id: "medium", label: "Medium (3–5/week)" },
  { id: "daily", label: "Daily" },
];

function cardClass(selected) {
  return selected
    ? "border-2 border-werbens-light-cyan bg-werbens-light-cyan/25 text-werbens-alt-text font-semibold shadow-[0_0_12px_rgba(127,231,220,0.35)]"
    : "glass-dark border border-werbens-steel/50 text-werbens-alt-text/80 hover:border-werbens-light-cyan/40 hover:bg-werbens-light-cyan/5";
}

export function Step3Platforms({ data, setData, onNext, onBack, userId }) {
  const [connectedCount, setConnectedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setConnectedCount(0);
      setLoading(false);
      return;
    }
    getSocialAccounts(userId)
      .then(({ accounts = [] }) => {
        const total = accounts.reduce((sum, a) => {
          const ch = a.channels && a.channels.length > 0 ? a.channels.length : 1;
          return sum + ch;
        }, 0);
        setConnectedCount(total);
      })
      .catch(() => setConnectedCount(0))
      .finally(() => setLoading(false));
  }, [userId]);

  const canContinue = connectedCount >= 1;

  return (
    <div className="w-full animate-fade-in-up">
      <h1 className="text-2xl sm:text-3xl font-bold text-werbens-alt-text mb-2 tracking-tight">
        Where do you post?
      </h1>
      <p className="text-werbens-alt-text/60 mb-6 text-sm sm:text-base">
        Priority platform & cadence. Connect at least one account to continue, or skip for now (pre-prod).
      </p>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Which platform matters most?</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setData((d) => ({ ...d, priorityPlatform: p.id }))}
            className={`px-3 py-2 rounded-lg border text-sm transition-all ${data.priorityPlatform === p.id ? cardClass(true) : cardClass(false)}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Posting cadence</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {CADENCE.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setData((d) => ({ ...d, postingCadence: c.id }))}
            className={`px-4 py-3 rounded-xl border transition-all text-sm ${data.postingCadence === c.id ? cardClass(true) : cardClass(false)}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-werbens-steel/50 bg-werbens-slate/30 p-4 mb-6">
        <p className="text-sm font-medium text-werbens-alt-text/90 mb-2">Connect an account</p>
        {loading ? (
          <p className="text-werbens-alt-text/60 text-sm">Checking…</p>
        ) : connectedCount >= 1 ? (
          <p className="text-werbens-light-cyan text-sm font-medium">Connected: {connectedCount} account(s)</p>
        ) : (
          <p className="text-werbens-alt-text/70 text-sm mb-2">Connect at least one account to unlock posting.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/accounts"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan text-werbens-alt-text text-sm font-medium hover:opacity-90"
          >
            {connectedCount >= 1 ? "+ Add another account" : "Connect an account"}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onBack} className="flex-1 min-w-[100px] py-3.5 rounded-2xl glass-dark border border-werbens-steel/50 text-werbens-alt-text/80 font-medium hover:text-werbens-alt-text min-h-[48px]">
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="flex-1 min-w-[100px] py-3.5 rounded-2xl bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan text-werbens-alt-text font-semibold glow hover:opacity-90 min-h-[48px] shadow-elevated disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 min-w-[100px] py-3.5 rounded-2xl glass-dark border border-werbens-steel/50 text-werbens-alt-text/80 font-medium hover:text-werbens-alt-text min-h-[48px] text-sm"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
