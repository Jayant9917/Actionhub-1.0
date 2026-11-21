import { MarketingLayout } from "@/components/layout/MarketingLayout";
import {
  HeroSection,
  SocialProofSection,
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
        <SocialProofSection />
        <ProblemSection />
        <HowItWorksSection />
        <FeatureSection />
        <IntegrationsSection />
        <TestimonialsSection />
        <PricingPreviewSection />
        <FAQSection />
        <LandingFooter />
      </main>
    </MarketingLayout>
  );
}
