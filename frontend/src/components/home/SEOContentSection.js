import Link from "next/link";

export function SEOContentSection() {
  const solutionLinks = [
    ["AI reel generator", "/solutions/ai-reel-generator"],
    ["AI ad creatives", "/solutions/ai-ad-creatives"],
    ["Social media automation", "/solutions/social-media-automation"],
    ["Personal brand content", "/solutions/personal-brand-content"],
    ["Food brand content", "/industries/restaurants-and-food-brands"],
    ["SaaS content marketing", "/industries/saas-and-b2b"],
  ];

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-white border-t border-werbens-dark-cyan/8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 animate-fade-in">
        <article className="prose prose-lg max-w-none border-l-[3px] border-werbens-dark-cyan/20 pl-6 sm:pl-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-werbens-dark-cyan mb-6 !mt-0">
            Why choose Werbens for AI content creation?
          </h2>
          <p className="text-werbens-text/80 leading-[1.8] mb-6 text-[15px] sm:text-base break-words [&>strong]:text-werbens-dark-cyan [&>strong]:font-semibold">
            Werbens is a <strong>marketing company</strong> that owns and operates an{" "}
            <strong>autonomous content creation platform</strong> for businesses that
            want to scale their <strong>social media marketing</strong>,{" "}
            <strong>email campaigns</strong>, and <strong>ad copy</strong> without hiring more
            writers. Our <strong>AI content generator</strong> learns your{" "}
            <strong>brand voice</strong> and produces consistent, on-brand content for{" "}
            <strong>Instagram</strong>, <strong>Facebook</strong>, <strong>LinkedIn</strong>,{" "}
            <strong>YouTube</strong>, <strong>TikTok</strong>, and more. Whether you need{" "}
            <strong>social media automation</strong>, <strong>SEO content</strong>, or{" "}
            <strong>marketing automation</strong>, Werbens helps you create content at scale
            while maintaining quality and <strong>brand consistency</strong>.
          </p>
          <p className="text-werbens-text/80 leading-[1.8] text-[15px] sm:text-base [&>strong]:text-werbens-dark-cyan [&>strong]:font-semibold">
            Built for <strong>e-commerce brands</strong>, <strong>SaaS companies</strong>,{" "}
            <strong>content creators</strong>, and <strong>marketing agencies</strong>. Start
            your free trial today and experience the future of{" "}
            <strong>content marketing</strong>—autonomous, intelligent, and infinitely
            scalable.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {solutionLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-werbens-dark-cyan/12 px-4 py-2 text-sm font-semibold text-werbens-dark-cyan transition hover:border-werbens-light-cyan hover:bg-werbens-light-cyan/10"
              >
                {label}
              </Link>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
