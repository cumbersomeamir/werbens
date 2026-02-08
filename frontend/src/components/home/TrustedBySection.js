export function TrustedBySection() {
  const traits = [
    { stat: "10,000+", label: "creators trust us" },
    { stat: "50M+", label: "content pieces generated" },
    { stat: "99.9%", label: "uptime guaranteed" },
    { stat: "Enterprise", label: "grade security" },
  ];

  return (
    <section className="py-14 sm:py-18 md:py-24 bg-gradient-to-b from-werbens-surface to-werbens-mist/30 border-y border-werbens-dark-cyan/8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="animate-fade-in-up stagger-1 text-center text-xs sm:text-sm font-semibold text-werbens-muted uppercase tracking-[0.2em] mb-10 sm:mb-14">
          Trusted by marketing teams worldwide
        </p>

        <div className="flex flex-wrap justify-center items-center gap-y-8">
          {traits.map((trait, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`animate-fade-in-up stagger-${i + 2} text-center px-6 sm:px-8 md:px-12`}
              >
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-werbens-dark-cyan tracking-tight">
                  {trait.stat}
                </p>
                <p className="mt-1.5 text-sm sm:text-base text-werbens-text/60 font-medium">
                  {trait.label}
                </p>
              </div>
              {i < traits.length - 1 && (
                <span className="hidden md:block w-1 h-1 rounded-full bg-werbens-dark-cyan/30 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
