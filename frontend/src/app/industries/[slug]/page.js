import Link from "next/link";
import { notFound } from "next/navigation";
import { findPage, industryPages, siteUrl, solutionPages } from "../../seoPages";

export function generateStaticParams() {
  return industryPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = findPage(industryPages, slug);

  if (!page) return {};

  const url = `/app/industries/${page.slug}`;

  return {
    title: `${page.title} Content Marketing`,
    description: page.description,
    keywords: page.keywords.join(", "),
    alternates: { canonical: `${siteUrl}${url}` },
    openGraph: {
      title: `${page.title} Content Marketing | Werbens`,
      description: page.description,
      url: `${siteUrl}${url}`,
      type: "website",
    },
  };
}

function StructuredData({ page }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${page.title} content marketing by Werbens`,
    provider: {
      "@type": "Organization",
      name: "Werbens",
      url: siteUrl,
    },
    serviceType: "AI content marketing",
    url: `${siteUrl}/app/industries/${page.slug}`,
    description: page.description,
    areaServed: ["India", "United States", "United Kingdom"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function IndustryPage({ params }) {
  const { slug } = await params;
  const page = findPage(industryPages, slug);

  if (!page) notFound();

  return (
    <main className="bg-werbens-mist text-werbens-text">
      <StructuredData page={page} />
      <section className="border-b border-werbens-dark-cyan/10 bg-gradient-to-br from-werbens-midnight via-werbens-deep to-[#07131d] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-werbens-light-cyan">
            Industry content marketing
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            {page.headline}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">{page.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/portfolio"
              className="rounded-full bg-werbens-light-cyan px-6 py-3 text-sm font-semibold text-werbens-midnight"
            >
              View related work
            </Link>
            <Link
              href="/packages"
              className="rounded-full border border-white/18 px-6 py-3 text-sm font-semibold text-white"
            >
              See packages
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
            <article className="rounded-3xl border border-werbens-dark-cyan/10 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-bold text-werbens-midnight">
                What Werbens creates for {page.title.toLowerCase()}
              </h2>
              <ul className="mt-6 space-y-4 text-werbens-steel">
                <li>Ready-to-post reels, short videos, and visual campaigns.</li>
                <li>Ad creatives, campaign hooks, captions, and platform-specific copy.</li>
                <li>Brand visuals that stay consistent across organic and paid channels.</li>
                <li>Creative systems that can scale every week as content demand grows.</li>
              </ul>
            </article>
            <article className="rounded-3xl border border-werbens-dark-cyan/10 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-bold text-werbens-midnight">
                Relevant Werbens solutions
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {solutionPages.slice(0, 4).map((solution) => (
                  <Link
                    key={solution.slug}
                    href={`/solutions/${solution.slug}`}
                    className="rounded-2xl border border-werbens-dark-cyan/10 p-4 text-sm font-semibold text-werbens-dark-cyan transition hover:border-werbens-light-cyan hover:bg-werbens-mist"
                  >
                    {solution.title}
                  </Link>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
