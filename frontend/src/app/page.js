import {
  HeroSection,
  TrustedBySection,
  ProblemSolutionSection,
  FeaturesShowcase,
  HowItWorksSection,
  StatsSection,
  TestimonialsSection,
  UseCasesSection,
  IntegrationsSection,
  SEOContentSection,
  FAQSection,
  CTASection,
  FooterSection,
} from "@/components/home";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Werbens",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://app.werbens.com/app",
  description:
    "Marketing platform owned and operated by Werbens for reels, social posts, ad creatives, brand visuals, and campaign assets.",
  publisher: {
    "@type": "Organization",
    name: "Werbens",
    url: "https://app.werbens.com/app",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function Home() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HeroSection />
      <TrustedBySection />
      <ProblemSolutionSection />
      <FeaturesShowcase />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <UseCasesSection />
      <IntegrationsSection />
      <SEOContentSection />
      <FAQSection />
      <CTASection />
      <FooterSection />
    </main>
  );
}
