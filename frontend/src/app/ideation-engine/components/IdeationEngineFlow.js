"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import {
  getSocialAccounts,
  getYoutubeIdeationDashboard,
  searchYoutubeIdeationChannels,
  addYoutubeIdeationTrackedChannel,
  removeYoutubeIdeationTrackedChannel,
} from "@/api/services/socialService";

function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return new Intl.NumberFormat().format(num);
}

function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0%";
  return `${num.toFixed(2)}%`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatHourUtcLabel(value) {
  const hour = Number(value);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return "—";
  return `${String(hour).padStart(2, "0")}:00 UTC`;
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-werbens-dark-cyan/10 bg-white/70 p-3">
      <p className="text-[11px] uppercase tracking-wider text-werbens-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-werbens-text">{value}</p>
    </div>
  );
}

function ComparisonBar({ label, ownValue, trackedValue }) {
  const own = Number(ownValue) || 0;
  const tracked = Number(trackedValue) || 0;
  const max = Math.max(1, own, tracked);
  const ownPct = (own / max) * 100;
  const trackedPct = (tracked / max) * 100;

  return (
    <div className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-3">
      <p className="text-xs font-medium text-werbens-text mb-2">{label}</p>
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-[11px] text-werbens-muted mb-1">
            <span>Your channel</span>
            <span>{formatNumber(own)}</span>
          </div>
          <div className="h-2 rounded-full bg-werbens-mist/60">
            <div className="h-full rounded-full bg-werbens-dark-cyan" style={{ width: `${ownPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-[11px] text-werbens-muted mb-1">
            <span>Tracked benchmark</span>
            <span>{formatNumber(tracked)}</span>
          </div>
          <div className="h-2 rounded-full bg-werbens-mist/60">
            <div className="h-full rounded-full bg-[#79b6bc]" style={{ width: `${trackedPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionTile({ title, value, hint }) {
  return (
    <div className="rounded-xl border border-werbens-dark-cyan/10 bg-werbens-mist/25 p-3">
      <p className="text-[11px] uppercase tracking-wider text-werbens-muted">{title}</p>
      <p className="mt-1 text-base font-semibold text-werbens-text">{value}</p>
      {hint ? <p className="mt-1 text-xs text-werbens-muted">{hint}</p> : null}
    </div>
  );
}

function ChannelCard({ item, onAdd, addBusyId, onRemove, removeBusyId, addLabel = "Track" }) {
  const channelId = String(item?.channelId || "");
  const title = String(item?.title || channelId);
  const thumbnail = item?.thumbnail || null;
  const isAddBusy = addBusyId === channelId;
  const isRemoveBusy = removeBusyId === channelId;

  return (
    <div className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-3">
      <div className="flex gap-3">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="h-12 w-12 rounded-lg object-cover" />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-werbens-mist/60" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-werbens-text truncate">{title}</p>
          {item?.handle ? <p className="text-xs text-werbens-muted truncate">{item.handle}</p> : null}
          <p className="text-xs text-werbens-muted mt-1 truncate">
            {formatNumber(item?.stats?.subscriberCount ?? item?.subscriberCount ?? 0)} subscribers
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {onAdd ? (
          <button
            type="button"
            onClick={() => onAdd(item)}
            disabled={isAddBusy}
            className="h-8 px-3 rounded-lg bg-werbens-dark-cyan text-white text-xs font-semibold hover:opacity-95 disabled:opacity-60"
          >
            {isAddBusy ? "Adding..." : addLabel}
          </button>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            onClick={() => onRemove(item)}
            disabled={isRemoveBusy}
            className="h-8 px-3 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-60"
          >
            {isRemoveBusy ? "Removing..." : "Remove"}
          </button>
        ) : null}
        <a
          href={item?.url || `https://www.youtube.com/channel/${encodeURIComponent(channelId)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-werbens-dark-cyan hover:underline"
        >
          Open
        </a>
      </div>
    </div>
  );
}

export function IdeationEngineFlow() {
  const { userId, loading: userLoading } = useCurrentUser();

  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");

  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [addBusyId, setAddBusyId] = useState("");
  const [removeBusyId, setRemoveBusyId] = useState("");

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
      const accounts = Array.isArray(response?.accounts) ? response.accounts : [];
      const youtubeAccounts = accounts.filter((account) => account?.platform === "youtube");

      const channelMap = new Map();
      for (const account of youtubeAccounts) {
        const accountChannels = Array.isArray(account?.channels) ? account.channels : [];
        if (accountChannels.length > 0) {
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

      const list = Array.from(channelMap.values()).sort((a, b) => a.label.localeCompare(b.label));
      setChannels(list);
      setSelectedChannelId((prev) => {
        if (prev && list.some((item) => item.channelId === prev)) return prev;
        return list[0]?.channelId || "";
      });
    } catch (err) {
      setChannels([]);
      setSelectedChannelId("");
      setError(err?.message || "Failed to load YouTube channels.");
    } finally {
      setChannelsLoading(false);
    }
  }, [userId]);

  const loadDashboard = useCallback(async () => {
    if (!userId || !selectedChannelId) {
      setDashboard(null);
      return;
    }

    setDashboardLoading(true);
    setError("");
    try {
      const response = await getYoutubeIdeationDashboard(userId, { channelId: selectedChannelId });
      setDashboard(response || null);
    } catch (err) {
      setDashboard(null);
      setError(err?.message || "Failed to load ideation dashboard.");
    } finally {
      setDashboardLoading(false);
    }
  }, [userId, selectedChannelId]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const trackedChannels = Array.isArray(dashboard?.trackedChannels) ? dashboard.trackedChannels : [];
  const suggestions = Array.isArray(dashboard?.suggestions) ? dashboard.suggestions : [];
  const latestFeed = Array.isArray(dashboard?.latestFeed) ? dashboard.latestFeed : [];
  const insights = Array.isArray(dashboard?.insights) ? dashboard.insights : [];

  const comparisonOwn = dashboard?.comparison?.own || null;
  const comparisonTracked = Array.isArray(dashboard?.comparison?.tracked)
    ? dashboard.comparison.tracked
    : [];
  const benchmark = dashboard?.comparison?.benchmark || null;
  const ownVsBenchmark = benchmark?.ownVsBenchmark || null;
  const bestPostingWindow = benchmark?.bestPostingWindowUtc || null;

  const totalTrackedSubscribers = useMemo(
    () => trackedChannels.reduce((sum, row) => sum + Number(row?.stats?.subscriberCount || 0), 0),
    [trackedChannels]
  );

  const comparisonActions = useMemo(() => {
    if (!comparisonOwn || !benchmark) return [];

    const viewGap = Number(ownVsBenchmark?.avgViewsGap || 0);
    const engagementGap = Number(ownVsBenchmark?.engagementRateGap || 0);
    const cadenceGap = Number(ownVsBenchmark?.cadenceGapDays || 0);

    const items = [
      {
        title: "Views target",
        value: viewGap > 0 ? `+${formatNumber(Math.round(viewGap))} avg views` : "On benchmark",
        hint:
          viewGap > 0
            ? `You need roughly ${formatPercent(ownVsBenchmark?.avgViewsGapPct || 0)} more views per upload to match tracked channels.`
            : "Recent average views are meeting or beating tracked benchmark.",
      },
      {
        title: "Engagement target",
        value: engagementGap > 0 ? `+${engagementGap.toFixed(2)} pts` : "On benchmark",
        hint:
          engagementGap > 0
            ? "Increase comments + likes per upload to close this gap."
            : "Engagement rate is on par with tracked benchmark.",
      },
      {
        title: "Cadence signal",
        value:
          cadenceGap > 0
            ? `${cadenceGap.toFixed(2)} days slower`
            : `${Math.abs(cadenceGap).toFixed(2)} days faster`,
        hint:
          cadenceGap > 0
            ? "Tracked channels post more frequently. Shorter publishing gaps may help."
            : "Your publishing cadence is as frequent as, or faster than, tracked channels.",
      },
    ];

    if (bestPostingWindow?.weekdayUtc && Number.isInteger(bestPostingWindow?.hourUtc)) {
      items.push({
        title: "Best tracked posting window",
        value: `${bestPostingWindow.weekdayUtc} ${formatHourUtcLabel(bestPostingWindow.hourUtc)}`,
        hint: `Top tracked window by average views (${formatNumber(bestPostingWindow?.avgViews || 0)} avg views).`,
      });
    }

    return items;
  }, [benchmark, comparisonOwn, ownVsBenchmark, bestPostingWindow]);

  const performSearch = async (event) => {
    event.preventDefault();
    if (!userId || !selectedChannelId) {
      setError("Select a YouTube channel first.");
      return;
    }

    const q = String(searchQuery || "").trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setError("");
    try {
      const response = await searchYoutubeIdeationChannels(userId, q, { channelId: selectedChannelId });
      setSearchResults(Array.isArray(response?.results) ? response.results : []);
    } catch (err) {
      setSearchResults([]);
      setError(err?.message || "Failed to search channels.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddTracked = async (item, addedBy = "manual") => {
    if (!userId || !selectedChannelId || !item?.channelId) return;
    setAddBusyId(item.channelId);
    setError("");
    try {
      await addYoutubeIdeationTrackedChannel(userId, {
        channelId: selectedChannelId,
        trackedChannelId: item.channelId,
        addedBy,
      });
      await loadDashboard();
      setSearchResults((prev) =>
        prev.map((row) =>
          row?.channelId === item.channelId
            ? {
                ...row,
                isTracked: true,
              }
            : row
        )
      );
    } catch (err) {
      setError(err?.message || "Failed to add tracked channel.");
    } finally {
      setAddBusyId("");
    }
  };

  const handleRemoveTracked = async (item) => {
    if (!userId || !selectedChannelId || !item?.channelId) return;
    setRemoveBusyId(item.channelId);
    setError("");
    try {
      await removeYoutubeIdeationTrackedChannel(userId, {
        channelId: selectedChannelId,
        trackedChannelId: item.channelId,
      });
      await loadDashboard();
      setSearchResults((prev) =>
        prev.map((row) =>
          row?.channelId === item.channelId
            ? {
                ...row,
                isTracked: false,
              }
            : row
        )
      );
    } catch (err) {
      setError(err?.message || "Failed to remove tracked channel.");
    } finally {
      setRemoveBusyId("");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface">
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm uppercase tracking-[0.14em] text-werbens-dark-cyan/80 font-medium">
            Youtube
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-werbens-text">Ideation Engine</h1>
          <p className="mt-2 text-sm sm:text-base text-werbens-muted">
            Stay updated on tracked creators, discover new channels, and compare performance signals in one place.
          </p>
        </div>

        <div className="rounded-2xl border border-werbens-dark-cyan/10 bg-white/80 backdrop-blur p-4 sm:p-6 shadow-elevated">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 lg:items-end">
            <div>
              <label className="text-sm font-semibold text-werbens-text" htmlFor="ideation-channel-select">
                Channel context
              </label>
              <select
                id="ideation-channel-select"
                value={selectedChannelId}
                onChange={(event) => setSelectedChannelId(event.target.value)}
                disabled={channelsLoading || dashboardLoading}
                className="mt-2 w-full h-11 rounded-xl border border-werbens-dark-cyan/15 bg-white px-3 text-sm text-werbens-text focus:outline-none focus:ring-2 focus:ring-werbens-dark-cyan/30"
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
                onClick={loadChannels}
                disabled={channelsLoading || dashboardLoading}
                className="h-11 px-4 rounded-xl border border-werbens-dark-cyan/20 text-sm font-medium text-werbens-text hover:bg-werbens-mist/40 disabled:opacity-60"
              >
                Refresh channels
              </button>
              <button
                type="button"
                onClick={loadDashboard}
                disabled={channelsLoading || dashboardLoading || !selectedChannelId}
                className="h-11 px-4 rounded-xl bg-werbens-dark-cyan text-white text-sm font-semibold hover:opacity-95 disabled:opacity-60"
              >
                {dashboardLoading ? "Refreshing..." : "Refresh ideation"}
              </button>
            </div>
          </div>

          <div className="mt-3 text-xs text-werbens-muted">
            {userLoading ? "Checking user..." : `User: ${userId || "—"}`}
            {dashboard?.context?.lastRefreshedAt
              ? `  Last refresh: ${formatDateTime(dashboard.context.lastRefreshedAt)}`
              : ""}
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}
        </div>

        <form onSubmit={performSearch} className="mt-4 rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
          <label className="text-sm font-semibold text-werbens-text" htmlFor="ideation-search">
            Discover channels to track
          </label>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <input
              id="ideation-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search channels by niche, keyword, or creator"
              className="h-11 flex-1 rounded-xl border border-werbens-dark-cyan/15 px-3 text-sm text-werbens-text focus:outline-none focus:ring-2 focus:ring-werbens-dark-cyan/30"
            />
            <button
              type="submit"
              disabled={searchLoading || !selectedChannelId}
              className="h-11 px-4 rounded-xl bg-werbens-dark-cyan text-white text-sm font-semibold hover:opacity-95 disabled:opacity-60"
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {searchResults.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
            <h2 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider mb-3">Search results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {searchResults.map((item) => (
                <ChannelCard
                  key={`search-${item.channelId}`}
                  item={item}
                  addBusyId={addBusyId}
                  onAdd={item?.isTracked ? null : (channel) => handleAddTracked(channel, "manual")}
                  addLabel={item?.isTracked ? "Tracked" : "Track"}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
            <h2 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider mb-3">Tracked channels</h2>
            {trackedChannels.length === 0 ? (
              <p className="text-sm text-werbens-muted">No channels tracked yet. Add channels from search or suggestions.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trackedChannels.map((item) => (
                  <ChannelCard
                    key={`tracked-${item.channelId}`}
                    item={item}
                    onRemove={handleRemoveTracked}
                    removeBusyId={removeBusyId}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider">Suggested channels</h2>
              {dashboard?.context?.usedAccountContext ? (
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-1">
                  Context-aware suggestions enabled
                </span>
              ) : null}
            </div>

            {Array.isArray(dashboard?.context?.suggestionQueries) && dashboard.context.suggestionQueries.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {dashboard.context.suggestionQueries.map((query) => (
                  <span
                    key={`suggestion-query-${query}`}
                    className="text-[11px] rounded-full border border-werbens-dark-cyan/15 bg-werbens-mist/40 px-2 py-1 text-werbens-muted"
                  >
                    {query}
                  </span>
                ))}
              </div>
            ) : null}

            {suggestions.length === 0 ? (
              <p className="text-sm text-werbens-muted">No suggestions available right now. Refresh ideation.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map((item) => (
                  <div key={`suggestion-${item.channelId}`} className="rounded-xl border border-werbens-dark-cyan/10 bg-werbens-mist/10 p-2">
                    <ChannelCard
                      item={item}
                      onAdd={(channel) => handleAddTracked(channel, "suggested")}
                      addBusyId={addBusyId}
                      addLabel="Add"
                    />
                    {item?.reason ? <p className="text-[11px] text-werbens-muted mt-2 px-1">{item.reason}</p> : null}
                    {Array.isArray(item?.matchedTokens) && item.matchedTokens.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1 px-1">
                        {item.matchedTokens.slice(0, 4).map((token) => (
                          <span
                            key={`${item.channelId}-${token}`}
                            className="text-[10px] rounded-full bg-white border border-werbens-dark-cyan/10 px-2 py-0.5 text-werbens-muted"
                          >
                            {token}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="Tracked channels" value={formatNumber(trackedChannels.length)} />
          <MiniStat label="Tracked subscribers" value={formatNumber(totalTrackedSubscribers)} />
          <MiniStat label="Latest feed items" value={formatNumber(latestFeed.length)} />
          <MiniStat label="Suggestion limit" value={formatNumber(dashboard?.context?.maxTrackedChannels || 0)} />
        </div>

        <div className="mt-4 rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
          <h2 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider mb-3">Comparison snapshot</h2>

          {comparisonOwn ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
                <div className="rounded-xl border border-werbens-dark-cyan/10 bg-werbens-mist/25 p-3">
                  <p className="text-sm font-semibold text-werbens-text">{comparisonOwn.title || "Your channel"}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-werbens-muted">
                    <p>Subscribers: <span className="font-semibold text-werbens-text">{formatNumber(comparisonOwn?.stats?.subscriberCount)}</span></p>
                    <p>Total views: <span className="font-semibold text-werbens-text">{formatNumber(comparisonOwn?.stats?.viewCount)}</span></p>
                    <p>Recent avg views: <span className="font-semibold text-werbens-text">{formatNumber(comparisonOwn?.recent?.avgViews)}</span></p>
                    <p>Recent engagement rate: <span className="font-semibold text-werbens-text">{formatPercent(comparisonOwn?.recent?.engagementRate)}</span></p>
                    <p>Avg engagement / upload: <span className="font-semibold text-werbens-text">{formatNumber(comparisonOwn?.recent?.avgEngagement)}</span></p>
                    <p>Upload cadence: <span className="font-semibold text-werbens-text">{formatNumber(comparisonOwn?.recent?.averageUploadGapDays)} days</span></p>
                  </div>
                </div>

                <div className="space-y-2">
                  <ComparisonBar
                    label="Average views (recent uploads)"
                    ownValue={comparisonOwn?.recent?.avgViews}
                    trackedValue={benchmark?.trackedAvgViews}
                  />
                  <ComparisonBar
                    label="Engagement rate (%)"
                    ownValue={comparisonOwn?.recent?.engagementRate}
                    trackedValue={benchmark?.trackedAvgEngagementRate}
                  />
                </div>
              </div>

              {comparisonActions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {comparisonActions.map((item) => (
                    <ActionTile key={item.title} title={item.title} value={item.value} hint={item.hint} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-werbens-muted">No comparison data yet.</p>
          )}

          {comparisonTracked.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-werbens-muted border-b border-werbens-dark-cyan/10">
                    <th className="py-2 pr-4">Channel</th>
                    <th className="py-2 pr-4">Subscribers</th>
                    <th className="py-2 pr-4">Recent avg views</th>
                    <th className="py-2 pr-4">Views vs yours</th>
                    <th className="py-2 pr-4">Avg engagement/upload</th>
                    <th className="py-2 pr-4">Engagement rate</th>
                    <th className="py-2 pr-4">Upload cadence</th>
                    <th className="py-2 pr-4">Latest upload</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonTracked.map((row) => (
                    <tr key={`cmp-${row.channelId}`} className="border-b border-werbens-dark-cyan/8">
                      <td className="py-2 pr-4">
                        <span className="font-medium text-werbens-text">{row.title || row.channelId}</span>
                      </td>
                      <td className="py-2 pr-4">{formatNumber(row?.stats?.subscriberCount)}</td>
                      <td className="py-2 pr-4">{formatNumber(row?.recent?.avgViews)}</td>
                      <td className={`py-2 pr-4 ${Number(row?.deltaVsOwn?.avgViewsDeltaPct) >= 0 ? "text-amber-700" : "text-emerald-700"}`}>
                        {Number(row?.deltaVsOwn?.avgViewsDeltaPct) >= 0 ? "+" : ""}
                        {formatPercent(row?.deltaVsOwn?.avgViewsDeltaPct)}
                      </td>
                      <td className="py-2 pr-4">{formatNumber(row?.recent?.avgEngagement)}</td>
                      <td className="py-2 pr-4">{formatPercent(row?.recent?.engagementRate)}</td>
                      <td className="py-2 pr-4">{formatNumber(row?.recent?.averageUploadGapDays)} days</td>
                      <td className="py-2 pr-4">{formatDateTime(row?.recent?.latestPublishedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <div className="mt-4 rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
          <h2 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider mb-3">Latest tracked uploads</h2>
          {latestFeed.length === 0 ? (
            <p className="text-sm text-werbens-muted">No latest feed yet. Track channels and refresh ideation.</p>
          ) : (
            <ul className="space-y-3">
              {latestFeed.map((item) => (
                <li key={`feed-${item.videoId}`} className="rounded-xl border border-werbens-dark-cyan/10 bg-werbens-mist/20 p-3">
                  <div className="flex gap-3">
                    {item?.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="h-20 w-36 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-20 w-36 rounded-lg bg-werbens-mist/60 shrink-0" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {item?.channelThumbnail ? (
                          <img src={item.channelThumbnail} alt="" className="h-6 w-6 rounded-full object-cover" />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-werbens-mist/60" />
                        )}
                        <p className="text-xs font-semibold text-werbens-text truncate">{item.channelTitle || item.channelId}</p>
                        <span className="text-[11px] text-werbens-muted">{formatDateTime(item.publishedAt)}</span>
                      </div>

                      <p className="mt-1 text-sm font-semibold text-werbens-text line-clamp-2">{item.title || item.videoId}</p>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-werbens-muted">
                        <span className="rounded-full bg-white px-2 py-1 border border-werbens-dark-cyan/10">{formatNumber(item.views)} views</span>
                        <span className="rounded-full bg-white px-2 py-1 border border-werbens-dark-cyan/10">{formatNumber(item.likes)} likes</span>
                        <span className="rounded-full bg-white px-2 py-1 border border-werbens-dark-cyan/10">{formatNumber(item.comments)} comments</span>
                        <span className="rounded-full bg-white px-2 py-1 border border-werbens-dark-cyan/10">{formatNumber(item.engagement)} engagement</span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-werbens-dark-cyan hover:underline self-center"
                        >
                          Watch on YouTube
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
          <h2 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider mb-3">Actionable learnings</h2>
          {insights.length === 0 ? (
            <p className="text-sm text-werbens-muted">No insights yet.</p>
          ) : (
            <ul className="space-y-2">
              {insights.map((insight, idx) => (
                <li key={`insight-${idx}`} className="rounded-lg border border-werbens-dark-cyan/10 bg-werbens-mist/20 px-3 py-2 text-sm text-werbens-text">
                  {insight}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs text-werbens-muted">
            Need full competitive analytics too? Use <Link href="/reports" className="text-werbens-dark-cyan hover:underline">Reports</Link> for posting-time and engagement analysis.
          </p>
        </div>
      </section>
    </main>
  );
}
