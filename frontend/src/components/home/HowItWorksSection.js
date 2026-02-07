import Link from "next/link";

export function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Connect your platforms",
      desc: "Link Instagram, Facebook, LinkedIn, YouTube, TikTok, and more. Werbens securely connects via OAuth—no passwords stored.",
    },
    {
      num: "02",
      title: "Train your brand voice",
      desc: "Upload past content, brand guidelines, or describe your tone. Our AI learns your voice in minutes and maintains consistency forever.",
    },
    {
      num: "03",
      title: "Generate & publish",
      desc: "Describe what you need—a product launch, a weekly newsletter, a campaign. Werbens drafts, you approve, it publishes. Or go fully autonomous.",
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-werbens-text text-werbens-alt-text">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
          Three steps to autonomous content
        </h2>
        <p className="text-werbens-alt-text/70 text-base sm:text-lg md:text-xl max-w-2xl mb-10 sm:mb-16">
          From setup to scale in under an hour. No coding, no complex
          integrations.
        </p>
        <div className="space-y-8 sm:space-y-12">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row gap-4 sm:gap-8 items-start border-b border-werbens-alt-text/20 pb-8 sm:pb-12 last:border-0 last:pb-0"
            >
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-werbens-light-cyan/50 tabular-nums shrink-0">
                {step.num}
              </span>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-werbens-light-cyan mb-2">
                  {step.title}
                </h3>
                <p className="text-werbens-alt-text/80 text-lg leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 sm:mt-16">
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-werbens-light-cyan text-werbens-text font-semibold hover:bg-werbens-light-cyan/90 transition min-h-[48px]"
          >
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
}
