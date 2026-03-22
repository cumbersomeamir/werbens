const PAIN_POINTS = [
  "Inconsistent brand voice across channels",
  "Repetitive, time-consuming workflows",
  "Scaling content usually means scaling headcount",
];

const OUTCOMES = [
  "A single brand system across social, ads, and email",
  "Approval-ready drafts in minutes, not days",
  "Content volume that grows without growing your team",
];

export function ProblemSolutionSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#eef7f5_0%,#f8fffe_55%,#edf8f6_100%)] py-16 sm:py-24 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(127,231,220,0.12),transparent_28%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_92%_55%,rgba(49,104,121,0.09),transparent_22%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-werbens-dark-cyan/52">
            Why teams switch
          </p>
          <h2 className="font-display mt-4 text-4xl font-bold text-werbens-text sm:text-[3.2rem]">
            Content creation should feel like momentum, not drag.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-werbens-text/68">
            Manual workflows create bottlenecks, duplicate effort, and make it
            harder to keep every channel sounding like the same brand.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.96fr_1.04fr]">
          <article className="panel-surface rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-werbens-muted">
                  Before Werbens
                </p>
                <h3 className="font-display mt-3 text-3xl font-bold text-werbens-text">
                  Too much manual work
                </h3>
              </div>
              <div className="rounded-2xl bg-werbens-midnight px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/72">
                15+ hrs / week
              </div>
            </div>

            <p className="mt-5 text-base leading-relaxed text-werbens-text/70 sm:text-lg">
              Most businesses spend hours every week stitching together social
              media, email marketing, launch copy, and campaign follow-up.
              Quality slips as volume rises.
            </p>

            <div className="mt-7 space-y-3">
              {PAIN_POINTS.map((point, index) => (
                <div
                  key={point}
                  className={`flex items-start gap-3 rounded-[1.25rem] border border-werbens-dark-cyan/8 bg-white/78 px-4 py-4 animate-fade-in-up stagger-${index + 1}`}
                >
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-werbens-dark-cyan" />
                  <p className="text-sm font-medium leading-relaxed text-werbens-text/80 sm:text-base">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel-surface-dark rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-werbens-light-cyan/64">
                  After Werbens
                </p>
                <h3 className="font-display mt-3 text-3xl font-bold text-white sm:text-[2.65rem]">
                  A brand-safe system for always-on content
                </h3>
              </div>
              <div className="rounded-2xl border border-werbens-light-cyan/18 bg-werbens-light-cyan/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-werbens-light-cyan">
                Autonomous by design
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/68 sm:text-lg">
              Werbens learns your brand voice, converts briefs into polished
              campaigns, and keeps every output aligned from the first draft to
              final publish.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {OUTCOMES.map((outcome, index) => (
                <div
                  key={outcome}
                  className={`rounded-[1.35rem] border border-white/8 bg-white/[0.05] px-4 py-5 animate-fade-in-up stagger-${index + 3}`}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-werbens-light-cyan/66">
                    0{index + 1}
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-white/80">
                    {outcome}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
