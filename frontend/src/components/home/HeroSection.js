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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(127,231,220,0.18),transparent_34%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(92,224,210,0.12),transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,16,28,0.98),rgba(6,21,35,0.9)_58%,rgba(8,14,24,0.98))]" />
      <div className="hero-grid absolute inset-0 opacity-35" />
      <div className="absolute left-[10%] top-[12%] h-64 w-64 rounded-full bg-werbens-light-cyan/10 blur-[120px] animate-aurora" />
      <div className="absolute right-[8%] top-[28%] h-80 w-80 rounded-full bg-werbens-dark-cyan/26 blur-[140px] animate-aurora" />
      <div className="absolute bottom-[8%] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-werbens-light-cyan/8 blur-[170px] animate-drift-x" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pb-24 sm:pt-10 md:pb-28 md:pt-12">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(340px,1.02fr)] lg:gap-x-12 lg:gap-y-10">
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
              <span className="text-white/82">Automatically.</span>
            </h1>

            <p className="animate-fade-in-up stagger-3 mt-6 max-w-2xl text-[1.02rem] leading-relaxed text-werbens-cloud/72 sm:mt-7 sm:text-xl md:text-[1.42rem]">
              Werbens is the autonomous content creation platform that
              generates brand-consistent social media posts, ad copy, emails,
              and marketing campaigns at scale. Save hours every week with AI
              that understands your voice.
            </p>
          </div>

          <div className="animate-fade-in-up stagger-4">
            <HeroShowcaseScene />
          </div>

          <div className="animate-fade-in-up stagger-5 lg:max-w-3xl">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/onboarding"
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

            <div className="mt-10 hidden gap-4 sm:grid sm:grid-cols-3">
              {HERO_METRICS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl"
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
