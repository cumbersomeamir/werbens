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
import {
  appUrl,
  organizationId,
  organizationSchema,
  softwareSchema,
  websiteId,
} from "./seoPages";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      ...organizationSchema,
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: "Werbens",
      url: appUrl,
      publisher: { "@id": organizationId },
    },
    softwareSchema,
  ],
};

export default function Home() {
  return (
    <main className="home-page overflow-x-hidden">
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
