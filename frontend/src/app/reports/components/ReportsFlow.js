"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import {
  getSocialAccounts,
  getYoutubeTimePostingReport,
  generateYoutubeTimePostingReport,
  getYoutubeTimePostingReportExcelUrl,
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

function formatUtcDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

function formatUtcDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  });
}

function getCorrelationLabel(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "Insufficient data";
  const sign = num > 0 ? "positive" : num < 0 ? "negative" : "neutral";
  return `${num} (${sign})`;
}

function ScatterChart({ rows }) {
  const points = useMemo(
    () =>
      (Array.isArray(rows) ? rows : [])
        .filter((row) => Number.isInteger(Number(row?.postingHourUtc)) && Number.isFinite(Number(row?.views)))
        .slice(0, 500),
    [rows]
  );

  const width = 760;
  const height = 300;
  const padding = 36;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxViews = Math.max(1, ...points.map((p) => Number(p?.views) || 0));
  const maxEngagement = Math.max(1, ...points.map((p) => Number(p?.engagementTotal) || 0));
  const maxLogViews = Math.log10(maxViews + 1);

  const xForHour = (hour) => padding + (Math.max(0, Math.min(23, hour)) / 23) * chartWidth;
  const yForViews = (views) => {
    const numerator = Math.log10(Math.max(0, views) + 1);
    const ratio = maxLogViews > 0 ? numerator / maxLogViews : 0;
    return height - padding - ratio * chartHeight;
  };

  return (
    <div className="rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
      <h3 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider mb-3">
        Scatter: Posting Hour vs Views
      </h3>
      <p className="text-xs text-werbens-muted mb-3">
        X-axis is posting hour (UTC). Y-axis is views (log scale). Dot size reflects total engagement.
      </p>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[680px] w-full h-auto" role="img" aria-label="Scatter chart for posting hour and views">
          <rect x={padding} y={padding} width={chartWidth} height={chartHeight} fill="#f7fbfb" rx="12" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#87a5a9" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#87a5a9" strokeWidth="1" />

          {[0, 6, 12, 18, 23].map((hour) => (
            <g key={`x-${hour}`}>
              <line x1={xForHour(hour)} y1={height - padding} x2={xForHour(hour)} y2={height - padding + 5} stroke="#87a5a9" strokeWidth="1" />
              <text x={xForHour(hour)} y={height - 12} textAnchor="middle" fontSize="10" fill="#5d7478">
                {hour}
              </text>
            </g>
          ))}

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = height - padding - ratio * chartHeight;
            const value = Math.round(Math.pow(10, ratio * maxLogViews) - 1);
            return (
              <g key={`y-${ratio}`}>
                <line x1={padding - 5} y1={y} x2={padding} y2={y} stroke="#87a5a9" strokeWidth="1" />
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#dbe8ea" strokeWidth="1" strokeDasharray="3 3" />
                <text x={padding - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#5d7478">
                  {formatNumber(value)}
                </text>
              </g>
            );
          })}

          {points.map((point, idx) => {
            const hour = Number(point?.postingHourUtc) || 0;
            const views = Number(point?.views) || 0;
            const engagement = Number(point?.engagementTotal) || 0;
            const x = xForHour(hour);
            const y = yForViews(views);
            const radius = 2.8 + (engagement / maxEngagement) * 4.2;
            return (
              <circle
                key={`pt-${point?.videoId || idx}-${idx}`}
                cx={x}
                cy={y}
                r={radius}
                fill="rgba(13, 111, 121, 0.45)"
                stroke="rgba(7, 77, 85, 0.8)"
                strokeWidth="0.8"
              />
            );
          })}

          <text x={width / 2} y={height - 2} textAnchor="middle" fontSize="11" fill="#4f676b">
            Posting hour (UTC)
          </text>
          <text
            x={14}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90 14 ${height / 2})`}
            fontSize="11"
            fill="#4f676b"
          >
            Views (log scale)
          </text>
        </svg>
      </div>
    </div>
  );
}

function HourlyBarChart({ hourlyBuckets }) {
  const rows = Array.isArray(hourlyBuckets) ? hourlyBuckets : [];
  const maxAvg = Math.max(1, ...rows.map((bucket) => Number(bucket?.avgViews) || 0));

  return (
    <div className="rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
      <h3 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider mb-3">
        Average Views By Posting Hour (UTC)
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {rows.map((bucket) => {
          const avgViews = Number(bucket?.avgViews) || 0;
          const heightPct = Math.max(0, Math.min(100, (avgViews / maxAvg) * 100));
          return (
            <div key={`hour-${bucket?.hour}`} className="rounded-xl border border-werbens-dark-cyan/10 bg-werbens-mist/30 p-2">
              <div className="h-20 flex items-end">
                <div className="w-full rounded-md bg-werbens-dark-cyan/80" style={{ height: `${heightPct}%` }} />
              </div>
              <p className="mt-2 text-xs text-werbens-muted">{String(bucket?.hour).padStart(2, "0")}:00</p>
              <p className="text-sm font-semibold text-werbens-text">{formatNumber(avgViews)}</p>
              <p className="text-[11px] text-werbens-muted">{formatNumber(bucket?.posts || 0)} posts</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekdayBarChart({ weekdayBuckets }) {
  const rows = Array.isArray(weekdayBuckets) ? weekdayBuckets : [];
  const maxAvg = Math.max(1, ...rows.map((bucket) => Number(bucket?.avgEngagement) || 0));

  return (
    <div className="rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
      <h3 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider mb-3">
        Average Engagement By Weekday (UTC)
      </h3>
      <div className="space-y-2">
        {rows.map((bucket) => {
          const avg = Number(bucket?.avgEngagement) || 0;
          const pct = Math.max(0, Math.min(100, (avg / maxAvg) * 100));
          return (
            <div key={`weekday-${bucket?.weekday}`} className="rounded-lg border border-werbens-dark-cyan/10 bg-werbens-mist/30 px-3 py-2">
              <div className="flex items-center justify-between text-xs text-werbens-muted mb-1">
                <span>{bucket?.weekday}</span>
                <span>{formatNumber(bucket?.posts || 0)} posts</span>
              </div>
              <div className="h-2 rounded-full bg-white">
                <div className="h-full rounded-full bg-werbens-dark-cyan" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-sm font-semibold text-werbens-text">{formatNumber(avg)} avg engagement</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReportsFlow() {
  const { userId, loading: userLoading } = useCurrentUser();

  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const loadYoutubeChannels = useCallback(async () => {
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

      const map = new Map();
      for (const account of youtubeAccounts) {
        const accountChannels = Array.isArray(account?.channels) ? account.channels : [];
        if (accountChannels.length > 0) {
          for (const channel of accountChannels) {
            const channelId = String(channel?.channelId || "").trim();
            if (!channelId || map.has(channelId)) continue;
            map.set(channelId, {
              channelId,
              label: String(channel?.title || account?.username || account?.displayName || channelId),
            });
          }
        } else {
          const fallbackId = String(account?.platformUserId || "").trim();
          if (!fallbackId || map.has(fallbackId)) continue;
          map.set(fallbackId, {
            channelId: fallbackId,
            label: String(account?.username || account?.displayName || fallbackId),
          });
        }
      }

      const list = Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
      const dogMoments = list.find((item) => /dog/i.test(item?.label || ""));

      setChannels(list);
      setSelectedChannelId((prev) => {
        if (prev && list.some((item) => item.channelId === prev)) return prev;
        return dogMoments?.channelId || list[0]?.channelId || "";
      });
    } catch (err) {
      setChannels([]);
      setSelectedChannelId("");
      setError(err?.message || "Failed to load YouTube channels.");
    } finally {
      setChannelsLoading(false);
    }
  }, [userId]);

  const loadStoredReport = useCallback(async () => {
    if (!userId || !selectedChannelId) {
      setReport(null);
      return;
    }

    setReportLoading(true);
    setError("");
    try {
      const response = await getYoutubeTimePostingReport(userId, { channelId: selectedChannelId });
      setReport(response?.report || null);
    } catch (err) {
      setReport(null);
      setError(err?.message || "Failed to load stored report.");
    } finally {
      setReportLoading(false);
    }
  }, [userId, selectedChannelId]);

  useEffect(() => {
    loadYoutubeChannels();
  }, [loadYoutubeChannels]);

  useEffect(() => {
    loadStoredReport();
  }, [loadStoredReport]);

  const handleGenerate = async () => {
    if (!userId || !selectedChannelId) {
      setError("Select a connected YouTube channel first.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const response = await generateYoutubeTimePostingReport(userId, {
        channelId: selectedChannelId,
      });
      setReport(response?.report || null);
    } catch (err) {
      setError(err?.message || "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!userId || !selectedChannelId) return;
    const url = getYoutubeTimePostingReportExcelUrl(userId, { channelId: selectedChannelId });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const rows = useMemo(() => {
    const list = Array.isArray(report?.rows) ? report.rows.slice() : [];
    return list.sort((a, b) => {
      const at = new Date(a?.publishedAt || 0).getTime();
      const bt = new Date(b?.publishedAt || 0).getTime();
      return bt - at;
    });
  }, [report?.rows]);

  const hourlyBuckets = Array.isArray(report?.hourlyBuckets) ? report.hourlyBuckets : [];
  const weekdayBuckets = Array.isArray(report?.weekdayBuckets) ? report.weekdayBuckets : [];
  const summary = report?.summary || null;
  const analysis = report?.analysis || null;

  const renderScatter = rows.length >= 5;
  const renderHourly = hourlyBuckets.some((bucket) => Number(bucket?.posts) > 0);
  const renderWeekday = weekdayBuckets.some((bucket) => Number(bucket?.posts) > 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-werbens-mist to-werbens-surface">
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm uppercase tracking-[0.14em] text-werbens-dark-cyan/80 font-medium">
            Reports
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-werbens-text">
            YouTube Time Of Posting Report
          </h1>
          <p className="mt-2 text-sm sm:text-base text-werbens-muted">
            Analyses posting time (UTC) against views and engagement, persists data to MongoDB, and exports Excel.
          </p>
        </div>

        <div className="rounded-2xl border border-werbens-dark-cyan/10 bg-white/80 backdrop-blur p-4 sm:p-6 shadow-elevated">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 lg:items-end">
            <div>
              <label className="text-sm font-semibold text-werbens-text" htmlFor="report-channel-select">
                YouTube Channel
              </label>
              <select
                id="report-channel-select"
                value={selectedChannelId}
                onChange={(event) => setSelectedChannelId(event.target.value)}
                disabled={channelsLoading || generating || reportLoading}
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
                onClick={loadYoutubeChannels}
                disabled={channelsLoading || generating || reportLoading}
                className="h-11 px-4 rounded-xl border border-werbens-dark-cyan/20 text-sm font-medium text-werbens-text hover:bg-werbens-mist/40 disabled:opacity-60"
              >
                Refresh Channels
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={channelsLoading || generating || reportLoading || !selectedChannelId}
                className="h-11 px-4 rounded-xl bg-werbens-dark-cyan text-white text-sm font-semibold hover:opacity-95 disabled:opacity-60"
              >
                {generating ? "Generating..." : "Generate Report"}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!report || generating || reportLoading}
                className="h-11 px-4 rounded-xl border border-werbens-dark-cyan/20 text-sm font-medium text-werbens-text hover:bg-werbens-mist/40 disabled:opacity-60"
              >
                Download Excel
              </button>
            </div>
          </div>

          <div className="mt-3 text-xs text-werbens-muted">
            {userLoading ? "Checking user..." : `User: ${userId || "—"}`}
            {report?.generatedAt ? `  Last generated: ${formatUtcDateTime(report.generatedAt)} UTC` : ""}
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        {reportLoading ? (
          <div className="mt-6 rounded-2xl border border-werbens-dark-cyan/10 bg-white p-6 text-sm text-werbens-muted">
            Loading saved report...
          </div>
        ) : null}

        {!reportLoading && report ? (
          <>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
                <p className="text-xs uppercase tracking-wider text-werbens-muted">Videos Analysed</p>
                <p className="mt-2 text-3xl font-semibold text-werbens-text">{formatNumber(summary?.videoCount || 0)}</p>
              </div>
              <div className="rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
                <p className="text-xs uppercase tracking-wider text-werbens-muted">Total Views</p>
                <p className="mt-2 text-3xl font-semibold text-werbens-text">{formatNumber(summary?.totalViews || 0)}</p>
              </div>
              <div className="rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
                <p className="text-xs uppercase tracking-wider text-werbens-muted">Total Engagement</p>
                <p className="mt-2 text-3xl font-semibold text-werbens-text">{formatNumber(summary?.totalEngagement || 0)}</p>
              </div>
              <div className="rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
                <p className="text-xs uppercase tracking-wider text-werbens-muted">Correlations</p>
                <p className="mt-2 text-sm text-werbens-text">
                  Views: <span className="font-semibold">{getCorrelationLabel(analysis?.relationship?.postingHourVsViews?.value)}</span>
                </p>
                <p className="mt-1 text-sm text-werbens-text">
                  Engagement: <span className="font-semibold">{getCorrelationLabel(analysis?.relationship?.postingHourVsEngagement?.value)}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
              <h2 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider mb-3">
                Key Findings
              </h2>
              <ul className="space-y-2 text-sm text-werbens-text">
                {(Array.isArray(analysis?.keyFindings) ? analysis.keyFindings : []).map((finding, idx) => (
                  <li key={`finding-${idx}`} className="rounded-lg border border-werbens-dark-cyan/8 bg-werbens-mist/25 px-3 py-2">
                    {finding}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
              {renderScatter ? <ScatterChart rows={rows} /> : null}
              {renderHourly ? <HourlyBarChart hourlyBuckets={hourlyBuckets} /> : null}
            </div>

            {renderWeekday ? (
              <div className="mt-4">
                <WeekdayBarChart weekdayBuckets={weekdayBuckets} />
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-werbens-dark-cyan/10 bg-white p-4 shadow-elevated">
              <h2 className="text-sm font-semibold text-werbens-dark-cyan uppercase tracking-wider mb-3">
                Video-Level Data (UTC)
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-werbens-muted border-b border-werbens-dark-cyan/10">
                      <th className="py-2 pr-4">Video</th>
                      <th className="py-2 pr-4">Published (UTC)</th>
                      <th className="py-2 pr-4">Hour</th>
                      <th className="py-2 pr-4">Views</th>
                      <th className="py-2 pr-4">Likes</th>
                      <th className="py-2 pr-4">Comments</th>
                      <th className="py-2 pr-4">Engagement</th>
                      <th className="py-2 pr-4">Eng. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.videoId} className="border-b border-werbens-dark-cyan/8">
                        <td className="py-2 pr-4 min-w-[260px]">
                          <a
                            href={row.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-werbens-text hover:text-werbens-dark-cyan"
                          >
                            {row.title || row.videoId}
                          </a>
                          <p className="text-xs text-werbens-muted mt-1">{row.videoId}</p>
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          <div>{formatUtcDate(row.publishedAt)}</div>
                          <div className="text-xs text-werbens-muted">{row.postingTimeUtc || "—"}</div>
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {row.postingWeekdayUtc || "—"}
                          <div className="text-xs text-werbens-muted">{Number.isInteger(Number(row.postingHourUtc)) ? `${String(row.postingHourUtc).padStart(2, "0")}:00` : "—"}</div>
                        </td>
                        <td className="py-2 pr-4">{formatNumber(row.views)}</td>
                        <td className="py-2 pr-4">{formatNumber(row.likes)}</td>
                        <td className="py-2 pr-4">{formatNumber(row.comments)}</td>
                        <td className="py-2 pr-4">{formatNumber(row.engagementTotal)}</td>
                        <td className="py-2 pr-4">{formatPercent(row.engagementRatePct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}

        {!reportLoading && !report && !error ? (
          <div className="mt-6 rounded-2xl border border-werbens-dark-cyan/10 bg-white p-6 text-center text-werbens-muted">
            Generate the report to ingest data and visualise the posting-time relationship.
          </div>
        ) : null}
      </section>
    </main>
  );
}
