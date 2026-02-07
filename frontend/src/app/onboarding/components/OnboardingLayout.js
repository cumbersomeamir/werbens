"use client";

import Link from "next/link";

export function OnboardingLayout({ children, step, totalSteps }) {
  return (
    <div className="min-h-screen bg-werbens-light-cyan/30 flex flex-col">
      <header className="flex items-center justify-between p-6">
        <span className="text-lg font-semibold text-werbens-dark-cyan">
          Werbens
        </span>
        <Link
          href="/"
          className="text-sm text-werbens-dark-cyan hover:underline font-medium"
        >
          Skip for now
        </Link>
      </header>

      {totalSteps > 0 && (
        <div className="px-6 pb-2">
          <div className="h-1.5 w-full rounded-full bg-werbens-dark-cyan/20 overflow-hidden">
            <div
              className="h-full bg-werbens-dark-cyan transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}
