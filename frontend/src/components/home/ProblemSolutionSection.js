export function ProblemSolutionSection() {
  const painPoints = [
    "Inconsistent brand voice across channels",
    "Repetitive, time-consuming workflows",
    "Scaling content = scaling headcount",
  ];

  return (
    <section className="noise relative py-16 sm:py-24 md:py-32 bg-werbens-midnight text-werbens-alt-text overflow-hidden">
      {/* Subtle background gradient accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_50%,rgba(127,231,220,0.06),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_100%_80%,rgba(0,139,139,0.08),transparent)]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Problem side */}
          <div>
            <h2 className="animate-fade-in-up stagger-1 text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 tracking-tight leading-[1.1]">
              Content creation shouldn&apos;t be a bottleneck
            </h2>
            <p className="animate-fade-in-up stagger-2 text-werbens-cloud/60 text-lg sm:text-xl leading-relaxed mb-8">
              Most businesses spend 15+ hours weekly on social media, email
              marketing, and ad copy. Manual content creation drains resources,
              creates inconsistencies, and slows growth. Marketing teams are
              stretched thin while quality suffers.
            </p>
            <ul className="space-y-4">
              {painPoints.map((point, i) => (
                <li
                  key={i}
                  className={`animate-fade-in-up stagger-${i + 3} flex items-center gap-3 text-werbens-cloud/80 text-base sm:text-lg`}
                >
                  <span className="relative flex-shrink-0 w-2.5 h-2.5">
                    <span className="absolute inset-0 rounded-full bg-werbens-glow animate-pulse-glow" />
                    <span className="absolute inset-0 rounded-full bg-werbens-glow" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Solution side */}
          <div className="animate-fade-in-up stagger-6 glass-dark glow-sm rounded-3xl p-8 sm:p-10 border border-werbens-light-cyan/15">
            <h3 className="text-2xl sm:text-3xl font-bold text-werbens-light-cyan mb-5 tracking-tight">
              Werbens fixes this
            </h3>
            <p className="text-werbens-cloud/70 text-base sm:text-lg leading-relaxed">
              Our AI content engine learns your brand voice, tone, and style.
              Connect your platforms once—Instagram, Facebook, LinkedIn,
              YouTube—and generate weeks of content in minutes. Maintain
              consistency, scale without hiring, and focus on strategy instead
              of copy-paste.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
