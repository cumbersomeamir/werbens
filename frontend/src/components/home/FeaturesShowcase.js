export function FeaturesShowcase() {
  const features = [
    {
      icon: "\u2728",
      title: "Brand voice cloning",
      desc: "AI learns your unique tone, vocabulary, and style. Every piece of content sounds like you wrote it\u2014because the AI was trained on your best work.",
    },
    {
      icon: "\uD83D\uDE80",
      title: "Multi-platform publishing",
      desc: "Create once, publish everywhere. Instagram captions, LinkedIn posts, Twitter threads, email subject lines\u2014all optimized per platform from a single input.",
    },
    {
      icon: "\uD83D\uDCCA",
      title: "Performance insights",
      desc: "Track what works. Werbens analyzes engagement, suggests improvements, and automatically optimizes future content based on your audience data.",
    },
    {
      icon: "\uD83D\uDD04",
      title: "Automated workflows",
      desc: "Set schedules, triggers, and approval flows. Content goes from draft to published without manual handoffs. Perfect for teams and agencies.",
    },
    {
      icon: "\uD83C\uDFAF",
      title: "Audience segmentation",
      desc: "Tailor messages to different customer segments. B2B vs B2C, new vs returning\u2014Werbens generates variants that resonate with each group.",
    },
    {
      icon: "\uD83D\uDD12",
      title: "Enterprise security",
      desc: "SOC 2 compliant, GDPR ready. Your brand assets and customer data stay protected with role-based access and audit logs.",
    },
  ];

  const staggerClass = [
    "stagger-1",
    "stagger-2",
    "stagger-3",
    "stagger-4",
    "stagger-5",
    "stagger-6",
  ];

  return (
    <section className="py-16 sm:py-20 md:py-28 bg-gradient-to-b from-werbens-mist to-werbens-surface">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-werbens-dark-cyan mb-4 sm:mb-5 tracking-tight">
            Everything you need for{" "}
            <span className="gradient-text">content at scale</span>
          </h2>
          <p className="text-base sm:text-lg text-werbens-text/70 leading-relaxed">
            Werbens combines AI writing, brand management, and cross-channel
            publishing in one platform. No more juggling tools or losing your
            voice.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
          {features.map((f, i) => (
            <article
              key={i}
              className={`group glass bg-white/80 rounded-2xl p-7 sm:p-8 border border-werbens-steel/20 shadow-elevated hover-lift hover:glow-sm hover:border-werbens-light-cyan/40 transition-all duration-500 animate-fade-in-up ${staggerClass[i]}`}
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-werbens-dark-cyan to-werbens-light-cyan flex items-center justify-center mb-5 shadow-lg shadow-werbens-dark-cyan/20 group-hover:shadow-werbens-light-cyan/30 transition-shadow duration-500">
                <span className="text-2xl leading-none filter brightness-0 invert">
                  {f.icon}
                </span>
              </div>
              <h3 className="text-xl font-bold text-werbens-dark-cyan mb-2.5 group-hover:text-werbens-dark-cyan/90 transition-colors duration-300">
                {f.title}
              </h3>
              <p className="text-werbens-text/70 leading-relaxed text-[0.938rem]">
                {f.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
