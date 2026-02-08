import Link from "next/link";

export function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Connect your platforms",
      desc: "Link Instagram, Facebook, LinkedIn, YouTube, TikTok, and more. Werbens securely connects via OAuth\u2014no passwords stored.",
    },
    {
      num: "02",
      title: "Train your brand voice",
      desc: "Upload past content, brand guidelines, or describe your tone. Our AI learns your voice in minutes and maintains consistency forever.",
    },
    {
      num: "03",
      title: "Generate & publish",
      desc: "Describe what you need\u2014a product launch, a weekly newsletter, a campaign. Werbens drafts, you approve, it publishes. Or go fully autonomous.",
    },
  ];

  const staggerClass = ["stagger-1", "stagger-3", "stagger-5"];

  return (
    <section className="relative py-16 sm:py-20 md:py-28 bg-werbens-midnight text-werbens-alt-text overflow-hidden">
      {/* Noise texture overlay */}
      <div className="absolute inset-0 noise opacity-[0.03] pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl mb-14 sm:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 tracking-tight animate-fade-in">
            Three steps to{" "}
            <span className="gradient-text-light">autonomous content</span>
          </h2>
          <p className="text-werbens-alt-text/60 text-base sm:text-lg md:text-xl leading-relaxed animate-fade-in stagger-2">
            From setup to scale in under an hour. No coding, no complex
            integrations.
          </p>
        </div>

        <div className="relative">
          {/* Vertical connecting line */}
          <div className="hidden md:block absolute left-[3.25rem] top-8 bottom-8 w-px bg-gradient-to-b from-werbens-light-cyan/40 via-werbens-light-cyan/20 to-transparent" />

          <div className="space-y-10 sm:space-y-14">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`relative flex flex-col md:flex-row gap-6 sm:gap-10 items-start animate-slide-in-right ${staggerClass[i]}`}
              >
                {/* Step number */}
                <div className="relative shrink-0 z-10">
                  <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black gradient-text-light tabular-nums leading-none select-none opacity-90">
                    {step.num}
                  </span>
                </div>

                {/* Step content */}
                <div className="md:pt-4 lg:pt-6">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-werbens-light-cyan mb-3">
                    {step.title}
                  </h3>
                  <p className="text-werbens-alt-text/70 text-base sm:text-lg leading-relaxed max-w-xl">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 sm:mt-20 animate-fade-in-up stagger-6">
          <Link
            href="/onboarding"
            className="group relative inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl bg-werbens-light-cyan text-werbens-midnight font-semibold text-lg glow hover:brightness-110 transition-all duration-300 min-h-[48px]"
          >
            Get started
            <svg
              className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
