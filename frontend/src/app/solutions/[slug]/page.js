import Link from "next/link";
import { notFound } from "next/navigation";
import { findPage, industryPages, siteUrl, solutionPages } from "../../seoPages";

export function generateStaticParams() {
  return solutionPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = findPage(solutionPages, slug);

  if (!page) return {};

  const url = `/app/solutions/${page.slug}`;

  return {
    title: `${page.title} for Brands`,
    description: page.description,
    keywords: page.keywords.join(", "),
    alternates: { canonical: `${siteUrl}${url}` },
    openGraph: {
      title: `${page.title} | Werbens`,
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
    name: `${page.title} by Werbens`,
    provider: {
      "@type": "Organization",
      name: "Werbens",
      url: siteUrl,
    },
    serviceType: page.title,
    url: `${siteUrl}/app/solutions/${page.slug}`,
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

export default async function SolutionPage({ params }) {
  const { slug } = await params;
  const page = findPage(solutionPages, slug);

  if (!page) notFound();

  return (
    <main className="bg-werbens-mist text-werbens-text">
      <StructuredData page={page} />
      <section className="border-b border-werbens-dark-cyan/10 bg-gradient-to-b from-white to-werbens-surface py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-werbens-dark-cyan">
            Werbens solution
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight text-werbens-midnight sm:text-5xl md:text-6xl">
            {page.headline}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-werbens-steel">
            {page.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/packages"
              className="rounded-full bg-werbens-dark-cyan px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-werbens-dark-cyan/20"
            >
              View packages
            </Link>
            <Link
              href="/portfolio"
              className="rounded-full border border-werbens-dark-cyan/20 px-6 py-3 text-sm font-semibold text-werbens-dark-cyan"
            >
              See portfolio
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-18">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 sm:px-6 md:grid-cols-3">
          {page.outcomes.map((outcome, index) => (
            <article
              key={outcome}
              className="rounded-2xl border border-werbens-dark-cyan/10 bg-white p-6 shadow-sm"
            >
              <span className="text-sm font-bold text-werbens-light-cyan">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-4 leading-7 text-werbens-steel">{outcome}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-werbens-dark-cyan/10 bg-white py-14">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <h2 className="text-3xl font-bold text-werbens-midnight">
            Built for teams that need content across every channel.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industryPages.map((industry) => (
              <Link
                key={industry.slug}
                href={`/industries/${industry.slug}`}
                className="rounded-2xl border border-werbens-dark-cyan/10 p-5 transition hover:border-werbens-light-cyan hover:bg-werbens-mist"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-werbens-dark-cyan">
                  Industry
                </span>
                <h3 className="mt-3 text-xl font-bold text-werbens-midnight">{industry.title}</h3>
                <p className="mt-2 text-sm leading-6 text-werbens-steel">{industry.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
