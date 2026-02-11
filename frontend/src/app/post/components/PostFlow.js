"use client";

import { useState, useEffect } from "react";
import { PostLayout } from "./PostLayout";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import { getSocialAccounts } from "@/lib/socialApi";
import { createPost } from "@/api/services/postingService";

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

function XContentForm({ content, setContent }) {
  const [pollOption, setPollOption] = useState("");
  
  const addPollOption = () => {
    if (pollOption.trim() && content.x_poll_options.length < 4) {
      setContent((c) => ({
        ...c,
        x_poll_options: [...c.x_poll_options, pollOption.trim()],
      }));
      setPollOption("");
    }
  };
  
  const removePollOption = (index) => {
    setContent((c) => ({
      ...c,
      x_poll_options: c.x_poll_options.filter((_, i) => i !== index),
    }));
  };
  
  return (
    <div className="space-y-4">
      {/* Tweet Text (Required) */}
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Tweet Text <span className="text-red-500">*</span> (max 280 characters)
        </label>
        <textarea
          rows={4}
          value={content.x_text}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length <= 280) {
              setContent((c) => ({ ...c, x_text: val }));
            }
          }}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring resize-y"
          placeholder="What's happening?"
          required
        />
        <p className="text-xs text-werbens-muted mt-1">
          {content.x_text.length}/280 characters
        </p>
      </div>
      
      {/* Media IDs */}
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Media IDs (optional, comma-separated)
        </label>
        <input
          type="text"
          value={content.x_media_ids.join(", ")}
          onChange={(e) => {
            const ids = e.target.value
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean);
            setContent((c) => ({ ...c, x_media_ids: ids }));
          }}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder="1234567890, 0987654321"
        />
        <p className="text-xs text-werbens-muted mt-1">
          Upload media first via X API, then use the media IDs here. Max 4 media items.
        </p>
      </div>
      
      {/* Poll */}
      <div className="border border-werbens-steel/20 rounded-lg p-3 space-y-2">
        <label className="block text-xs font-medium text-werbens-muted">
          Poll (optional, mutually exclusive with media)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={pollOption}
            onChange={(e) => setPollOption(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addPollOption())}
            className="flex-1 rounded-lg border border-werbens-steel/40 bg-white px-3 py-1.5 text-sm text-werbens-text shadow-sm focus-ring"
            placeholder="Add poll option (2-4 options)"
            disabled={content.x_poll_options.length >= 4}
          />
          <button
            type="button"
            onClick={addPollOption}
            disabled={!pollOption.trim() || content.x_poll_options.length >= 4}
            className="px-3 py-1.5 rounded-lg bg-werbens-dark-cyan text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        {content.x_poll_options.length > 0 && (
          <div className="space-y-1">
            {content.x_poll_options.map((opt, idx) => (
              <div key={idx} className="flex items-center justify-between bg-werbens-surface rounded px-2 py-1">
                <span className="text-xs text-werbens-text">{opt}</span>
                <button
                  type="button"
                  onClick={() => removePollOption(idx)}
                  className="text-red-500 text-xs hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {content.x_poll_options.length >= 2 && (
          <div className="mt-2">
            <label className="block text-xs font-medium text-werbens-muted mb-1">
              Poll Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="10080"
              value={content.x_poll_duration_minutes}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  x_poll_duration_minutes: parseInt(e.target.value) || 60,
                }))
              }
              className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-1.5 text-sm text-werbens-text shadow-sm focus-ring"
            />
          </div>
        )}
      </div>
      
      {/* Reply to Tweet */}
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Reply to Tweet ID (optional)
        </label>
        <input
          type="text"
          value={content.x_reply_to_tweet_id}
          onChange={(e) => setContent((c) => ({ ...c, x_reply_to_tweet_id: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder="1234567890123456789"
        />
      </div>
      
      {/* Quote Tweet */}
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Quote Tweet ID (optional)
        </label>
        <input
          type="text"
          value={content.x_quote_tweet_id}
          onChange={(e) => setContent((c) => ({ ...c, x_quote_tweet_id: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder="1234567890123456789"
        />
      </div>
      
      {/* Geo Place ID */}
      <div>
        <label className="block text-xs font-medium text-werbens-muted mb-1">
          Geo Place ID (optional, requires geo enabled in profile)
        </label>
        <input
          type="text"
          value={content.x_geo_place_id}
          onChange={(e) => setContent((c) => ({ ...c, x_geo_place_id: e.target.value }))}
          className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
          placeholder="Place ID"
        />
      </div>
      
      {/* Super Followers Only */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="x_super_followers"
          checked={content.x_for_super_followers_only}
          onChange={(e) =>
            setContent((c) => ({ ...c, x_for_super_followers_only: e.target.checked }))
          }
          className="rounded border-werbens-steel/40"
        />
        <label htmlFor="x_super_followers" className="text-xs font-medium text-werbens-muted">
          For Super Followers only
        </label>
      </div>
    </div>
  );
}

function GenericContentForm({ content, setContent }) {
  return (
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle(t);
            }}
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
  
  // Platform-specific content state
  const [content, setContent] = useState({
    // Generic fields
    title: "",
    body: "",
    hashtags: "",
    // X-specific fields
    x_text: "",
    x_media_ids: [],
    x_poll_options: [],
    x_poll_duration_minutes: 60,
    x_reply_to_tweet_id: "",
    x_quote_tweet_id: "",
    x_geo_place_id: "",
    x_for_super_followers_only: false,
  });
  
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Determine if X is selected
  const isXSelected = selectedTargets.some((t) => t.platform === "x");

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

  // Load targets once on mount if userId is available
  useEffect(() => {
    if (userId && targets.length === 0 && !loadingTargets) {
      ensureTargetsLoaded();
    }
  }, [userId]); // Only depend on userId, not targets or loadingTargets to avoid loops

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
    e.stopPropagation();
    if (!userId) {
      setStatus({ type: "error", text: "Sign in to post content." });
      return;
    }
    if (selectedTargets.length === 0) {
      setStatus({ type: "error", text: "Select at least one platform/channel." });
      return;
    }
    // Validate content based on selected platforms
    if (isXSelected) {
      if (!content.x_text || content.x_text.trim().length === 0) {
        setStatus({ type: "error", text: "Tweet text is required for X." });
        return;
      }
      if (content.x_text.length > 280) {
        setStatus({ type: "error", text: `Tweet exceeds 280 characters (${content.x_text.length} characters).` });
        return;
      }
    } else {
      if (!content.body && !content.title) {
        setStatus({ type: "error", text: "Add a title or description." });
        return;
      }
    }
    if (mode === "scheduled" && !scheduledAt) {
      setStatus({ type: "error", text: "Choose a date and time for scheduled posts." });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      // Build platform-specific content
      const contentPayload = {};
      
      if (isXSelected) {
        // X-specific payload
        contentPayload.x_text = content.x_text.trim();
        if (content.x_media_ids && content.x_media_ids.length > 0) {
          contentPayload.x_media_ids = content.x_media_ids;
        }
        if (content.x_poll_options && content.x_poll_options.length >= 2) {
          contentPayload.x_poll = {
            options: content.x_poll_options,
            duration_minutes: content.x_poll_duration_minutes || 60,
          };
        }
        if (content.x_reply_to_tweet_id) {
          contentPayload.x_reply_to_tweet_id = content.x_reply_to_tweet_id.trim();
        }
        if (content.x_quote_tweet_id) {
          contentPayload.x_quote_tweet_id = content.x_quote_tweet_id.trim();
        }
        if (content.x_geo_place_id) {
          contentPayload.x_geo_place_id = content.x_geo_place_id.trim();
        }
        if (content.x_for_super_followers_only) {
          contentPayload.x_for_super_followers_only = true;
        }
      } else {
        // Generic payload for other platforms
        contentPayload.title = content.title;
        contentPayload.body = content.body;
        contentPayload.hashtags = content.hashtags
          ? content.hashtags
              .split(/[,\s]+/)
              .map((h) => h.trim())
              .filter(Boolean)
          : [];
      }
      
      const payload = {
        userId,
        mode,
        targets: selectedTargets.map((t) => ({
          platform: BACKEND_PLATFORM_MAP[FRONTEND_PLATFORM_MAP[t.platform] || t.platform] || t.platform,
          channelId: t.channelId,
        })),
        content: {
          ...contentPayload,
          metadata: {},
        },
        scheduledAt: mode === "scheduled" ? scheduledAt : null,
      };
      
      console.log("Form payload:", JSON.stringify(payload, null, 2));

      const data = await createPost(userId, payload);
      if (!data.ok) {
        throw new Error(data.error || "Failed to create post");
      }
      
      // Check if post was posted immediately (for immediate mode)
      if (mode === "immediate" && data.results && Array.isArray(data.results)) {
        const postedResults = data.results.filter((r) => r.status === "posted");
        const errorResults = data.results.filter((r) => r.error);
        
        if (errorResults.length > 0) {
          const errors = errorResults.map((r) => r.error).join(", ");
          throw new Error(errors);
        }
        
        if (postedResults.length > 0) {
          const platformPostIds = postedResults.map((r) => r.platformPostId).filter(Boolean);
          setStatus({
            type: "success",
            text: `Post published successfully!${platformPostIds.length > 0 ? ` Tweet ID: ${platformPostIds[0]}` : ""}`,
          });
        } else {
          setStatus({
            type: "success",
            text: "Post queued to be published shortly.",
          });
        }
      } else {
        setStatus({
          type: "success",
          text:
            mode === "immediate"
              ? "Post published successfully!"
              : "Post scheduled successfully.",
        });
      }
      
      // Reset form for immediate posts
      if (mode === "immediate") {
        setSelectedTargets([]);
        setContent({
          title: "",
          body: "",
          hashtags: "",
          x_text: "",
          x_media_ids: [],
          x_poll_options: [],
          x_poll_duration_minutes: 60,
          x_reply_to_tweet_id: "",
          x_quote_tweet_id: "",
          x_geo_place_id: "",
          x_for_super_followers_only: false,
        });
      }
    } catch (err) {
      console.error("Post submission error:", err);
      const errorMessage = err.message || err.data?.error || err.data?.message || "Failed to schedule post.";
      setStatus({ 
        type: "error", 
        text: errorMessage
      });
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
        onFocus={(e) => {
          // Only load if focus is on an input/textarea, not on buttons
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            ensureTargetsLoaded();
          }
        }}
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
              {isXSelected
                ? "X (Twitter) specific fields. All parameters supported by X API v2."
                : "We'll adapt this content to each platform. YouTube will use the title + description; other platforms will use the body text."}
            </p>
          </div>
          
          {isXSelected ? (
            <XContentForm content={content} setContent={setContent} />
          ) : (
            <GenericContentForm content={content} setContent={setContent} />
          )}
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

