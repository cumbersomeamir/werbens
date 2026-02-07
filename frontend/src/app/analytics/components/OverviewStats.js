"use client";

import { OVERVIEW_STATS, formatNumber } from "../data/analytics";

function StatCard({ stat }) {
  const isPositive = stat.change >= 0;
  return (
    <div className="rounded-xl border border-werbens-dark-cyan/10 bg-white p-4 sm:p-5 shadow-sm">
      <p className="text-sm text-werbens-text/60">{stat.label}</p>
      <p className="mt-1 text-xl sm:text-2xl font-bold text-werbens-text">
        {formatNumber(stat.value)}
      </p>
      <p
        className={`mt-1 text-sm font-medium ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? "+" : ""}
        {stat.change}% vs last period
      </p>
    </div>
  );
}

export function OverviewStats() {
  return (
    <section className="px-4 sm:px-6 pb-6 sm:pb-8" aria-label="Overview metrics">
      <div className="mx-auto max-w-7xl">
        <h2 className="sr-only">Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Object.values(OVERVIEW_STATS).map((stat, i) => (
            <StatCard key={i} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
