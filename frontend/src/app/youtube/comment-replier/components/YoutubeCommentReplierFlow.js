"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import {
  getSocialAccounts,
  runYoutubeCommentReplier,
  getYoutubeCommentReplierStreamUrl,
} from "@/api/services/socialService.js";

function buildCommentUrl(videoId, commentId) {
  const v = String(videoId || "").trim();
  const c = String(commentId || "").trim();
  if (!v || !c) return "";
  return `https://www.youtube.com/watch?v=${encodeURIComponent(v)}&lc=${encodeURIComponent(c)}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export function YoutubeCommentReplierFlow() {
  const { userId, loading: userLoading } = useCurrentUser();
  const eventSourceRef = useRef(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [streamItems, setStreamItems] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [waitRemainingMs, setWaitRemainingMs] = useState(0);
  const [activeRunId, setActiveRunId] = useState("");
  const [liveConsideredCount, setLiveConsideredCount] = useState(0);
  const [lastRunAt, setLastRunAt] = useState("");

  const loadYoutubeChannels = useCallback(async () => {
    if (!userId) {
      setChannels([]);
      setSelectedChannelId("");
      return;
    }

    setAccountsLoading(true);
    setError("");
    try {
      const response = await getSocialAccounts(userId);
      const socialAccounts = Array.isArray(response?.accounts) ? response.accounts : [];
      const youtubeAccounts = socialAccounts.filter((a) => a?.platform === "youtube");

      const channelMap = new Map();
      for (const account of youtubeAccounts) {
        const accountChannels = Array.isArray(account?.channels) ? account.channels : [];
        if (accountChannels.length) {
          for (const channel of accountChannels) {
            const channelId = String(channel?.channelId || "").trim();
            if (!channelId || channelMap.has(channelId)) continue;
            channelMap.set(channelId, {
              channelId,
              label: String(channel?.title || account?.username || account?.displayName || channelId),
            });
          }
        } else {
          const fallbackId = String(account?.platformUserId || "").trim();
          if (!fallbackId || channelMap.has(fallbackId)) continue;
          channelMap.set(fallbackId, {
            channelId: fallbackId,
            label: String(account?.username || account?.displayName || fallbackId),
          });
        }
      }

      const list = Array.from(channelMap.values());
      list.sort((a, b) => a.label.localeCompare(b.label));
      setChannels(list);
      setSelectedChannelId((prev) => {
        if (prev && list.some((c) => c.channelId === prev)) return prev;
        return list[0]?.channelId || "";
      });
    } catch (err) {
      setChannels([]);
      setSelectedChannelId("");
      setError(err?.message || "Failed to load YouTube channels.");
    } finally {
      setAccountsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadYoutubeChannels();
  }, [loadYoutubeChannels]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const items = useMemo(
    () => (Array.isArray(result?.items) ? result.items : streamItems),
    [result, streamItems]
  );
  const postedCount = Number(result?.postedCount ?? items.filter((item) => item?.status === "posted").length);
  const failedCount = items.filter((item) => item?.status !== "posted").length;
  const consideredCount = Number((result?.commentsConsidered ?? liveConsideredCount) || items.length || 0);
  const limitApplied = Number(result?.limitApplied || 3);

  const runAutoReply = async () => {
    if (!userId) {
      setError("Sign in first.");
      return;
    }
    if (!selectedChannelId) {
      setError("No YouTube channel found. Connect YouTube on Accounts page.");
      return;
    }

    setRunning(true);
    setError("");
    setResult(null);
    setStreamItems([]);
    setProgressPercent(2);
    setProgressMessage("Connecting to realtime progress...");
    setWaitRemainingMs(0);
    setActiveRunId("");
    setLiveConsideredCount(0);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (typeof EventSource === "undefined") {
      try {
        const response = await runYoutubeCommentReplier(userId, { channelId: selectedChannelId });
        setResult(response || null);
        setLastRunAt(new Date().toISOString());
        setProgressPercent(100);
        setProgressMessage("Completed");
      } catch (err) {
        setError(err?.message || "Failed to run YouTube comment replier.");
      } finally {
        setRunning(false);
      }
      return;
    }

    try {
      const streamUrl = getYoutubeCommentReplierStreamUrl(userId, { channelId: selectedChannelId });
      const source = new EventSource(streamUrl);
      eventSourceRef.current = source;
      let completed = false;

      const parsePayload = (event) => {
        try {
          return JSON.parse(event?.data || "{}");
        } catch {
          return {};
        }
      };

      source.addEventListener("progress", (event) => {
        const payload = parsePayload(event);
        const nextPercent = Number(payload?.percent);
        if (Number.isFinite(nextPercent)) {
          setProgressPercent(Math.max(0, Math.min(100, nextPercent)));
        }
        if (payload?.message) {
          setProgressMessage(payload.message);
        }
        if (payload?.runId) {
          setActiveRunId(String(payload.runId));
        }
        if (payload?.type === "scan_completed") {
          setLiveConsideredCount(Number(payload?.commentsConsidered || 0));
        }
        if (payload?.type === "wait_tick") {
          setWaitRemainingMs(Number(payload?.remainingMs || 0));
        } else if (payload?.type === "wait_started") {
          setWaitRemainingMs(Number(payload?.waitMs || 0));
        } else if (payload?.type === "wait_completed") {
          setWaitRemainingMs(0);
        }
        if (payload?.type === "comment_completed" && payload?.item) {
          setStreamItems((prev) => {
            const item = payload.item;
            const existingIndex = prev.findIndex((p) => p.commentId === item.commentId);
            if (existingIndex >= 0) {
              const next = [...prev];
              next[existingIndex] = { ...prev[existingIndex], ...item };
              return next;
            }
            return [...prev, item];
          });
        }
      });

      source.addEventListener("done", (event) => {
        const payload = parsePayload(event);
        completed = true;
        setResult(payload || null);
        setLastRunAt(new Date().toISOString());
        setProgressPercent(100);
        setProgressMessage("Completed");
        setWaitRemainingMs(0);
        setRunning(false);
        source.close();
        eventSourceRef.current = null;
      });

      source.addEventListener("failed", (event) => {
        const payload = parsePayload(event);
        completed = true;
        setError(payload?.message || payload?.error || "Failed to run YouTube comment replier.");
        setRunning(false);
        setWaitRemainingMs(0);
        source.close();
        eventSourceRef.current = null;
      });

      source.onerror = () => {
        if (completed) return;
        setError("Progress stream disconnected. Please run again.");
        setRunning(false);
        setWaitRemainingMs(0);
        source.close();
        eventSourceRef.current = null;
      };
    } catch (err) {
      setError(err?.message || "Failed to run YouTube comment replier.");
      setRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface">
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm uppercase tracking-[0.14em] text-werbens-dark-cyan/80 font-medium">
            YouTube
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-werbens-text">
            Comment Replier
          </h1>
          <p className="mt-2 text-sm sm:text-base text-werbens-muted">
            Fetches comments from YouTube and auto-replies to up to {limitApplied} unreplied comments per run.
          </p>
        </div>

        <div className="rounded-2xl border border-werbens-dark-cyan/10 bg-white/80 backdrop-blur p-4 sm:p-6 shadow-elevated">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-werbens-text mb-2" htmlFor="youtube-channel">
                Channel
              </label>
              <select
                id="youtube-channel"
                className="w-full rounded-xl border border-werbens-dark-cyan/20 bg-white px-3 py-2 text-sm text-werbens-text focus:outline-none focus:ring-2 focus:ring-werbens-dark-cyan/30"
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                disabled={accountsLoading || running || channels.length === 0}
              >
                {channels.length === 0 ? (
                  <option value="">No connected YouTube channel</option>
                ) : (
                  channels.map((channel) => (
                    <option key={channel.channelId} value={channel.channelId}>
                      {channel.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadYoutubeChannels}
                disabled={accountsLoading || running}
                className="rounded-xl border border-werbens-dark-cyan/20 px-4 py-2 text-sm font-medium text-werbens-text hover:bg-werbens-surface disabled:opacity-60"
              >
                {accountsLoading ? "Refreshing..." : "Refresh Channels"}
              </button>
              <button
                type="button"
                onClick={runAutoReply}
                disabled={running || accountsLoading || userLoading || !selectedChannelId}
                className="rounded-xl bg-werbens-dark-cyan px-4 py-2 text-sm font-semibold text-white hover:bg-werbens-dark-cyan/90 disabled:opacity-60"
              >
                {running ? "Replying..." : `Run Auto Reply (${limitApplied})`}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-werbens-muted">
            <span>User: {userId || "Not signed in"}</span>
            {lastRunAt ? <span>Last run: {formatDate(lastRunAt)}</span> : null}
            <Link href="/accounts" className="text-werbens-dark-cyan hover:underline">
              Manage connected accounts
            </Link>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {running ? (
            <div className="mt-4 rounded-xl border border-werbens-dark-cyan/15 bg-werbens-surface/70 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-werbens-text">
                  {progressMessage || "Processing comments..."}
                </p>
                <span className="text-xs font-semibold text-werbens-dark-cyan">
                  {Math.max(0, Math.min(100, Math.round(progressPercent)))}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-werbens-cloud overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan transition-all duration-500"
                  style={{ width: `${Math.max(3, Math.min(100, progressPercent))}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-amber-700 font-medium">
                Taking longer to seem like a human
              </p>
              {waitRemainingMs > 0 ? (
                <p className="mt-1 text-xs text-werbens-muted">
                  Next reply in ~{Math.ceil(waitRemainingMs / 1000)}s
                </p>
              ) : null}
              {activeRunId ? (
                <p className="mt-1 text-[11px] text-werbens-muted">
                  Run ID: {activeRunId}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
            <p className="text-xs uppercase tracking-[0.1em] text-werbens-muted">Comments Considered</p>
            <p className="mt-2 text-2xl font-semibold text-werbens-text">{consideredCount}</p>
          </article>
          <article className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
            <p className="text-xs uppercase tracking-[0.1em] text-werbens-muted">Replies Posted</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">{postedCount}</p>
          </article>
          <article className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
            <p className="text-xs uppercase tracking-[0.1em] text-werbens-muted">Failed</p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">{failedCount}</p>
          </article>
        </section>

        <section className="mt-6 space-y-3">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-werbens-dark-cyan/25 bg-white/70 px-4 py-8 text-center text-sm text-werbens-muted">
              Run auto reply to view comment data and reply status.
            </div>
          ) : (
            items.map((item, index) => {
              const youtubeLink = buildCommentUrl(item?.videoId, item?.commentId);
              const isPosted = item?.status === "posted";
              return (
                <article
                  key={String(item?.commentId || `row-${index}`)}
                  className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-werbens-text">
                      {item?.authorName || "Unknown author"}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isPosted
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {isPosted ? "Posted" : "Failed"}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap rounded-lg bg-werbens-mist/80 px-3 py-2 text-sm text-werbens-text">
                    {item?.commentText || "No comment text"}
                  </p>

                  <div className="mt-3">
                    <p className="text-xs uppercase tracking-[0.08em] text-werbens-muted">Generated Reply</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-werbens-text">
                      {item?.replyText || "—"}
                    </p>
                    {!isPosted && item?.error ? (
                      <p className="mt-2 text-xs text-red-600">{item.error}</p>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-werbens-muted">
                    <span>Comment ID: {item?.commentId || "—"}</span>
                    <span>Video ID: {item?.videoId || "—"}</span>
                    {item?.postedAt ? <span>Posted: {formatDate(item.postedAt)}</span> : null}
                    {youtubeLink ? (
                      <a
                        href={youtubeLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-werbens-dark-cyan hover:underline"
                      >
                        Open on YouTube
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </section>
    </main>
  );
}
