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

export default function Home() {
  return (
    <main>
      <HeroSection />
      <TrustedBySection />
      <ProblemSolutionSection />
      <FeaturesShowcase />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <UseCasesSection />
      <IntegrationsSection />
      <FAQSection />
      <CTASection />
      <FooterSection />
    </main>
  );
}
