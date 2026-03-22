const FEATURES = [
  {
    icon: "01",
    title: "Brand voice cloning",
    desc: "AI learns your tone, vocabulary, and cadence so every draft sounds like your team wrote it.",
  },
  {
    icon: "02",
    title: "Multi-platform publishing",
    desc: "Turn one brief into content for Instagram, LinkedIn, X, email, and more without rebuilding it channel by channel.",
  },
  {
    icon: "03",
    title: "Performance insights",
    desc: "See what resonates and feed those learnings back into the next round of content automatically.",
  },
  {
    icon: "04",
    title: "Automated workflows",
    desc: "Queue drafts, approvals, and scheduling in one place so content moves forward without manual chasing.",
  },
  {
    icon: "05",
    title: "Audience segmentation",
    desc: "Generate variants for different audiences while keeping one consistent brand system underneath.",
  },
  {
    icon: "06",
    title: "Enterprise security",
    desc: "Protect brand assets with role-based access, secure infrastructure, and team-friendly governance controls.",
  },
];

export function FeaturesShowcase() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(127,231,220,0.12),transparent_24%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-werbens-dark-cyan/54">
              Platform capabilities
            </p>
            <h2 className="font-display mt-4 text-4xl font-bold text-werbens-text sm:text-[3.15rem]">
              Everything needed to run content as a system.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-werbens-text/68">
              Werbens combines AI writing, brand management, analytics, and
              publishing into one refined workflow instead of a stack of
              disconnected tools.
            </p>
          </div>

          <div className="panel-surface rounded-[2rem] px-5 py-5 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.4rem] bg-werbens-midnight px-4 py-5 text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-white/44">
                  Channels
                </p>
                <p className="font-display mt-3 text-3xl font-bold">12+</p>
                <p className="mt-2 text-sm text-white/60">
                  connected publishing surfaces
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-white px-4 py-5 shadow-[0_18px_35px_rgba(7,16,32,0.06)]">
                <p className="text-xs uppercase tracking-[0.24em] text-werbens-muted">
                  Workflows
                </p>
                <p className="font-display mt-3 text-3xl font-bold text-werbens-dark-cyan">
                  1 hub
                </p>
                <p className="mt-2 text-sm text-werbens-text/62">
                  for briefs, drafts, and approvals
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-gradient-to-br from-werbens-dark-cyan to-werbens-light-cyan px-4 py-5 text-white shadow-[0_22px_40px_rgba(49,104,121,0.2)]">
                <p className="text-xs uppercase tracking-[0.24em] text-white/62">
                  Lift
                </p>
                <p className="font-display mt-3 text-3xl font-bold">10x</p>
                <p className="mt-2 text-sm text-white/76">
                  faster content production
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <article
              key={feature.title}
              className={`group panel-surface rounded-[1.8rem] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_rgba(7,16,32,0.09)] animate-fade-in-up stagger-${(index % 6) + 1}`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-display text-[2.4rem] font-bold text-werbens-dark-cyan/88">
                  {feature.icon}
                </span>
                <span className="rounded-full border border-werbens-light-cyan/30 bg-werbens-light-cyan/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-werbens-dark-cyan">
                  Active
                </span>
              </div>

              <h3 className="font-display mt-8 text-2xl font-bold text-werbens-text">
                {feature.title}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-werbens-text/70">
                {feature.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
