export function StatsSection() {
  const stats = [
    { value: "10x", label: "Faster content creation" },
    { value: "15hrs", label: "Saved per week on average" },
    { value: "50%", label: "Reduction in content costs" },
    { value: "99%", label: "Brand voice consistency" },
  ];

  const staggerClass = ["stagger-1", "stagger-3", "stagger-5", "stagger-7"];

  return (
    <section className="relative py-16 sm:py-20 md:py-28 bg-werbens-deep overflow-hidden">
      {/* Subtle ambient glow spots */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-werbens-light-cyan/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-werbens-dark-cyan/[0.06] rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 lg:gap-0">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`relative text-center px-4 sm:px-6 lg:px-8 animate-fade-in-up ${staggerClass[i]}`}
            >
              {/* Vertical divider (desktop only, not on first item) */}
              {i > 0 && (
                <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 h-16 w-px bg-gradient-to-b from-transparent via-werbens-light-cyan/20 to-transparent" />
              )}

              {/* Glow behind stat value */}
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-werbens-light-cyan/[0.08] blur-2xl rounded-full scale-150 pointer-events-none" />
                <p className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black gradient-text-light tabular-nums tracking-tight">
                  {stat.value}
                </p>
              </div>

              <p className="mt-3 sm:mt-4 text-werbens-alt-text/60 font-medium text-sm sm:text-base tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
