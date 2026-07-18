import type { Metadata } from "next";

import {
  AnnouncementBar,
  AudienceSegments,
  FinalCta,
  FinancingIntegration,
  HomepageFaq,
  HomepageHero,
  HowItWorks,
  MethodologyTrust,
  PricingPreview,
  PropertyComparisonPreview,
  RenovationLocationRisks,
  SampleAnalysis,
  ScoreAndMetrics,
  StrategyGrid,
} from "@/components/homepage";
import { InlineAlert } from "@/components/feedback/states";
import { Container } from "@/components/ui/container";
import { brand } from "@/config/brand";
import { homepageContent } from "@/content/homepage";

export const metadata: Metadata = {
  title: { absolute: `${brand.name} — ${homepageContent.hero.headline}` },
  description: homepageContent.hero.subheadline,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Majetio",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://majetio.cz",
    description: brand.claims.primary,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homepageContent.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <AnnouncementBar />
      <HomepageHero />

      <Container className="pt-6 sm:pt-8">
        <InlineAlert tone="info" title={homepageContent.financialDisclaimer.title}>
          {homepageContent.financialDisclaimer.text}
        </InlineAlert>
      </Container>

      <SampleAnalysis />
      <ScoreAndMetrics />
      <HowItWorks />
      <StrategyGrid />
      <AudienceSegments />
      <FinancingIntegration />
      <RenovationLocationRisks />
      <PropertyComparisonPreview />
      <PricingPreview />
      <MethodologyTrust />
      <HomepageFaq />
      <FinalCta />
    </>
  );
}
