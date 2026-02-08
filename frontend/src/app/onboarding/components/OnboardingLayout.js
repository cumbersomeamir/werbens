"use client";

import Link from "next/link";

export function OnboardingLayout({ children, step, totalSteps }) {
  const progressPercent = totalSteps > 0 ? (step / totalSteps) * 100 : 0;

  return (
    <div className="min-h-screen bg-werbens-midnight relative flex flex-col overflow-hidden">
      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,188,212,0.08)_0%,_transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(0,150,180,0.05)_0%,_transparent_50%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-8 py-5">
        <span className="text-xl font-bold tracking-tight gradient-text-light">
          Werbens
        </span>
        <Link
          href="/"
          className="text-sm text-werbens-muted hover:text-werbens-alt-text transition-colors duration-200 font-medium"
        >
          Skip for now
        </Link>
      </header>

      {/* Progress bar */}
      {totalSteps > 0 && (
        <div className="relative z-10 px-6 sm:px-8 pb-3">
          <div className="h-1.5 w-full rounded-full bg-werbens-slate overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan glow-sm transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-end mt-1.5">
            <span className="text-xs text-werbens-muted font-medium">
              {step} of {totalSteps}
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-auto">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </main>
    </div>
  );
}
