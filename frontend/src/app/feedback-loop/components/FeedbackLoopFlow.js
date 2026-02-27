"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import {
  getSocialAccounts,
  getFeedbackLoopDashboard,
  getFeedbackLoopGenerationHistory,
  getFeedbackLoopTasks,
  startFeedbackLoop,
  pauseFeedbackLoop,
  triggerFeedbackLoop,
  generateFeedbackLoopPreview,
  updateFeedbackLoopConfig,
} from "@/api/services/socialService";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat().format(Math.round(n));
}

function formatPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0.00%";
  return `${n.toFixed(2)}%`;
}

function shortId(value) {
  const text = String(value || "");
  if (!text) return "-";
  if (text.length <= 12) return text;
  return `${text.slice(0, 8)}...${text.slice(-4)}`;
}

function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function statusBadgeClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "posted") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (value === "scheduled" || value === "pending") return "bg-cyan-100 text-cyan-700 border border-cyan-200";
  if (value === "completed") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (value === "processing") return "bg-amber-100 text-amber-700 border border-amber-200";
  if (value === "failed") return "bg-red-100 text-red-700 border border-red-200";
  if (value === "cancelled") return "bg-slate-100 text-slate-700 border border-slate-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function normalizeChannels(accountsResponse) {
  const list = [];
  const accounts = Array.isArray(accountsResponse?.accounts) ? accountsResponse.accounts : [];
  for (const account of accounts) {
    if (String(account?.platform || "").toLowerCase() !== "x") continue;

    const accountChannels = Array.isArray(account?.channels) ? account.channels : [];
    if (accountChannels.length > 0) {
      for (const channel of accountChannels) {
        const channelId = String(channel?.channelId || "").trim();
        if (!channelId) continue;
        list.push({
          channelId,
          label: String(channel?.title || account?.displayName || account?.username || channelId),
          handle: String(channel?.username || account?.username || "").trim(),
        });
      }
      continue;
    }

    const platformUserId = String(account?.platformUserId || "").trim();
    if (!platformUserId) continue;
    list.push({
      channelId: platformUserId,
      label: String(account?.displayName || account?.username || platformUserId),
      handle: String(account?.username || "").trim(),
    });
  }

  const dedupe = new Map();
  for (const item of list) {
    if (!dedupe.has(item.channelId)) dedupe.set(item.channelId, item);
  }

  return Array.from(dedupe.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function normalizeGenerationRun(run) {
  if (!run) return null;
  const textVariants = Array.isArray(run?.textVariants) ? run.textVariants : [];
  const imageVariants = Array.isArray(run?.imageVariants) ? run.imageVariants : [];

  const selectedTextVariantId = run?.selectedTextVariantId || run?.selection?.selectedTextVariantId || run?.selectedText?.variantId || null;
  const selectedImageVariantId = run?.selectedImageVariantId || run?.selection?.selectedImageVariantId || run?.selectedImage?.variantId || null;

  const selectedText =
    textVariants.find((item) => item?.variantId === selectedTextVariantId) ||
    run?.selectedText ||
    null;

  const selectedImage =
    imageVariants.find((item) => item?.variantId === selectedImageVariantId) ||
    run?.selectedImage ||
    null;

  return {
    runId: run?.runId || "",
    createdAt: run?.createdAt || run?.startedAt || null,
    selectedMode: run?.selectedMode || run?.selection?.selectedMode || "text_only",
    selectedScore: Number(run?.selectedScore || run?.selection?.selectedScore || 0),
    policy: run?.policy || run?.selection?.policy || {},
    candidates: Array.isArray(run?.candidates) ? run.candidates : Array.isArray(run?.selection?.candidates) ? run.selection.candidates : [],
    textVariants,
    imageVariants,
    selectedTextVariantId,
    selectedImageVariantId,
    selectedText,
    selectedImage,
  };
}

function KpiCard({ label, value, accent = "text-werbens-text" }) {
  return (
    <article className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
      <p className="text-xs uppercase tracking-[0.1em] text-werbens-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
    </article>
  );
}

function TimelineStep({ label, done, active }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
          done
            ? "bg-emerald-600 text-white"
            : active
              ? "bg-werbens-dark-cyan text-white"
              : "bg-werbens-cloud text-werbens-muted"
        }`}
      >
        {done ? "✓" : "•"}
      </span>
      <span className={`text-xs ${done || active ? "text-werbens-text" : "text-werbens-muted"}`}>{label}</span>
    </div>
  );
}

function VariantBarChart({ rows }) {
  const list = Array.isArray(rows) ? rows : [];
  const max = Math.max(
    1,
    ...list.map((row) => Number(row?.performance?.metrics?.engagementRate || 0))
  );

  return (
    <div className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-werbens-text">Recent variant engagement trend</p>
        <p className="text-xs text-werbens-muted">Last {list.length} runs</p>
      </div>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-werbens-muted">No measured runs yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-8 gap-2 items-end min-h-[140px]">
          {list.map((row) => {
            const value = Number(row?.performance?.metrics?.engagementRate || 0);
            const height = Math.max(12, Math.round((value / max) * 120));
            return (
              <div key={`bar-${row.runId}`} className="flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-werbens-dark-cyan to-werbens-light-cyan"
                  style={{ height: `${height}px` }}
                  title={`${formatPercent(value)} engagement`}
                />
                <span className="text-[10px] text-werbens-muted">{shortId(row?.runId)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FeedbackLoopFlow() {
  const { userId, loading: userLoading } = useCurrentUser();

  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [channelsLoading, setChannelsLoading] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [previewRun, setPreviewRun] = useState(null);

  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [actionBusy, setActionBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");
  const refreshInFlightRef = useRef(false);

  const [configDraft, setConfigDraft] = useState({
    maxPostsPerDay: 4,
    textVariantsPerRun: 4,
    imageVariantsPerRun: 2,
    explorationRate: 0.3,
    allowImages: true,
    allowTextOnly: true,
  });
  const [quickTestMode, setQuickTestMode] = useState(true);
  const [quickTestSpacingMinutes, setQuickTestSpacingMinutes] = useState(1);
  const [lastTriggerSummary, setLastTriggerSummary] = useState(null);

  const loadChannels = useCallback(async () => {
    if (!userId) {
      setChannels([]);
      setSelectedChannelId("");
      return;
    }

    setChannelsLoading(true);
    setError("");
    try {
      const response = await getSocialAccounts(userId);
      const nextChannels = normalizeChannels(response);
      setChannels(nextChannels);
      setSelectedChannelId((prev) => {
        if (prev && nextChannels.some((item) => item.channelId === prev)) return prev;
        return nextChannels[0]?.channelId || "";
      });
    } catch (err) {
      setChannels([]);
      setSelectedChannelId("");
      setError(err?.message || "Failed to load X accounts.");
    } finally {
      setChannelsLoading(false);
    }
  }, [userId]);

  const loadFeedbackData = useCallback(async () => {
    if (!userId || !selectedChannelId) {
      setDashboard(null);
      setHistory([]);
      setTasks([]);
      return;
    }
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;

    setLoadingDashboard(true);
    setError("");
    try {
      const [dashboardRes, historyRes] = await Promise.all([
        getFeedbackLoopDashboard(userId, { channelId: selectedChannelId }),
        getFeedbackLoopGenerationHistory(userId, { channelId: selectedChannelId, limit: 20 }),
      ]);
      const tasksRes = await getFeedbackLoopTasks(userId, { channelId: selectedChannelId, limit: 80 });

      setDashboard(dashboardRes || null);
      const nextHistory = Array.isArray(historyRes?.history)
        ? historyRes.history
        : Array.isArray(dashboardRes?.generationHistory)
          ? dashboardRes.generationHistory
          : [];
      setHistory(nextHistory);
      setTasks(Array.isArray(tasksRes?.tasks) ? tasksRes.tasks : []);

      const config = dashboardRes?.config || {};
      setConfigDraft({
        maxPostsPerDay: Number(config?.maxPostsPerDay || 4),
        textVariantsPerRun: Number(config?.textVariantsPerRun || 4),
        imageVariantsPerRun: Number(config?.imageVariantsPerRun || 2),
        explorationRate: Number(config?.explorationRate ?? 0.3),
        allowImages: Boolean(config?.allowImages),
        allowTextOnly: Boolean(config?.allowTextOnly),
      });
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      setDashboard(null);
      setHistory([]);
      setTasks([]);
      setError(err?.message || "Failed to load feedback loop dashboard.");
    } finally {
      setLoadingDashboard(false);
      refreshInFlightRef.current = false;
    }
  }, [userId, selectedChannelId]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    loadFeedbackData();
  }, [loadFeedbackData]);

  const pendingCountForPolling = Number(dashboard?.kpis?.pendingCount || 0);
  useEffect(() => {
    if (!userId || !selectedChannelId) return undefined;
    const intervalMs = pendingCountForPolling > 0 ? 4000 : 10000;
    const timer = setInterval(() => {
      void loadFeedbackData();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [userId, selectedChannelId, pendingCountForPolling, loadFeedbackData]);

  const runAction = async (key, operation, successMessage) => {
    setActionBusy(key);
    setError("");
    setNotice("");
    try {
      await withTimeout(
        operation(),
        key === "trigger" ? 45000 : 30000,
        "Request is taking too long. It may still be processing on the server. Refresh in a few seconds."
      );
      if (successMessage) setNotice(successMessage);
      await loadFeedbackData();
    } catch (err) {
      setError(err?.message || "Action failed.");
    } finally {
      setActionBusy("");
      void loadFeedbackData();
    }
  };

  const handleStart = () =>
    runAction(
      "start",
      () => startFeedbackLoop(userId, { channelId: selectedChannelId }),
      "Autonomous feedback loop started."
    );

  const handlePause = () =>
    runAction(
      "pause",
      () => pauseFeedbackLoop(userId, { channelId: selectedChannelId }),
      "Autonomous feedback loop paused."
    );

  const handleTrigger = () =>
    runAction(
      "trigger",
      async () => {
        const response = await triggerFeedbackLoop(userId, {
          channelId: selectedChannelId,
          quickTest: quickTestMode,
          testTextOnly: true,
          testSpacingMinutes: quickTestSpacingMinutes,
        });
        setPreviewRun(null);
        setLastTriggerSummary(response?.result || null);
        const result = response?.result || {};
        if (result?.skipped && result?.reason === "daily_cap_reached") {
          setNotice(`Skipped: daily cap reached (${result?.todayCount || 0} planned today).`);
          return;
        }
        const quickLabel = result?.quickTest ? "Quick test mode" : "Policy mode";
        const count = Number(result?.scheduledCount || 0);
        setNotice(
          `Triggered (${quickLabel}). Run ${shortId(result?.runId)} | Scheduled ${count} post(s) | First at ${formatDateTime(result?.scheduledAt)}`
        );
      },
      "Cycle triggered successfully."
    );

  const handleGeneratePreview = () =>
    runAction(
      "preview",
      async () => {
        const response = await generateFeedbackLoopPreview(userId, { channelId: selectedChannelId });
        setPreviewRun(response?.result || null);
      },
      "Preview generated successfully."
    );

  const handleSaveConfig = () =>
    runAction(
      "config",
      async () => {
        await updateFeedbackLoopConfig(userId, {
          channelId: selectedChannelId,
          patch: {
            maxPostsPerDay: Number(configDraft.maxPostsPerDay || 4),
            textVariantsPerRun: Number(configDraft.textVariantsPerRun || 4),
            imageVariantsPerRun: Number(configDraft.imageVariantsPerRun || 2),
            explorationRate: Number(configDraft.explorationRate || 0.3),
            allowImages: Boolean(configDraft.allowImages),
            allowTextOnly: Boolean(configDraft.allowTextOnly),
          },
        });
      },
      "Feedback generation policy updated."
    );

  const normalizedPreviewRun = normalizeGenerationRun(previewRun);
  const normalizedLatestHistoryRun = normalizeGenerationRun(history[0]);
  const generationRun = normalizedPreviewRun || normalizedLatestHistoryRun;

  const posts = Array.isArray(dashboard?.posts) ? dashboard.posts : [];
  const taskCounts = dashboard?.taskCounts || {};
  const latestRunSummary = dashboard?.latestRun?.summary || null;
  const latestRunId = dashboard?.latestRun?.runId || generationRun?.runId || "";

  const latestPost = useMemo(() => {
    if (!generationRun?.runId) return posts[0] || null;
    const match = posts.find((item) => item?.runId === generationRun.runId);
    return match || posts[0] || null;
  }, [posts, generationRun]);

  const postsForLatestRun = useMemo(() => {
    if (!latestRunId) return [];
    return posts
      .filter((item) => String(item?.runId || "") === String(latestRunId))
      .sort((a, b) => new Date(a?.scheduledAt || 0).getTime() - new Date(b?.scheduledAt || 0).getTime());
  }, [posts, latestRunId]);

  const scheduledCountForRun = Number(latestRunSummary?.scheduledCount || postsForLatestRun.length || 0);
  const postedCountForRun = postsForLatestRun.filter((item) => String(item?.status || "") === "posted").length;
  const pendingCountForRun = postsForLatestRun.filter((item) =>
    ["pending", "scheduled", "processing"].includes(String(item?.status || "").toLowerCase())
  ).length;
  const failedCountForRun = postsForLatestRun.filter((item) =>
    ["failed", "cancelled"].includes(String(item?.status || "").toLowerCase())
  ).length;

  const generatedDone = Boolean(generationRun?.runId);
  const scheduledDone = Boolean(
    latestPost?.scheduledAt ||
      latestPost?.status === "scheduled" ||
      latestPost?.status === "posted" ||
      latestRunSummary?.scheduledPostId
  );
  const postedDone = String(latestPost?.status || "") === "posted";
  const measuredDone = Number(latestPost?.metrics?.impressions || 0) > 0 || Number(taskCounts?.completed || 0) > 0;

  const isRunning = Boolean(actionBusy);
  const config = dashboard?.config || {};

  const selectedTextHook = String(generationRun?.selectedText?.hookStyle || "").toLowerCase();
  const similarHookRows = useMemo(() => {
    if (!selectedTextHook) return [];
    return history.filter((row) => String(row?.selectedText?.hookStyle || "").toLowerCase() === selectedTextHook);
  }, [history, selectedTextHook]);

  const similarHookAvg = useMemo(() => {
    if (!similarHookRows.length) return 0;
    const total = similarHookRows.reduce(
      (sum, row) => sum + Number(row?.performance?.metrics?.engagementRate || 0),
      0
    );
    return total / similarHookRows.length;
  }, [similarHookRows]);

  const overallAvg = useMemo(() => {
    if (!history.length) return 0;
    const total = history.reduce((sum, row) => sum + Number(row?.performance?.metrics?.engagementRate || 0), 0);
    return total / history.length;
  }, [history]);

  const chartRows = useMemo(() => history.slice(0, 8).reverse(), [history]);
  const measurementPlan = "5m, 10m, 30m, 1h, 4h, 12h, 24h, 48h";

  const checkpointRows = useMemo(() => {
    const grouped = new Map();
    for (const task of tasks) {
      const checkpoint = String(task?.checkpoint || task?.payload?.checkpoint || "unknown");
      if (!grouped.has(checkpoint)) {
        grouped.set(checkpoint, {
          checkpoint,
          total: 0,
          completed: 0,
          pending: 0,
          processing: 0,
          failed: 0,
          nextDueAt: null,
        });
      }
      const row = grouped.get(checkpoint);
      const status = String(task?.status || "pending").toLowerCase();
      row.total += 1;
      if (status === "completed") row.completed += 1;
      else if (status === "processing") row.processing += 1;
      else if (status === "failed") row.failed += 1;
      else row.pending += 1;

      const due = task?.scheduledFor ? new Date(task.scheduledFor) : null;
      if (due && !Number.isNaN(due.getTime())) {
        if (!row.nextDueAt || due.getTime() < new Date(row.nextDueAt).getTime()) {
          row.nextDueAt = due.toISOString();
        }
      }
    }
    const desiredOrder = ["5m", "10m", "30m", "1h", "4h", "12h", "24h", "48h"];
    return Array.from(grouped.values()).sort((a, b) => {
      const ai = desiredOrder.indexOf(a.checkpoint);
      const bi = desiredOrder.indexOf(b.checkpoint);
      if (ai === -1 && bi === -1) return a.checkpoint.localeCompare(b.checkpoint);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [tasks]);

  const selectedChannel = channels.find((item) => item.channelId === selectedChannelId) || null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface">
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm uppercase tracking-[0.14em] text-werbens-dark-cyan/80 font-medium">
            X (Twitter)
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-werbens-text">Feedback Loop</h1>
          <p className="mt-2 text-sm sm:text-base text-werbens-muted">
            Generation and performance loop: generated - scheduled - posted - measured.
          </p>
        </div>

        <div className="rounded-2xl border border-werbens-dark-cyan/10 bg-white/80 backdrop-blur p-4 sm:p-6 shadow-elevated">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 xl:items-end">
            <div>
              <label htmlFor="feedback-loop-channel" className="block text-sm font-medium text-werbens-text mb-2">
                X account
              </label>
              <select
                id="feedback-loop-channel"
                className="w-full rounded-xl border border-werbens-dark-cyan/20 bg-white px-3 py-2 text-sm text-werbens-text focus:outline-none focus:ring-2 focus:ring-werbens-dark-cyan/30"
                value={selectedChannelId}
                onChange={(event) => setSelectedChannelId(event.target.value)}
                disabled={channelsLoading || isRunning || channels.length === 0}
              >
                {channels.length === 0 ? (
                  <option value="">No connected X account</option>
                ) : (
                  channels.map((channel) => (
                    <option key={channel.channelId} value={channel.channelId}>
                      {channel.label}
                    </option>
                  ))
                )}
              </select>
              <div className="mt-2 text-xs text-werbens-muted flex flex-wrap items-center gap-3">
                <span>User: {userId || "Not signed in"}</span>
                {selectedChannel?.handle ? <span>Handle: @{selectedChannel.handle}</span> : null}
                <span>Live refresh: {pendingCountForPolling > 0 ? "every 4s" : "every 10s"}</span>
                {lastUpdatedAt ? <span>Last sync: {formatDateTime(lastUpdatedAt)}</span> : null}
                <Link href="/accounts" className="text-werbens-dark-cyan hover:underline">
                  Manage connected accounts
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadChannels}
                disabled={channelsLoading || isRunning || userLoading}
                className="rounded-xl border border-werbens-dark-cyan/20 px-4 py-2 text-sm font-medium text-werbens-text hover:bg-werbens-surface disabled:opacity-60"
              >
                {channelsLoading ? "Refreshing..." : "Refresh accounts"}
              </button>
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={isRunning || !selectedChannelId || userLoading}
                className="rounded-xl border border-werbens-dark-cyan/20 px-4 py-2 text-sm font-semibold text-werbens-dark-cyan hover:bg-werbens-surface disabled:opacity-60"
              >
                {actionBusy === "preview" ? "Generating..." : "Generate Preview"}
              </button>
              <button
                type="button"
                onClick={handleTrigger}
                disabled={isRunning || !selectedChannelId || userLoading}
                className="rounded-xl bg-werbens-dark-cyan px-4 py-2 text-sm font-semibold text-white hover:bg-werbens-dark-cyan/90 disabled:opacity-60"
              >
                {actionBusy === "trigger" ? "Running..." : "Trigger Cycle Now"}
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-werbens-muted">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={quickTestMode}
                onChange={(event) => setQuickTestMode(event.target.checked)}
              />
              Quick test mode (text-only)
            </label>
            <label className="inline-flex items-center gap-2">
              <span>Spacing (minutes)</span>
              <input
                type="number"
                min={1}
                max={60}
                value={quickTestSpacingMinutes}
                onChange={(event) => setQuickTestSpacingMinutes(Math.max(1, Math.min(60, Number(event.target.value) || 1)))}
                className="w-16 rounded-lg border border-werbens-dark-cyan/20 px-2 py-1 text-xs text-werbens-text"
              />
            </label>
            <span>Measurement plan: {measurementPlan}</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <button
              type="button"
              onClick={handleStart}
              disabled={isRunning || !selectedChannelId || userLoading}
              className="h-10 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 disabled:opacity-60"
            >
              {actionBusy === "start" ? "Starting..." : "Start Auto Loop"}
            </button>
            <button
              type="button"
              onClick={handlePause}
              disabled={isRunning || !selectedChannelId || userLoading}
              className="h-10 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 disabled:opacity-60"
            >
              {actionBusy === "pause" ? "Pausing..." : "Pause Auto Loop"}
            </button>
            <label className="rounded-xl border border-werbens-dark-cyan/10 bg-white px-3 py-2 text-xs text-werbens-muted">
              Max posts/day
              <input
                type="number"
                min={1}
                max={4}
                value={configDraft.maxPostsPerDay}
                onChange={(event) => setConfigDraft((prev) => ({ ...prev, maxPostsPerDay: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-werbens-dark-cyan/20 px-2 py-1 text-sm text-werbens-text"
              />
            </label>
            <label className="rounded-xl border border-werbens-dark-cyan/10 bg-white px-3 py-2 text-xs text-werbens-muted">
              Text variants/run
              <input
                type="number"
                min={2}
                max={8}
                value={configDraft.textVariantsPerRun}
                onChange={(event) => setConfigDraft((prev) => ({ ...prev, textVariantsPerRun: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-werbens-dark-cyan/20 px-2 py-1 text-sm text-werbens-text"
              />
            </label>
            <label className="rounded-xl border border-werbens-dark-cyan/10 bg-white px-3 py-2 text-xs text-werbens-muted">
              Image variants/run
              <input
                type="number"
                min={1}
                max={4}
                value={configDraft.imageVariantsPerRun}
                onChange={(event) => setConfigDraft((prev) => ({ ...prev, imageVariantsPerRun: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-werbens-dark-cyan/20 px-2 py-1 text-sm text-werbens-text"
              />
            </label>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={isRunning || !selectedChannelId || userLoading}
              className="h-10 rounded-xl border border-werbens-dark-cyan/20 bg-white text-werbens-text text-sm font-semibold hover:bg-werbens-surface disabled:opacity-60"
            >
              {actionBusy === "config" ? "Saving..." : "Save policy"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-werbens-muted">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(configDraft.allowImages)}
                onChange={(event) => setConfigDraft((prev) => ({ ...prev, allowImages: event.target.checked }))}
              />
              Enable image generation
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(configDraft.allowTextOnly)}
                onChange={(event) => setConfigDraft((prev) => ({ ...prev, allowTextOnly: event.target.checked }))}
              />
              Enable text-only mode
            </label>
            <span>Status: {String(config?.status || "paused")}</span>
            <span>Autonomous: {config?.autonomousMode ? "on" : "off"}</span>
          </div>

          {isRunning ? (
            <div className="mt-4 rounded-xl border border-werbens-dark-cyan/15 bg-werbens-surface/70 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-werbens-text">
                  Running generation and scheduling...
                </p>
                <span className="text-xs font-semibold text-werbens-dark-cyan">In progress</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-werbens-cloud overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan animate-pulse" style={{ width: "62%" }} />
              </div>
              <p className="mt-2 text-xs text-amber-700 font-medium">Taking longer to seem like a human</p>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}
          {notice ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
          ) : null}
          {(lastTriggerSummary || latestRunSummary) ? (
            <div className="mt-4 rounded-xl border border-werbens-dark-cyan/10 bg-white px-3 py-2 text-xs text-werbens-muted">
              {(() => {
                const summary = lastTriggerSummary || latestRunSummary || {};
                const summaryScheduledIds = Array.isArray(summary?.scheduledPostIds)
                  ? summary.scheduledPostIds
                  : summary?.scheduledPostId
                    ? [summary.scheduledPostId]
                    : [];
                const summaryFeedbackIds = Array.isArray(summary?.feedbackPostIds)
                  ? summary.feedbackPostIds
                  : summary?.feedbackPostId
                    ? [summary.feedbackPostId]
                    : [];
                return (
                  <>
                    <p>
                      Latest scheduling feedback: Scheduled {Number(summary?.scheduledCount || summaryScheduledIds.length || 0)} post(s) | First at{" "}
                      {formatDateTime(summary?.scheduledAt)}
                    </p>
                    <p className="mt-1">
                      Selected mode: {summary?.selectedMode || "-"} | Media attached:{" "}
                      {summary?.mediaAttached ? "yes" : "no"} | Quick test: {summary?.quickTest ? "yes" : "no"}
                    </p>
                    {summaryScheduledIds.length > 0 ? (
                      <p className="mt-1">
                        Scheduled IDs: {summaryScheduledIds.map((id) => shortId(id)).join(", ")}
                      </p>
                    ) : null}
                    {summaryFeedbackIds.length > 0 ? (
                      <p className="mt-1">
                        Feedback IDs: {summaryFeedbackIds.map((id) => shortId(id)).join(", ")}
                      </p>
                    ) : null}
                  </>
                );
              })()}
            </div>
          ) : null}
        </div>

        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Posted" value={formatNumber(dashboard?.kpis?.postedCount || 0)} accent="text-emerald-600" />
          <KpiCard label="Pending" value={formatNumber(dashboard?.kpis?.pendingCount || 0)} accent="text-cyan-700" />
          <KpiCard label="Avg Engagement" value={formatPercent(dashboard?.kpis?.avgEngagementRate || 0)} accent="text-werbens-dark-cyan" />
          <KpiCard label="Generation Runs" value={formatNumber(dashboard?.kpis?.generationHistoryCount || history.length)} />
        </section>

        <section className="mt-4 rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-werbens-text">Latest run post queue</p>
              <p className="text-xs text-werbens-muted mt-1">
                Tracks all posts from the latest run without manual refresh.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-cyan-700">
                scheduled {scheduledCountForRun}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">
                posted {postedCountForRun}
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
                pending {pendingCountForRun}
              </span>
              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-red-700">
                failed {failedCountForRun}
              </span>
            </div>
          </div>

          {postsForLatestRun.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-werbens-steel/30 bg-werbens-surface/40 p-3 text-xs text-werbens-muted">
              No queued posts found for the latest run yet.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
              {postsForLatestRun.map((post, idx) => (
                <article
                  key={`run-queue-${post?._id || idx}`}
                  className="rounded-lg border border-werbens-steel/20 bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-werbens-text">
                      #{idx + 1} · {shortId(post?.selectedTextVariantId)}
                    </p>
                    <span className={`text-[10px] rounded-full px-2 py-0.5 ${statusBadgeClass(post?.status)}`}>
                      {String(post?.status || "pending")}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-werbens-muted">
                    Scheduled: {formatDateTime(post?.scheduledAt)} | Posted: {formatDateTime(post?.postedAt)}
                  </p>
                  {post?.platformPostId ? (
                    <p className="mt-1 text-[11px] text-werbens-muted">Platform Post ID: {shortId(post.platformPostId)}</p>
                  ) : null}
                  {post?.content?.caption ? (
                    <p className="mt-2 text-xs text-werbens-text line-clamp-2">{post.content.caption}</p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 sm:p-6 shadow-elevated">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-werbens-text">Latest generation run</h2>
              <p className="text-sm text-werbens-muted mt-1">
                Text + image variants, selected winner, and rationale from the latest run.
              </p>
            </div>
            <div className="text-xs text-werbens-muted text-right">
              <p>Run ID: {shortId(generationRun?.runId)}</p>
              <p>Generated at: {formatDateTime(generationRun?.createdAt)}</p>
            </div>
          </div>

          {!generationRun ? (
            <div className="mt-4 rounded-xl border border-dashed border-werbens-dark-cyan/25 bg-werbens-surface/40 px-4 py-8 text-sm text-werbens-muted text-center">
              No generation run found yet. Use <strong>Generate Preview</strong> or <strong>Trigger Cycle Now</strong>.
            </div>
          ) : (
            <>
              <div className="mt-4 rounded-xl border border-werbens-dark-cyan/15 bg-werbens-mist/30 p-3">
                <div className="flex flex-wrap items-center gap-3 text-xs text-werbens-muted">
                  <span>Selected mode: {generationRun.selectedMode}</span>
                  <span>Score: {Number(generationRun.selectedScore || 0).toFixed(2)}</span>
                  <span>
                    Policy: {generationRun.policy?.exploit ? "exploit" : "explore"} ({Math.round((Number(generationRun.policy?.explorationRate || 0) || 0) * 100)}% explore)
                  </span>
                </div>
                {generationRun.selectedText?.reasoning ? (
                  <p className="mt-2 text-sm text-werbens-text">Rationale: {generationRun.selectedText.reasoning}</p>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                <div className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-3">
                  <p className="text-sm font-semibold text-werbens-text">Text variants ({generationRun.textVariants.length})</p>
                  <div className="mt-3 space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {generationRun.textVariants.map((variant) => {
                      const selected = variant?.variantId === generationRun.selectedTextVariantId;
                      return (
                        <div
                          key={variant?.variantId || variant?.caption}
                          className={`rounded-lg border px-3 py-2 ${
                            selected ? "border-emerald-300 bg-emerald-50" : "border-werbens-steel/20 bg-white"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-werbens-muted">
                            <span>{variant?.variantId || "-"}</span>
                            <span>hook: {variant?.hookStyle || "-"}</span>
                            <span>tone: {variant?.tone || "-"}</span>
                            <span>cta: {variant?.ctaType || "none"}</span>
                            {selected ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 font-semibold">
                                selected
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-werbens-text whitespace-pre-wrap">{variant?.caption || "-"}</p>
                          {Array.isArray(variant?.hashtags) && variant.hashtags.length > 0 ? (
                            <p className="mt-1 text-[11px] text-werbens-muted">#{variant.hashtags.join(" #")}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-3">
                  <p className="text-sm font-semibold text-werbens-text">Image variants ({generationRun.imageVariants.length})</p>
                  <div className="mt-3 space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {generationRun.imageVariants.length === 0 ? (
                      <p className="text-sm text-werbens-muted">Image generation disabled or no image variants in this run.</p>
                    ) : (
                      generationRun.imageVariants.map((variant) => {
                        const selected = variant?.variantId === generationRun.selectedImageVariantId;
                        return (
                          <div
                            key={variant?.variantId || variant?.imagePrompt}
                            className={`rounded-lg border px-3 py-2 ${
                              selected ? "border-emerald-300 bg-emerald-50" : "border-werbens-steel/20 bg-white"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {variant?.imageUrl ? (
                                <img
                                  src={variant.imageUrl}
                                  alt="Generated variant"
                                  className="h-16 w-16 rounded-md object-cover border border-werbens-steel/20"
                                />
                              ) : (
                                <div className="h-16 w-16 rounded-md bg-werbens-mist/60 border border-werbens-steel/20" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-werbens-muted">
                                  <span>{variant?.variantId || "-"}</span>
                                  <span>style: {variant?.visualStyle || "-"}</span>
                                  {selected ? (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 font-semibold">
                                      selected
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-sm text-werbens-text line-clamp-3">{variant?.imagePrompt || "-"}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-werbens-dark-cyan/10 bg-white p-3">
                <p className="text-sm font-semibold text-werbens-text">Generated - Scheduled - Posted - Measured</p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <TimelineStep label="Generated" done={generatedDone} active={generatedDone && !scheduledDone} />
                  <TimelineStep label="Scheduled" done={scheduledDone} active={scheduledDone && !postedDone} />
                  <TimelineStep label="Posted" done={postedDone} active={postedDone && !measuredDone} />
                  <TimelineStep label="Measured" done={measuredDone} active={false} />
                </div>
                {latestPost ? (
                  <p className="mt-2 text-xs text-werbens-muted">
                    Latest post status: {latestPost.status || "-"} | Scheduled: {formatDateTime(latestPost.scheduledAt)} | Posted: {formatDateTime(latestPost.postedAt)}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-werbens-muted">
                  Run queue: {scheduledCountForRun} scheduled | {postedCountForRun} posted | {pendingCountForRun} pending | {failedCountForRun} failed
                </p>
                <p className="mt-1 text-xs text-werbens-muted">
                  Measurement checkpoints: {measurementPlan}
                </p>
              </div>
            </>
          )}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 sm:p-6 shadow-elevated">
            <h2 className="text-lg font-semibold text-werbens-text">Variant performance table</h2>
            <p className="text-sm text-werbens-muted mt-1">Selected variant lineage against engagement outcomes.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="text-left text-werbens-muted border-b border-werbens-steel/20">
                    <th className="py-2 pr-3">Run</th>
                    <th className="py-2 pr-3">Created</th>
                    <th className="py-2 pr-3">Mode</th>
                    <th className="py-2 pr-3">Hook</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Engagement</th>
                    <th className="py-2 pr-3">Impressions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td className="py-4 text-werbens-muted" colSpan={7}>
                        No generation history yet.
                      </td>
                    </tr>
                  ) : (
                    history.map((row) => {
                      const metrics = row?.performance?.metrics || {};
                      return (
                        <tr key={`history-${row.runId}`} className="border-b border-werbens-steel/10">
                          <td className="py-2 pr-3 text-werbens-text font-medium">{shortId(row.runId)}</td>
                          <td className="py-2 pr-3 text-werbens-muted">{formatDateTime(row.createdAt)}</td>
                          <td className="py-2 pr-3 text-werbens-muted">{row.selectedMode || "-"}</td>
                          <td className="py-2 pr-3 text-werbens-muted">{row?.selectedText?.hookStyle || "-"}</td>
                          <td className="py-2 pr-3 text-werbens-muted">{row?.performance?.status || "-"}</td>
                          <td className="py-2 pr-3 text-werbens-text">{formatPercent(metrics?.engagementRate || 0)}</td>
                          <td className="py-2 pr-3 text-werbens-muted">{formatNumber(metrics?.impressions || 0)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <VariantBarChart rows={chartRows} />

            <div className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-4">
              <p className="text-sm font-semibold text-werbens-text">Similar variant benchmark</p>
              <p className="text-xs text-werbens-muted mt-1">
                Comparing selected hook style against historical average.
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-werbens-muted">Selected hook style</span>
                  <span className="font-semibold text-werbens-text">{selectedTextHook || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-werbens-muted">Similar-run avg engagement</span>
                  <span className="font-semibold text-werbens-text">{formatPercent(similarHookAvg)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-werbens-muted">Overall avg engagement</span>
                  <span className="font-semibold text-werbens-text">{formatPercent(overallAvg)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-werbens-muted">Similar runs count</span>
                  <span className="font-semibold text-werbens-text">{formatNumber(similarHookRows.length)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-4">
              <p className="text-sm font-semibold text-werbens-text">Collection status</p>
              <p className="mt-2 text-xs text-werbens-muted">
                Mongo collections used: FeedbackLoopConfig, FeedbackLoopRun, FeedbackLoopTask, FeedbackLoopPost,
                FeedbackGenerationText, FeedbackGenerationImage, FeedbackGenerationSelection.
              </p>
            </div>

            <div className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-4">
              <p className="text-sm font-semibold text-werbens-text">Measurement checkpoints</p>
              <p className="mt-1 text-xs text-werbens-muted">Tracks delayed snapshots; not instant by design.</p>
              {checkpointRows.length === 0 ? (
                <p className="mt-3 text-xs text-werbens-muted">No checkpoint tasks found yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {checkpointRows.map((row) => (
                    <div key={`checkpoint-${row.checkpoint}`} className="rounded-lg border border-werbens-steel/20 bg-white px-2 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-werbens-text">{row.checkpoint}</span>
                        <span className={`text-[10px] rounded-full px-2 py-0.5 ${statusBadgeClass(row.failed > 0 ? "failed" : row.pending > 0 ? "pending" : "completed")}`}>
                          total {row.total}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-werbens-muted">
                        done {row.completed} | pending {row.pending} | processing {row.processing} | failed {row.failed}
                      </p>
                      {row.nextDueAt ? (
                        <p className="text-[11px] text-werbens-muted">next due {formatDateTime(row.nextDueAt)}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {loadingDashboard ? (
          <div className="mt-6 text-sm text-werbens-muted">Loading dashboard...</div>
        ) : null}
      </section>
    </main>
  );
}
