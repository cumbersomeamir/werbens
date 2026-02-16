"use client";

import { CHANNELS, formatNumber, buildSocialChannelFromData } from "../data/analytics";

function ChangeBadge({ change }) {
  if (change == null || Number.isNaN(change)) {
    return <span className="text-xs text-werbens-muted">Live</span>;
  }
  const isPositive = change >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isPositive
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <svg
        className={`h-3 w-3 ${isPositive ? "" : "rotate-180"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M5 15l7-7 7 7"
        />
      </svg>
      {isPositive ? "+" : ""}
      {change}%
    </span>
  );
}

function MetricCell({ label, value }) {
  return (
    <div className="py-2">
      <p className="text-xs text-werbens-muted font-medium">{label}</p>
      <p className="mt-0.5 text-base font-bold text-werbens-text">{value}</p>
    </div>
  );
}

function TopContentList({ title, items, renderMeta }) {
  if (!items?.length) return null;
  return (
    <div className="mt-5 border-t border-werbens-dark-cyan/8 pt-4">
      <p className="text-xs font-semibold text-werbens-muted uppercase tracking-wider mb-2.5">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li
            key={i}
            className={`flex items-center justify-between text-sm px-2.5 py-2 rounded-lg ${
              i % 2 === 0 ? "bg-werbens-mist/40" : ""
            }`}
          >
            <span className="text-werbens-text font-medium truncate max-w-[120px] sm:max-w-[160px]">
              {item.title}
            </span>
            <span className="text-werbens-muted text-xs shrink-0 ml-2">
              {renderMeta(item)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialChannelCard({ channel }) {
  const m = channel.metrics;
  return (
    <div className="relative rounded-2xl bg-white p-5 sm:p-6 shadow-elevated hover-lift transition-all duration-300 overflow-hidden animate-fade-in-up stagger-1">
      {/* Top border gradient accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-werbens-light-cyan via-werbens-dark-cyan to-werbens-glow" />

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-bold text-werbens-dark-cyan">
          {channel.name}
        </h3>
        <ChangeBadge change={m.change} />
      </div>
      <p className="mt-1.5 text-xs text-werbens-muted font-medium">
        {channel.platforms.join(" · ")}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 divide-x divide-werbens-dark-cyan/8">
        <MetricCell label="Posts" value={m.posts} />
        <div className="pl-4">
          <MetricCell label="Impressions" value={formatNumber(m.impressions)} />
        </div>
        <MetricCell label="Engagement" value={formatNumber(m.engagement)} />
        <div className="pl-4">
          <MetricCell label="Eng. rate" value={`${m.engagementRate}%`} />
        </div>
      </div>

      <TopContentList
        title="Top content"
        items={channel.topContent}
        renderMeta={(item) => `${formatNumber(item.engagement)} · ${item.type}`}
      />
    </div>
  );
}

export function ChannelCards({ socialData, loading }) {
  const socialChannel = socialData
    ? buildSocialChannelFromData(socialData)
    : CHANNELS[0];

  return (
    <section className="px-4 sm:px-6 pb-12 sm:pb-16" aria-label="Channel performance">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-lg sm:text-xl font-bold text-werbens-dark-cyan mb-5 sm:mb-7">
          Performance by channel
        </h2>
        <div className="grid gap-4 sm:gap-6 max-w-2xl">
          {loading ? (
            <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-elevated animate-pulse">
              <div className="h-6 bg-werbens-mist/50 rounded w-32 mb-2" />
              <div className="h-4 bg-werbens-mist/30 rounded w-48 mb-4" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-werbens-mist/30 rounded" />
                ))}
              </div>
            </div>
          ) : (
            <SocialChannelCard channel={socialChannel} />
          )}
        </div>
      </div>
    </section>
  );
}
