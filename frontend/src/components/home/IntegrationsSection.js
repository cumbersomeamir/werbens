export function IntegrationsSection() {
  const groups = [
    {
      label: "Social",
      platforms: [
        "Instagram",
        "Facebook",
        "Twitter / X",
        "LinkedIn",
        "YouTube",
        "TikTok",
        "Pinterest",
        "Google My Business",
      ],
    },
    {
      label: "Email",
      platforms: ["Mailchimp", "Klaviyo", "HubSpot"],
    },
    {
      label: "CMS",
      platforms: ["WordPress"],
    },
  ];

  let globalIndex = 0;

  return (
    <section className="py-16 sm:py-20 md:py-28 bg-white border-t border-werbens-dark-cyan/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16 animate-fade-in">
          <p className="text-sm font-semibold tracking-widest uppercase text-werbens-light-cyan mb-3">
            Integrations
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-werbens-dark-cyan mb-3 sm:mb-4">
            Connect your entire content stack
          </h2>
          <p className="text-werbens-text/80 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Werbens integrates with the platforms and tools you already use.
            One content hub, all your channels. SEO-optimized content for blogs
            and websites too.
          </p>
        </div>

        <div className="space-y-10">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold tracking-widest uppercase text-werbens-muted text-center mb-4">
                {group.label}
              </p>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                {group.platforms.map((p) => {
                  const idx = globalIndex++;
                  const stagger = (idx % 8) + 1;
                  return (
                    <span
                      key={p}
                      className={`glass px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-werbens-dark-cyan font-medium text-sm border border-werbens-dark-cyan/10 shadow-sm cursor-default transition-all duration-300 hover:scale-105 hover:glow-sm hover:border-werbens-light-cyan/40 hover:text-werbens-light-cyan hover:shadow-elevated animate-fade-in-up stagger-${stagger}`}
                    >
                      {p}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
