import {
  AudienceSegments,
  FinalCta,
  FinancingIntegration,
  HomepageFaq,
  HowItWorks,
  MethodologyTrust,
  PricingPreview,
  PropertyComparisonPreview,
  RenovationLocationRisks,
  SampleAnalysis,
  ScoreAndMetrics,
  StrategyGrid,
} from "@/components/homepage";
import type { HomepageSectionId } from "@/config/homepage";

/**
 * Renders homepage body sections in experiment-resolvable order.
 * Each section stays an isolated server (or async) component.
 */
export function HomepageBody({ order }: { order: readonly HomepageSectionId[] }) {
  return (
    <>
      {order.map((id) => {
        switch (id) {
          case "sampleAnalysis":
            return <SampleAnalysis key={id} />;
          case "scoreAndMetrics":
            return <ScoreAndMetrics key={id} />;
          case "howItWorks":
            return <HowItWorks key={id} />;
          case "strategies":
            return <StrategyGrid key={id} />;
          case "audiences":
            return <AudienceSegments key={id} />;
          case "financing":
            return <FinancingIntegration key={id} />;
          case "renovationLocationRisks":
            return <RenovationLocationRisks key={id} />;
          case "comparison":
            return <PropertyComparisonPreview key={id} />;
          case "pricing":
            return <PricingPreview key={id} />;
          case "methodology":
            return <MethodologyTrust key={id} />;
          case "faq":
            return <HomepageFaq key={id} />;
          case "finalCta":
            return <FinalCta key={id} />;
          default: {
            const _exhaustive: never = id;
            return _exhaustive;
          }
        }
      })}
    </>
  );
}
