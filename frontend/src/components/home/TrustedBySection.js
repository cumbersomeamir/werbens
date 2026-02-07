export function TrustedBySection() {
  const traits = [
    "Trusted by 10,000+ creators",
    "50M+ content pieces generated",
    "99.9% uptime",
    "Enterprise-grade security",
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white border-y border-werbens-dark-cyan/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs sm:text-sm font-medium text-werbens-text/60 uppercase tracking-widest mb-8 sm:mb-12">
          Trusted by marketing teams worldwide
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
          {traits.map((trait, i) => (
            <div
              key={i}
              className="text-center"
            >
              <p className="text-werbens-dark-cyan font-semibold text-sm sm:text-base md:text-lg break-words">
                {trait}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
