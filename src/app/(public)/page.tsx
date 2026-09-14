import type { Metadata } from "next";

import { JsonLd, buildOrganizationJsonLd } from "@/components/seo/json-ld";
import { AnnouncementBar } from "@/components/homepage/announcement-bar";
import { HomepageBody } from "@/components/homepage/homepage-body";
import { HomepageHero } from "@/components/homepage/homepage-hero";
import { HomepageViewTracker } from "@/components/homepage/tracked";
import { InlineAlert } from "@/components/feedback/states";
import { Container } from "@/components/ui/container";
import { brand } from "@/config/brand";
import {
  homepageExperimentDefaults,
  homepageSeo,
  resolveHomepageHero,
  resolveHomepageSectionOrder,
} from "@/config/homepage";
import { homepageContent } from "@/content/homepage";
import { getSiteOrigin } from "@/domains/seo/site-origin";

export const metadata: Metadata = {
  title: { absolute: homepageSeo.title },
  description: homepageSeo.description,
  alternates: { canonical: homepageSeo.canonicalPath },
  robots: { index: true, follow: true },
  openGraph: {
    title: homepageSeo.title,
    description: homepageSeo.description,
    url: homepageSeo.canonicalPath,
    siteName: brand.name,
    locale: "cs_CZ",
    type: "website",
    images: [
      {
        url: homepageSeo.ogImagePath,
        width: 1200,
        height: 630,
        alt: homepageSeo.ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: homepageSeo.title,
    description: homepageSeo.description,
    images: [homepageSeo.ogImagePath],
  },
};

export default function HomePage() {
  const experiments = homepageExperimentDefaults;
  const hero = resolveHomepageHero({
    h1: experiments.homepage_h1,
    cta: experiments.homepage_primary_cta,
  });
  const sectionOrder = resolveHomepageSectionOrder(
    experiments.homepage_section_order,
  );
  const origin = getSiteOrigin();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: origin,
    description: homepageSeo.description,
    inLanguage: "cs-CZ",
    // Browse entry — avoid ?q= SearchAction that lands on noindex filtered SERP
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin}/nemovitosti`,
      },
    },
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
      <JsonLd id="ld-organization" data={buildOrganizationJsonLd(origin)} />
      <JsonLd id="ld-website" data={websiteJsonLd} />
      <JsonLd id="ld-faq" data={faqJsonLd} />

      <HomepageViewTracker
        experimentH1={experiments.homepage_h1}
        experimentCta={experiments.homepage_primary_cta}
        experimentOrder={experiments.homepage_section_order}
      />

      <AnnouncementBar />
      <HomepageHero hero={hero} experimentVariant={experiments.homepage_h1} />

      <Container className="overflow-x-clip pt-6 sm:pt-8">
        <InlineAlert
          tone="info"
          title={homepageContent.financialDisclaimer.title}
        >
          {homepageContent.financialDisclaimer.text}
        </InlineAlert>
      </Container>

      <HomepageBody order={sectionOrder} />
    </>
  );
}
