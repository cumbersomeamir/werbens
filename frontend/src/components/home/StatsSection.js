export function StatsSection() {
  const stats = [
    { value: "10x", label: "Faster content creation" },
    { value: "15hrs", label: "Saved per week on average" },
    { value: "50%", label: "Reduction in content costs" },
    { value: "99%", label: "Brand voice consistency" },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-werbens-light-cyan">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-werbens-dark-cyan tabular-nums">
                {stat.value}
              </p>
              <p className="mt-2 text-werbens-text/80 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
