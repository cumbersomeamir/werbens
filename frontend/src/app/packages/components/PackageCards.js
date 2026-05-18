import Link from "next/link";
import { formatPrice } from "@/components/CurrencySelector";

const packages = [
  {
    name: "Basic",
    price: { US: 100, GB: 100, IN: 10000 },
    staggerClass: "stagger-4",
    summary: "3 reels per week, 12 reels per month. Ready to post, no editing needed.",
    features: [
      "Full brand imaging and visual direction",
      "10 revisions per month",
      "100% of ad budget goes to campaign promotion",
      (country) => `${formatPrice({ US: 20, GB: 20, IN: 2000 }, country)} upfront add-on for social ad management`,
    ],
    cta: "Choose Basic",
  },
  {
    name: "Pro",
    price: { US: 200, GB: 200, IN: 20000 },
    staggerClass: "stagger-5",
    summary: "6 reels per week, 24 reels per month. Built for consistent growth.",
    featured: true,
    features: [
      "Full brand imaging and visual direction",
      "1 free logo generation",
      "30 revisions per month",
      "1 high-quality personal image clone seat",
      "Instagram, Facebook, LinkedIn, and YouTube ad management included",
      "No ad management fee. 100% of ad budget goes to campaigns",
    ],
    cta: "Choose Pro",
  },
  {
    name: "Scaler",
    price: { US: 500, GB: 500, IN: 50000 },
    staggerClass: "stagger-6",
    summary: "12 reels per week, 48 reels per month. For brands publishing daily.",
    features: [
      "Full brand imaging and visual direction",
      "1 free logo generation",
      "50 revisions per month",
      "1 high-quality personal image clone seat",
      "Instagram, Facebook, LinkedIn, and YouTube ad management included",
      "No ad management fee. 100% of ad budget goes to campaigns",
    ],
    cta: "Choose Scaler",
  },
];

function CheckIcon({ light }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 ${light ? "text-werbens-light-cyan" : "text-werbens-light-cyan"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FeatureItem({ children, light }) {
  return (
    <li className="flex items-start gap-3">
      <CheckIcon light={light} />
      <span className={light ? "text-white/85" : "text-werbens-text/80"}>{children}</span>
    </li>
  );
}

function PackageCard({ item, country }) {
  const light = Boolean(item.featured);

  return (
    <div
      className={[
        `animate-fade-in-up ${item.staggerClass} hover-lift relative rounded-2xl p-8 transition-all duration-300 sm:p-10`,
        item.featured
          ? "bg-gradient-to-br from-werbens-midnight to-werbens-deep glow"
          : "border border-werbens-steel/30 bg-white shadow-elevated",
      ].join(" ")}
    >
      {item.featured ? (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-werbens-amber px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-werbens-midnight shadow-lg">
            Most popular
          </span>
        </div>
      ) : null}

      <div className={item.featured ? "mb-1 pt-3" : "mb-1"}>
        <h2
          className={
            light
              ? "text-lg font-semibold uppercase tracking-wide text-white/70"
              : "text-lg font-semibold uppercase tracking-wide text-werbens-dark-cyan"
          }
        >
          {item.name}
        </h2>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span
          className={
            light
              ? "text-5xl font-bold tracking-tight text-white"
              : "text-5xl font-bold tracking-tight text-werbens-text"
          }
        >
          {formatPrice(item.price, country)}
        </span>
        <span
          className={
            light ? "text-base font-medium text-white/50" : "text-base font-medium text-werbens-muted"
          }
        >
          /mo
        </span>
      </div>

      <p
        className={
          light
            ? "mt-3 text-sm leading-relaxed text-white/60"
            : "mt-3 text-sm leading-relaxed text-werbens-muted"
        }
      >
        {item.summary}
      </p>

      <div
        className={
          light
            ? "mt-8 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
            : "mt-8 h-px bg-gradient-to-r from-transparent via-werbens-steel/40 to-transparent"
        }
      />

      <ul className="mt-8 space-y-3">
        {item.features.map((feature, index) => (
          <FeatureItem key={`${item.name}-${index}`} light={light}>
            {typeof feature === "function" ? feature(country) : feature}
          </FeatureItem>
        ))}
      </ul>

      <Link
        href="/onboarding"
        className={
          light
            ? "animate-pulse-glow mt-10 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-werbens-light-cyan to-werbens-dark-cyan py-3.5 text-center font-semibold text-white transition-all duration-300 hover:opacity-90 hover:shadow-xl focus-ring"
            : "mt-10 flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-werbens-dark-cyan bg-transparent py-3.5 text-center font-semibold text-werbens-dark-cyan transition-all duration-300 hover:bg-werbens-dark-cyan hover:text-white hover:shadow-lg focus-ring"
        }
      >
        {item.cta}
      </Link>
    </div>
  );
}

export function PackageCards({ country }) {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-24" aria-label="Packages">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-start gap-8 md:grid-cols-3 md:gap-6">
          {packages.map((item) => (
            <PackageCard key={item.name} item={item} country={country} />
          ))}
        </div>
      </div>
    </section>
  );
}
