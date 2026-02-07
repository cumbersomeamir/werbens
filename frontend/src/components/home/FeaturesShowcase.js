export function FeaturesShowcase() {
  const features = [
    {
      icon: "✨",
      title: "Brand voice cloning",
      desc: "AI learns your unique tone, vocabulary, and style. Every piece of content sounds like you wrote it—because the AI was trained on your best work.",
    },
    {
      icon: "🚀",
      title: "Multi-platform publishing",
      desc: "Create once, publish everywhere. Instagram captions, LinkedIn posts, Twitter threads, email subject lines—all optimized per platform from a single input.",
    },
    {
      icon: "📊",
      title: "Performance insights",
      desc: "Track what works. Werbens analyzes engagement, suggests improvements, and automatically optimizes future content based on your audience data.",
    },
    {
      icon: "🔄",
      title: "Automated workflows",
      desc: "Set schedules, triggers, and approval flows. Content goes from draft to published without manual handoffs. Perfect for teams and agencies.",
    },
    {
      icon: "🎯",
      title: "Audience segmentation",
      desc: "Tailor messages to different customer segments. B2B vs B2C, new vs returning—Werbens generates variants that resonate with each group.",
    },
    {
      icon: "🔒",
      title: "Enterprise security",
      desc: "SOC 2 compliant, GDPR ready. Your brand assets and customer data stay protected with role-based access and audit logs.",
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-white to-werbens-light-cyan/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-werbens-dark-cyan mb-3 sm:mb-4">
            Everything you need for content at scale
          </h2>
          <p className="text-base sm:text-lg text-werbens-text/80">
            Werbens combines AI writing, brand management, and cross-channel
            publishing in one platform. No more juggling tools or losing your
            voice.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <article
              key={i}
              className="group bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-werbens-dark-cyan/10 hover:border-werbens-dark-cyan/30 hover:shadow-xl hover:shadow-werbens-dark-cyan/5 transition-all duration-300"
            >
              <span className="text-4xl mb-4 block">{f.icon}</span>
              <h3 className="text-xl font-bold text-werbens-dark-cyan mb-2 group-hover:text-werbens-dark-cyan/90">
                {f.title}
              </h3>
              <p className="text-werbens-text/80 leading-relaxed">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
