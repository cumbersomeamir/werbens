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
    <section className="py-24 bg-werbens-dark-cyan/5">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-4xl font-bold text-werbens-dark-cyan mb-4">
          Built for every type of content creator
        </h2>
        <p className="text-lg text-werbens-text/80 max-w-2xl mb-16">
          Whether you&apos;re a solopreneur, a marketing team, or an agency
          managing dozens of brands—Werbens adapts to your workflow.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {cases.map((c, i) => (
            <article
              key={i}
              className="bg-white rounded-2xl p-8 shadow-lg shadow-werbens-dark-cyan/5"
            >
              <h3 className="text-xl font-bold text-werbens-dark-cyan mb-3">
                {c.title}
              </h3>
              <p className="text-werbens-text/80 leading-relaxed mb-4">
                {c.desc}
              </p>
              <p className="text-sm text-werbens-dark-cyan/70">{c.keywords}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
