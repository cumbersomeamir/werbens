export function IntegrationsSection() {
  const platforms = [
    "Instagram",
    "Facebook",
    "Twitter / X",
    "LinkedIn",
    "YouTube",
    "TikTok",
    "Pinterest",
    "Google My Business",
    "Mailchimp",
    "Klaviyo",
    "HubSpot",
    "WordPress",
  ];

  return (
    <section className="py-24 bg-white border-t border-werbens-dark-cyan/10">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-4xl font-bold text-werbens-dark-cyan text-center mb-4">
          Connect your entire content stack
        </h2>
        <p className="text-center text-werbens-text/80 max-w-2xl mx-auto mb-12">
          Werbens integrates with the platforms and tools you already use.
          One content hub, all your channels. SEO-optimized content for blogs
          and websites too.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {platforms.map((p, i) => (
            <span
              key={i}
              className="px-4 py-2 rounded-full bg-werbens-light-cyan/50 text-werbens-dark-cyan font-medium text-sm border border-werbens-dark-cyan/20"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
