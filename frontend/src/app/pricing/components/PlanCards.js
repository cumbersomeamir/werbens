"use client";

import Link from "next/link";

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-werbens-dark-cyan"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function FeatureItem({ children }) {
  return (
    <li className="flex gap-3">
      <CheckIcon />
      <span className="text-werbens-text/90">{children}</span>
    </li>
  );
}

export function PlanCards() {
  return (
    <section className="px-4 sm:px-6 pb-12 sm:pb-16" aria-label="Plans">
      <div className="mx-auto max-w-4xl">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-6">
          {/* Free Plan */}
          <div className="rounded-2xl border-2 border-werbens-dark-cyan/15 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-bold text-werbens-dark-cyan">
                Free
              </h2>
              <span className="text-3xl font-bold text-werbens-text">$0</span>
            </div>
            <p className="mt-2 text-sm text-werbens-text/60">
              Perfect to get started
            </p>
            <ul className="mt-6 space-y-4">
              <FeatureItem>
                Automatic posting on all connected channels
              </FeatureItem>
              <FeatureItem>
                One piece of content delivered to you daily
              </FeatureItem>
            </ul>
            <Link
              href="/onboarding"
              className="mt-6 sm:mt-8 block w-full rounded-xl border-2 border-werbens-dark-cyan bg-white py-3 text-center font-semibold text-werbens-dark-cyan transition hover:bg-werbens-dark-cyan hover:text-white min-h-[48px] flex items-center justify-center"
            >
              Get started free
            </Link>
          </div>

          {/* Paid Plan */}
          <div className="relative rounded-2xl border-2 border-werbens-dark-cyan bg-werbens-dark-cyan/5 p-6 sm:p-8 shadow-md ring-2 ring-werbens-dark-cyan/20">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-werbens-dark-cyan px-4 py-1 text-sm font-semibold text-white">
              Most popular
            </div>
            <div className="flex items-baseline justify-between pt-2">
              <h2 className="text-xl font-bold text-werbens-dark-cyan">Paid</h2>
              <span className="text-sm text-werbens-text/70">From $XX/mo</span>
            </div>
            <p className="mt-2 text-sm text-werbens-text/60">
              More content, more impact
            </p>
            <ul className="mt-6 space-y-4">
              <FeatureItem>Everything in Free</FeatureItem>
              <FeatureItem>More image content daily</FeatureItem>
              <FeatureItem>1 video daily</FeatureItem>
            </ul>
            <Link
              href="/onboarding"
              className="mt-6 sm:mt-8 block w-full rounded-xl bg-werbens-dark-cyan py-3 text-center font-semibold text-white transition hover:bg-werbens-dark-cyan/90 min-h-[48px] flex items-center justify-center"
            >
              Start paid plan
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
