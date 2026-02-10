"use client";

import Link from "next/link";

function CheckIcon({ light }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 ${light ? "text-werbens-light-cyan" : "text-werbens-light-cyan"}`}
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

function FeatureItem({ children, light }) {
  return (
    <li className="flex items-start gap-3">
      <CheckIcon light={light} />
      <span className={light ? "text-white/85" : "text-werbens-text/80"}>
        {children}
      </span>
    </li>
  );
}

export function PlanCards() {
  return (
    <section className="px-4 sm:px-6 pb-16 sm:pb-24" aria-label="Plans">
      <div className="mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 md:gap-6 items-start">
          {/* Basic Plan */}
          <div className="animate-fade-in-up stagger-4 hover-lift rounded-2xl border border-werbens-steel/30 bg-white p-8 sm:p-10 shadow-elevated transition-all duration-300">
            <div className="mb-1">
              <h2 className="text-lg font-semibold uppercase tracking-wide text-werbens-alt-text">
                Basic
              </h2>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tight text-werbens-text">
                $20
              </span>
              <span className="text-base font-medium text-werbens-muted">
                /mo
              </span>
            </div>
            <p className="mt-3 text-sm text-werbens-muted leading-relaxed">
              1 image per platform delivered per day.
            </p>

            <div className="mt-8 h-px bg-gradient-to-r from-transparent via-werbens-steel/40 to-transparent" />

            <ul className="mt-8 space-y-3">
              <FeatureItem>1 image per platform per day</FeatureItem>
              <FeatureItem>Powered by Nano Bana Pro</FeatureItem>
              <FeatureItem>Up to 1 account</FeatureItem>
            </ul>

            <Link
              href="/onboarding"
              className="mt-10 block w-full rounded-xl border-2 border-werbens-dark-cyan bg-transparent py-3.5 text-center font-semibold text-werbens-dark-cyan transition-all duration-300 hover:bg-werbens-dark-cyan hover:text-white hover:shadow-lg min-h-[48px] flex items-center justify-center focus-ring"
            >
              Choose Basic
            </Link>
          </div>

          {/* Pro Plan (Most popular) */}
          <div className="animate-fade-in-up stagger-5 hover-lift relative rounded-2xl bg-gradient-to-br from-werbens-midnight to-werbens-deep p-8 sm:p-10 glow transition-all duration-300">
            {/* Most popular badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center rounded-full bg-werbens-amber px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-werbens-midnight shadow-lg">
                Most popular
              </span>
            </div>

            <div className="mb-1 pt-3">
              <h2 className="text-lg font-semibold uppercase tracking-wide text-white/70">
                Pro
              </h2>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-white">
                $50
              </span>
              <span className="text-base font-medium text-white/50">/mo</span>
            </div>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              1 image and 1 video per platform delivered per day.
            </p>

            <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <ul className="mt-8 space-y-3">
              <FeatureItem light>1 image & 1 video per platform per day</FeatureItem>
              <FeatureItem light>Everything in Basic</FeatureItem>
              <FeatureItem light>Powered by Sora 2</FeatureItem>
              <FeatureItem light>Automated posting</FeatureItem>
              <FeatureItem light>Up to 3 accounts</FeatureItem>
            </ul>

            <Link
              href="/onboarding"
              className="animate-pulse-glow mt-10 block w-full rounded-xl bg-gradient-to-r from-werbens-light-cyan to-werbens-dark-cyan py-3.5 text-center font-semibold text-white transition-all duration-300 hover:opacity-90 hover:shadow-xl min-h-[48px] flex items-center justify-center focus-ring"
            >
              Choose Pro
            </Link>
          </div>

          {/* Scaler Plan */}
          <div className="animate-fade-in-up stagger-6 hover-lift rounded-2xl border border-werbens-steel/30 bg-white p-8 sm:p-10 shadow-elevated transition-all duration-300">
            <div className="mb-1">
              <h2 className="text-lg font-semibold uppercase tracking-wide text-werbens-alt-text">
                Scaler
              </h2>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tight text-werbens-text">
                $200
              </span>
              <span className="text-base font-medium text-werbens-muted">
                /mo
              </span>
            </div>
            <p className="mt-3 text-sm text-werbens-muted leading-relaxed">
              3 images and 3 videos per account delivered per day.
            </p>

            <div className="mt-8 h-px bg-gradient-to-r from-transparent via-werbens-steel/40 to-transparent" />

            <ul className="mt-8 space-y-3">
              <FeatureItem>3 images & 3 videos per account per day</FeatureItem>
              <FeatureItem>Everything in Pro</FeatureItem>
              <FeatureItem>Up to 5 accounts</FeatureItem>
            </ul>

            <Link
              href="/onboarding"
              className="mt-10 block w-full rounded-xl border-2 border-werbens-dark-cyan bg-transparent py-3.5 text-center font-semibold text-werbens-dark-cyan transition-all duration-300 hover:bg-werbens-dark-cyan hover:text-white hover:shadow-lg min-h-[48px] flex items-center justify-center focus-ring"
            >
              Choose Scaler
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="animate-fade-in-up stagger-7 hover-lift rounded-2xl border border-werbens-steel/30 bg-white p-8 sm:p-10 shadow-elevated transition-all duration-300">
            <div className="mb-1">
              <h2 className="text-lg font-semibold uppercase tracking-wide text-werbens-alt-text">
                Enterprise
              </h2>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tight text-werbens-text">
                $70
              </span>
              <span className="text-base font-medium text-werbens-muted">
                /seat
              </span>
            </div>
            <p className="mt-3 text-sm text-werbens-muted leading-relaxed">
              Everything in Pro plus advanced business tools and reporting.
            </p>

            <div className="mt-8 h-px bg-gradient-to-r from-transparent via-werbens-steel/40 to-transparent" />

            <ul className="mt-8 space-y-3">
              <FeatureItem>Everything in Pro</FeatureItem>
              <FeatureItem>Pay per seat</FeatureItem>
              <FeatureItem>Advanced business tools & features</FeatureItem>
              <FeatureItem>Advanced reports</FeatureItem>
              <FeatureItem>Competitor tracking</FeatureItem>
            </ul>

            <Link
              href="/onboarding"
              className="mt-10 block w-full rounded-xl border-2 border-werbens-dark-cyan bg-transparent py-3.5 text-center font-semibold text-werbens-dark-cyan transition-all duration-300 hover:bg-werbens-dark-cyan hover:text-white hover:shadow-lg min-h-[48px] flex items-center justify-center focus-ring"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
