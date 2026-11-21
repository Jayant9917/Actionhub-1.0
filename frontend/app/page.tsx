import { MarketingLayout } from "@/components/layout/MarketingLayout";
import {
  FAQSection,
  FinalCTASection,
  HeroSection,
  HowItWorksSection,
  IntegrationsSection,
  LandingFooter,
  TaskHistorySection,
} from "@/components/landing";

export default function Home() {
  return (
    <MarketingLayout>
      <main>
        <HeroSection />
        <HowItWorksSection />
        <TaskHistorySection />
        <IntegrationsSection />
        <FAQSection />
        <FinalCTASection />
        <LandingFooter />
      </main>
    </MarketingLayout>
  );
}
