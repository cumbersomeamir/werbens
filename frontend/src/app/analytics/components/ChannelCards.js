"use client";

import { CHANNELS, formatNumber } from "../data/analytics";

function SocialChannelCard({ channel }) {
  const m = channel.metrics;
  return (
    <div className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-werbens-dark-cyan">
          {channel.name}
        </h3>
        <span
          className={`text-sm font-medium ${
            m.change >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {m.change >= 0 ? "+" : ""}
          {m.change}%
        </span>
      </div>
      <p className="mt-1 text-xs text-werbens-text/60">
        {channel.platforms.join(" · ")}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-werbens-text/60">Posts</p>
          <p className="font-semibold text-werbens-text">{m.posts}</p>
        </div>
        <div>
          <p className="text-xs text-werbens-text/60">Impressions</p>
          <p className="font-semibold text-werbens-text">
            {formatNumber(m.impressions)}
          </p>
        </div>
        <div>
          <p className="text-xs text-werbens-text/60">Engagement</p>
          <p className="font-semibold text-werbens-text">
            {formatNumber(m.engagement)}
          </p>
        </div>
        <div>
          <p className="text-xs text-werbens-text/60">Eng. rate</p>
          <p className="font-semibold text-werbens-text">{m.engagementRate}%</p>
        </div>
      </div>
      <div className="mt-4 border-t border-werbens-dark-cyan/10 pt-4">
        <p className="text-xs font-medium text-werbens-text/60 mb-2">
          Top content
        </p>
        <ul className="space-y-2">
          {channel.topContent.map((item, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-werbens-text truncate max-w-[140px]">
                {item.title}
              </span>
              <span className="text-werbens-text/70 shrink-0">
                {formatNumber(item.engagement)} · {item.type}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AdsChannelCard({ channel }) {
  const m = channel.metrics;
  return (
    <div className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-werbens-dark-cyan">
          {channel.name}
        </h3>
        <span
          className={`text-sm font-medium ${
            m.change >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {m.change >= 0 ? "+" : ""}
          {m.change}%
        </span>
      </div>
      <p className="mt-1 text-xs text-werbens-text/60">
        {channel.platforms.join(" · ")}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-werbens-text/60">Campaigns</p>
          <p className="font-semibold text-werbens-text">{m.campaigns}</p>
        </div>
        <div>
          <p className="text-xs text-werbens-text/60">Impressions</p>
          <p className="font-semibold text-werbens-text">
            {formatNumber(m.impressions)}
          </p>
        </div>
        <div>
          <p className="text-xs text-werbens-text/60">Clicks</p>
          <p className="font-semibold text-werbens-text">
            {formatNumber(m.clicks)}
          </p>
        </div>
        <div>
          <p className="text-xs text-werbens-text/60">CTR</p>
          <p className="font-semibold text-werbens-text">{m.ctr}%</p>
        </div>
      </div>
      <div className="mt-4 border-t border-werbens-dark-cyan/10 pt-4">
        <p className="text-xs font-medium text-werbens-text/60 mb-2">
          Top creatives
        </p>
        <ul className="space-y-2">
          {channel.topContent.map((item, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-werbens-text truncate max-w-[140px]">
                {item.title}
              </span>
              <span className="text-werbens-text/70 shrink-0">
                {formatNumber(item.clicks)} clicks · {item.type}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function EmailChannelCard({ channel }) {
  const m = channel.metrics;
  return (
    <div className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-werbens-dark-cyan">
          {channel.name}
        </h3>
        <span
          className={`text-sm font-medium ${
            m.change >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {m.change >= 0 ? "+" : ""}
          {m.change}%
        </span>
      </div>
      <p className="mt-1 text-xs text-werbens-text/60">
        {channel.platforms.join(" · ")}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-werbens-text/60">Sent</p>
          <p className="font-semibold text-werbens-text">
            {formatNumber(m.sent)}
          </p>
        </div>
        <div>
          <p className="text-xs text-werbens-text/60">Opens</p>
          <p className="font-semibold text-werbens-text">
            {formatNumber(m.opens)}
          </p>
        </div>
        <div>
          <p className="text-xs text-werbens-text/60">Open rate</p>
          <p className="font-semibold text-werbens-text">{m.openRate}%</p>
        </div>
        <div>
          <p className="text-xs text-werbens-text/60">Click rate</p>
          <p className="font-semibold text-werbens-text">{m.clickRate}%</p>
        </div>
      </div>
      <div className="mt-4 border-t border-werbens-dark-cyan/10 pt-4">
        <p className="text-xs font-medium text-werbens-text/60 mb-2">
          Top campaigns
        </p>
        <ul className="space-y-2">
          {channel.topContent.map((item, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-werbens-text truncate max-w-[140px]">
                {item.title}
              </span>
              <span className="text-werbens-text/70 shrink-0">
                {item.openRate}% open · {item.type}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ChannelCards() {
  return (
    <section className="px-6 pb-16" aria-label="Channel performance">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-xl font-semibold text-werbens-dark-cyan mb-6">
          Performance by channel
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SocialChannelCard channel={CHANNELS[0]} />
          <AdsChannelCard channel={CHANNELS[1]} />
          <EmailChannelCard channel={CHANNELS[2]} />
        </div>
      </div>
    </section>
  );
}
