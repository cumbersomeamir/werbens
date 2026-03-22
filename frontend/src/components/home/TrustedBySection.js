const TRAITS = [
  { stat: "10,000+", label: "creators trust us" },
  { stat: "50M+", label: "content pieces generated" },
  { stat: "99.9%", label: "uptime guaranteed" },
  { stat: "Enterprise", label: "grade security" },
];

export function TrustedBySection() {
  return (
    <section className="relative -mt-12 pb-10 sm:-mt-16 sm:pb-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="panel-surface relative overflow-hidden rounded-[2rem] px-5 py-6 sm:px-8 sm:py-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-werbens-light-cyan/70 to-transparent" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-werbens-dark-cyan/56">
                Trusted by marketing teams worldwide
              </p>
              <p className="mt-3 font-display text-2xl font-bold text-werbens-text sm:text-[2.2rem]">
                Built to scale output without losing your brand.
              </p>
            </div>

            <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {TRAITS.map((trait, index) => (
                <div
                  key={trait.label}
                  className={`rounded-[1.4rem] border border-werbens-dark-cyan/8 bg-white/72 px-4 py-4 shadow-[0_16px_40px_rgba(7,16,32,0.06)] animate-fade-in-up stagger-${index + 1}`}
                >
                  <p className="font-display text-[1.8rem] font-bold text-werbens-dark-cyan sm:text-[2.1rem]">
                    {trait.stat}
                  </p>
                  <p className="mt-2 text-sm uppercase tracking-[0.16em] text-werbens-muted">
                    {trait.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
