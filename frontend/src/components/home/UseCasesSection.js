export function UseCasesSection() {
  const cases = [
    {
      title: "E-commerce brands",
      desc: "Product descriptions, social promos, email campaigns, and retargeting ads. Generate hundreds of SKU descriptions in minutes. Keep seasonal campaigns fresh.",
      keywords: "product copy, catalog content, flash sales",
    },
    {
      title: "SaaS & B2B",
      desc: "Blog posts, LinkedIn thought leadership, case studies, and nurture emails. Maintain a professional voice while scaling content for demand gen and customer success.",
      keywords: "thought leadership, case studies, nurture sequences",
    },
    {
      title: "Creators & influencers",
      desc: "Captions, stories, Reels scripts, and sponsor posts. Stay consistent across platforms while you focus on creating. Your voice, amplified.",
      keywords: "captions, Reels, TikTok, creator economy",
    },
    {
      title: "Agencies",
      desc: "Manage multiple client brands from one dashboard. Switch context instantly. Deliver more work without more people. White-label and resell.",
      keywords: "agency workflow, multi-brand, client management",
    },
  ];

  return (
    <section className="py-16 sm:py-20 md:py-28 bg-gradient-to-b from-werbens-mist to-werbens-cloud">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 sm:mb-16 animate-fade-in">
          <p className="text-sm font-semibold tracking-widest uppercase text-werbens-light-cyan mb-3">
            Use Cases
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-werbens-dark-cyan mb-3 sm:mb-4">
            Built for every type of content creator
          </h2>
          <p className="text-base sm:text-lg text-werbens-text/80 max-w-2xl leading-relaxed">
            Whether you&apos;re a solopreneur, a marketing team, or an agency
            managing dozens of brands—Werbens adapts to your workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
          {cases.map((c, i) => (
            <article
              key={i}
              className={`relative bg-white rounded-2xl p-6 sm:p-8 border-l-4 border-l-werbens-light-cyan shadow-sm hover:shadow-elevated hover-lift transition-all duration-300 animate-fade-in-up stagger-${i + 1}`}
            >
              {/* Subtle number indicator */}
              <span className="absolute top-6 right-6 text-5xl font-black text-werbens-light-cyan/10 select-none pointer-events-none leading-none">
                {String(i + 1).padStart(2, "0")}
              </span>

              <h3 className="text-xl font-bold text-werbens-dark-cyan mb-3">
                {c.title}
              </h3>
              <p className="text-werbens-text/80 leading-relaxed mb-5">
                {c.desc}
              </p>

              {/* Keyword pills */}
              <div className="flex flex-wrap gap-2">
                {c.keywords.split(", ").map((keyword, k) => (
                  <span
                    key={k}
                    className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-werbens-light-cyan/20 text-werbens-dark-cyan"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
