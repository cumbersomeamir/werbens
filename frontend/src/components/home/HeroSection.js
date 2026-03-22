import Link from "next/link";
import { HeroShowcaseScene } from "./HeroShowcaseScene";

const HERO_METRICS = [
  { value: "97%", label: "brand voice match" },
  { value: "24", label: "posts queued this week" },
  { value: "< 8 min", label: "from brief to publish" },
];

export function HeroSection() {
  return (
    <section
      className="noise relative isolate overflow-hidden bg-werbens-midnight text-werbens-alt-text"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(127,231,220,0.12),transparent_34%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(92,224,210,0.1),transparent_26%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,16,28,0.99),rgba(6,21,35,0.93)_58%,rgba(8,14,24,0.99))]" />
      <div className="hero-grid absolute inset-0 opacity-25" />
      <div className="absolute left-[10%] top-[12%] h-56 w-56 rounded-full bg-werbens-light-cyan/8 blur-[120px] animate-aurora" />
      <div className="absolute right-[6%] top-[22%] h-72 w-72 rounded-full bg-werbens-dark-cyan/18 blur-[130px] animate-aurora" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pb-24 sm:pt-10 md:pb-28 md:pt-12">
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,0.94fr)_minmax(360px,1.06fr)] lg:gap-x-12 lg:gap-y-6">
          <div className="max-w-3xl">
            <span className="section-kicker animate-fade-in-up stagger-1">
              AI-Powered Content Creation Platform
            </span>

            <h1
              id="hero-heading"
              className="font-display animate-fade-in-up stagger-2 mt-7 text-[3rem] font-bold leading-[0.94] text-balance sm:text-[4.6rem] lg:text-[5.7rem]"
            >
              <span className="gradient-text-light">Create content.</span>
              <br />
              <span className="text-white/84">Automatically.</span>
            </h1>
          </div>

          <div className="animate-fade-in-up stagger-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
            <HeroShowcaseScene />
          </div>

          <div className="max-w-3xl">
            <p className="animate-fade-in-up stagger-4 mt-7 max-w-2xl text-[1.02rem] leading-relaxed text-werbens-cloud/72 sm:text-xl md:text-[1.38rem]">
              Werbens is the autonomous content creation platform that
              generates brand-consistent social media posts, ad copy, emails,
              and marketing campaigns at scale. Save hours every week with AI
              that understands your voice.
            </p>

            <div className="animate-fade-in-up stagger-5 mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/onboarding"
                data-hero-cta
                className="group inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-werbens-light-cyan to-[#a3f3ea] px-8 py-4 text-base font-semibold text-werbens-midnight shadow-[0_20px_55px_rgba(127,231,220,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_26px_70px_rgba(127,231,220,0.28)]"
              >
                Start creating free
                <svg
                  className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-[56px] items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-8 py-4 text-base font-semibold text-white/88 backdrop-blur-xl transition-all duration-300 hover:border-werbens-light-cyan/28 hover:bg-white/8"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-10 grid max-w-[34rem] gap-4 sm:grid-cols-3">
              {HERO_METRICS.map((item, index) => (
                <div
                  key={item.label}
                  className={`animate-fade-in-up rounded-[1.35rem] border border-white/10 bg-[#08131f]/52 px-5 py-4 backdrop-blur-xl stagger-${index + 6}`}
                >
                  <div className="font-display text-2xl font-bold text-white sm:text-[2rem]">
                    {item.value}
                  </div>
                  <div className="mt-1 text-sm uppercase tracking-[0.18em] text-werbens-cloud/54">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
