import Link from "next/link";

const PLATFORM_PREVIEWS = [
  { label: "Instagram", title: "Summer drop teaser", progress: "92%" },
  { label: "LinkedIn", title: "Founder point of view", progress: "88%" },
  { label: "Email", title: "Launch sequence draft", progress: "95%" },
];

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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(127,231,220,0.16),transparent_34%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(92,224,210,0.12),transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,16,28,0.96),rgba(6,21,35,0.85)_58%,rgba(8,14,24,0.97))]" />
      <div className="hero-grid absolute inset-0 opacity-35" />
      <div className="absolute left-[10%] top-[12%] h-64 w-64 rounded-full bg-werbens-light-cyan/12 blur-[120px] animate-aurora" />
      <div className="absolute right-[8%] top-[28%] h-80 w-80 rounded-full bg-werbens-dark-cyan/30 blur-[140px] animate-aurora" />
      <div className="absolute bottom-[4%] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-werbens-light-cyan/10 blur-[160px] animate-drift-x" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 sm:pb-24 sm:pt-10 md:pb-28 md:pt-12">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)]">
          <div className="max-w-3xl">
            <span className="section-kicker animate-fade-in-up stagger-1">
              AI-Powered Content Creation Platform
            </span>

            <h1
              id="hero-heading"
              className="font-display animate-fade-in-up stagger-2 mt-7 text-[3.35rem] font-bold leading-[0.94] text-balance sm:text-[4.6rem] lg:text-[5.7rem]"
            >
              <span className="gradient-text-light">Create content.</span>
              <br />
              <span className="text-white/78">Automatically.</span>
            </h1>

            <p className="animate-fade-in-up stagger-3 mt-7 max-w-2xl text-lg leading-relaxed text-werbens-cloud/72 sm:text-xl md:text-[1.42rem]">
              Werbens is the autonomous content creation platform that
              generates brand-consistent social media posts, ad copy, emails,
              and marketing campaigns at scale. Save hours every week with AI
              that understands your voice.
            </p>

            <div className="animate-fade-in-up stagger-4 mt-9 flex flex-col gap-4 sm:flex-row">
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

            <div className="animate-fade-in-up stagger-5 mt-10 grid gap-4 sm:grid-cols-3">
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

          <div className="relative mx-auto w-full max-w-[35rem] animate-fade-in-up stagger-3">
            <div className="absolute inset-0 rounded-[2.2rem] bg-gradient-to-br from-werbens-light-cyan/28 via-transparent to-werbens-dark-cyan/26 blur-3xl" />
            <div className="absolute -left-3 bottom-12 hidden rounded-2xl border border-white/12 bg-[#071524]/88 px-4 py-3 text-sm font-semibold text-white/86 shadow-[0_24px_60px_rgba(3,8,20,0.28)] backdrop-blur-xl sm:flex animate-float-card">
              Voice locked in
            </div>
            <div className="absolute -right-3 top-10 hidden rounded-2xl border border-werbens-light-cyan/20 bg-werbens-light-cyan/12 px-4 py-3 text-sm font-semibold text-werbens-light-cyan shadow-[0_24px_60px_rgba(3,8,20,0.28)] backdrop-blur-xl sm:flex animate-float-card">
              24 approvals waiting
            </div>

            <div className="panel-surface-dark relative rounded-[2.2rem] p-4 sm:p-5">
              <div className="grid-fade soft-outline relative overflow-hidden rounded-[1.65rem] bg-[#06111d] p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-werbens-light-cyan/72">
                      Campaign cockpit
                    </p>
                    <p className="mt-2 font-display text-2xl font-bold text-white sm:text-[2rem]">
                      Output ready to ship
                    </p>
                  </div>
                  <div className="rounded-full border border-werbens-light-cyan/18 bg-werbens-light-cyan/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-werbens-light-cyan">
                    Live
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/42">
                          Brand profile
                        </p>
                        <p className="mt-2 font-display text-3xl font-bold text-white">
                          97% match
                        </p>
                      </div>
                      <div className="rounded-2xl bg-werbens-light-cyan/10 px-3 py-2 text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-werbens-light-cyan/70">
                          Status
                        </p>
                        <p className="mt-1 text-sm font-semibold text-werbens-light-cyan">
                          Locked
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-full bg-white/6">
                      <span className="animate-signal block h-3 rounded-full bg-gradient-to-r from-werbens-light-cyan via-[#9ff4e8] to-white" />
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/42">
                          Tone stack
                        </p>
                        <p className="mt-2 text-sm font-medium text-white/76">
                          Crisp, credible, conversion-ready
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/42">
                          Autonomy
                        </p>
                        <p className="mt-2 text-sm font-medium text-white/76">
                          Drafts, sequences, approvals
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/42">
                        Queue health
                      </p>
                      <p className="mt-3 font-display text-4xl font-bold text-white">
                        18
                      </p>
                      <p className="mt-2 text-sm text-white/62">
                        assets scheduled across this week
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/42">
                        Approval speed
                      </p>
                      <div className="mt-3 flex items-end gap-2">
                        <span className="font-display text-4xl font-bold text-white">
                          3.1x
                        </span>
                        <span className="pb-1 text-sm font-semibold text-werbens-light-cyan">
                          faster
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/62">
                        from brief to campaign-ready output
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {PLATFORM_PREVIEWS.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[1.35rem] border border-white/8 bg-white/[0.04] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/44">
                          {item.label}
                        </span>
                        <span className="rounded-full bg-werbens-light-cyan/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-werbens-light-cyan">
                          {item.progress}
                        </span>
                      </div>
                      <p className="mt-3 text-base font-semibold text-white/88">
                        {item.title}
                      </p>
                      <div className="mt-4 space-y-2">
                        <span className="block h-2.5 rounded-full bg-white/10" />
                        <span className="block h-2.5 w-4/5 rounded-full bg-white/8" />
                        <span className="block h-2.5 w-3/5 rounded-full bg-gradient-to-r from-werbens-light-cyan/80 to-white/60" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
