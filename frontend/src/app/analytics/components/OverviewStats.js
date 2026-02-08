"use client";

import { OVERVIEW_STATS, formatNumber } from "../data/analytics";

const STAGGER_CLASSES = ["stagger-1", "stagger-2", "stagger-3", "stagger-4"];

function StatCard({ stat, index }) {
  const isPositive = stat.change >= 0;
  return (
    <div
      className={`relative rounded-2xl bg-white p-5 sm:p-6 shadow-elevated hover-lift transition-all duration-300 overflow-hidden animate-fade-in-up ${STAGGER_CLASSES[index] || ""}`}
    >
      {/* Top border gradient accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-werbens-light-cyan via-werbens-dark-cyan to-werbens-glow" />

      <p className="text-xs sm:text-sm font-medium text-werbens-muted tracking-wide uppercase">
        {stat.label}
      </p>
      <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-werbens-text tracking-tight">
        {formatNumber(stat.value)}
      </p>
      <div className="mt-3">
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
          {stat.change}%
        </span>
        <span className="ml-1.5 text-xs text-werbens-muted">vs last period</span>
      </div>
    </div>
  );
}

export function OverviewStats() {
  return (
    <section className="px-4 sm:px-6 pb-6 sm:pb-8" aria-label="Overview metrics">
      <div className="mx-auto max-w-7xl">
        <h2 className="sr-only">Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {Object.values(OVERVIEW_STATS).map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
