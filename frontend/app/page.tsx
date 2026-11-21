import { MarketingLayout } from "@/components/layout/MarketingLayout";
import {
  HeroSection,
  ProblemSection,
  HowItWorksSection,
  FeatureSection,
  IntegrationsSection,
  TestimonialsSection,
  PricingPreviewSection,
  FAQSection,
  LandingFooter,
} from "@/components/landing";

export default function Home() {
  return (
    <MarketingLayout>
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FeatureSection />
        <IntegrationsSection />
        <TestimonialsSection />
        <FAQSection />
        <PricingPreviewSection />
        <LandingFooter />
      </main>
    </MarketingLayout>
  );
}
