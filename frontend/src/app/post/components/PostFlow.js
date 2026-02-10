"use client";

import { useState } from "react";
import { PostLayout } from "./PostLayout";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import { getSocialAccounts } from "@/lib/socialApi";
import { API_ENDPOINTS } from "@/api/endpoints";

const PLATFORM_LABELS = {
  youtube: "YouTube",
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X (Twitter)",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
};

const FRONTEND_PLATFORM_MAP = { x: "twitter" };
const BACKEND_PLATFORM_MAP = { twitter: "x" };

function ModeTabs({ value, onChange }) {
  const modes = [
    { id: "immediate", label: "Post now" },
    { id: "scheduled", label: "Schedule" },
    { id: "automatic", label: "Automatic (rules)" },
  ];
  return (
    <div className="inline-flex rounded-xl bg-werbens-surface p-1 border border-werbens-steel/30 shadow-sm">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
            value === m.id
              ? "bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan text-white shadow"
              : "text-werbens-muted hover:text-werbens-text"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function PlatformSelector({ availableTargets, selectedTargets, onToggle }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {availableTargets.map((t) => {
        const label = PLATFORM_LABELS[t.platform] || t.platform;
        const isSelected = selectedTargets.some(
          (s) => s.platform === t.platform && s.channelId === t.channelId,
        );
        return (
          <button
            key={`${t.platform}-${t.channelId}`}
            type="button"
            onClick={() => onToggle(t)}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
              isSelected
                ? "border-werbens-light-cyan bg-werbens-light-cyan/10 text-werbens-text"
                : "border-werbens-steel/30 bg-white/80 text-werbens-muted hover:border-werbens-steel/60"
            }`}
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{label}</p>
              <p className="text-[11px] text-werbens-muted truncate">
                {t.displayName || t.username || t.channelId}
              </p>
            </div>
            {isSelected && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-werbens-dark-cyan text-[10px] text-white">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

async function fetchTargets(userId) {
  if (!userId) return [];
  const { accounts } = await getSocialAccounts(userId);
  const targets = [];
  for (const a of accounts || []) {
    const platform = a.platform;
    // Use SocialAccounts.channels for multi-channel platforms (e.g. YouTube, Meta)
    if (Array.isArray(a.channels) && a.channels.length > 0) {
      for (const ch of a.channels) {
        targets.push({
          platform,
          channelId: ch.channelId || ch.pageId || ch.igId || "",
          displayName: ch.title || ch.name || ch.username || a.displayName || a.username,
          username: a.username,
        });
      }
    } else {
      targets.push({
        platform,
        channelId: a.platformUserId || a.channelId || "",
        displayName: a.displayName || a.username,
        username: a.username,
      });
    }
  }
  return targets.filter((t) => t.channelId);
}

export function PostFlow() {
  const { userId } = useCurrentUser();
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [targets, setTargets] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [mode, setMode] = useState("immediate");
  const [content, setContent] = useState({
    title: "",
    body: "",
    hashtags: "",
  });
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function ensureTargetsLoaded() {
    if (loadingTargets || targets.length > 0 || !userId) return;
    setLoadingTargets(true);
    try {
      const list = await fetchTargets(userId);
      setTargets(list);
    } catch (err) {
      console.error("load targets error", err);
      setStatus({ type: "error", text: err.message || "Failed to load accounts." });
    } finally {
      setLoadingTargets(false);
    }
  }

  function handleToggleTarget(t) {
    setSelectedTargets((prev) => {
      const exists = prev.some((p) => p.platform === t.platform && p.channelId === t.channelId);
      if (exists) {
        return prev.filter((p) => !(p.platform === t.platform && p.channelId === t.channelId));
      }
      return [...prev, t];
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) {
      setStatus({ type: "error", text: "Sign in to post content." });
      return;
    }
    if (selectedTargets.length === 0) {
      setStatus({ type: "error", text: "Select at least one platform/channel." });
      return;
    }
    if (!content.body && !content.title) {
      setStatus({ type: "error", text: "Add a title or description." });
      return;
    }
    if (mode === "scheduled" && !scheduledAt) {
      setStatus({ type: "error", text: "Choose a date and time for scheduled posts." });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const payload = {
        userId,
        mode,
        targets: selectedTargets.map((t) => ({
          platform: BACKEND_PLATFORM_MAP[FRONTEND_PLATFORM_MAP[t.platform] || t.platform] || t.platform,
          channelId: t.channelId,
        })),
        content: {
          title: content.title,
          body: content.body,
          hashtags: content.hashtags
            ? content.hashtags
                .split(/[,\s]+/)
                .map((h) => h.trim())
                .filter(Boolean)
            : [],
          metadata: {},
        },
        scheduledAt: mode === "scheduled" ? scheduledAt : null,
      };

      const res = await fetch(API_ENDPOINTS.SOCIAL_POST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create post");
      }
      setStatus({
        type: "success",
        text:
          mode === "immediate"
            ? "Post queued to be published shortly."
            : "Post scheduled successfully.",
      });
    } catch (err) {
      setStatus({ type: "error", text: err.message || "Failed to schedule post." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PostLayout>
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-werbens-text">
          Plan &amp; post{" "}
          <span className="gradient-text">social content</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-werbens-muted max-w-2xl">
          Create once, distribute everywhere. Choose platforms, compose your content,
          and either post now or schedule for later. Automatic posting rules can be
          added on top without spamming your audience.
        </p>
      </div>

      {status && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            status.type === "error"
              ? "bg-red-50 text-red-800 border border-red-100"
              : "bg-emerald-50 text-emerald-800 border border-emerald-100"
          }`}
          role="alert"
        >
          {status.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl bg-white/90 border border-werbens-steel/30 shadow-elevated p-4 sm:p-6 lg:p-7"
        onFocus={ensureTargetsLoaded}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-werbens-text">Destinations</h2>
            <p className="text-xs text-werbens-muted mt-0.5">
              Pick the channels you want this content to go to.
            </p>
          </div>
          <ModeTabs value={mode} onChange={setMode} />
        </div>

        {loadingTargets ? (
          <p className="text-sm text-werbens-muted">Loading connected accounts…</p>
        ) : targets.length === 0 ? (
          <p className="text-sm text-werbens-muted">
            Connect accounts on the <span className="font-semibold">Accounts</span> page
            to start posting.
          </p>
        ) : (
          <PlatformSelector
            availableTargets={targets}
            selectedTargets={selectedTargets}
            onToggle={handleToggleTarget}
          />
        )}

        <div className="border-t border-werbens-steel/20 pt-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-werbens-text">Content</h2>
            <p className="text-xs text-werbens-muted mt-0.5">
              We&apos;ll adapt this content to each platform. YouTube will use the title +
              description; other platforms will use the body text.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-werbens-muted mb-1">
                Title (optional, recommended for YouTube)
              </label>
              <input
                type="text"
                value={content.title}
                onChange={(e) => setContent((c) => ({ ...c, title: e.target.value }))}
                className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
                placeholder="E.g. 5 AI tools to automate your marketing"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-werbens-muted mb-1">
                Main content
              </label>
              <textarea
                rows={5}
                value={content.body}
                onChange={(e) => setContent((c) => ({ ...c, body: e.target.value }))}
                className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring resize-y"
                placeholder="Write your post copy here (we'll reuse it across platforms)."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-werbens-muted mb-1">
                Hashtags (optional)
              </label>
              <input
                type="text"
                value={content.hashtags}
                onChange={(e) => setContent((c) => ({ ...c, hashtags: e.target.value }))}
                className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
                placeholder="#marketing, #ai, #startup"
              />
            </div>
          </div>
        </div>

        {mode === "scheduled" && (
          <div className="border-t border-werbens-steel/20 pt-4 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-werbens-text">Schedule</h2>
              <p className="text-xs text-werbens-muted mt-0.5">
                Choose when this content should go live. We&apos;ll respect platform
                safety limits and may delay posts slightly to avoid spamming.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full sm:w-auto rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
              />
            </div>
          </div>
        )}

        {mode === "automatic" && (
          <div className="border-t border-werbens-steel/20 pt-4 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-werbens-text">Automatic mode</h2>
              <p className="text-xs text-werbens-muted mt-0.5">
                Automatic rules will eventually handle frequency and timing for you. For
                now, we&apos;ll simply queue posts created here as &quot;automatic&quot;
                so they can be triggered by your future rules or a manual automation
                run.
              </p>
            </div>
            <p className="text-xs text-werbens-muted">
              This UI is intentionally conservative: it won&apos;t auto‑blast content.
              All posting still goes through the same safety filters as manual
              scheduling.
            </p>
          </div>
        )}

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting
              ? mode === "immediate"
                ? "Queuing post..."
                : "Scheduling..."
              : mode === "immediate"
                ? "Post now"
                : "Schedule"}
          </button>
        </div>
      </form>
    </PostLayout>
  );
}

