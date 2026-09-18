import type { Metadata } from "next";

import { JsonLd, buildOrganizationJsonLd } from "@/components/seo/json-ld";
import { PlatformHomepage } from "@/components/marketing/platform-homepage";
import { brand } from "@/config/brand";
import { listCaseStudies } from "@/content/case-studies";
import { getSiteOrigin } from "@/domains/seo/site-origin";
import { listDiscoveryPropertyRecords } from "@/domains/properties/service/prisma-property-repository";
import { toPublicPropertyListItemDto } from "@/domains/properties/service/dto";
import { mapPublicDtoToPropertyCard } from "@/domains/properties/service/card-mapper";

const title = "Majetio — realitní inzertní platforma";
const description =
  "Nabízejte a hledejte nemovitosti, alternativní režimy bydlení a investování, nebo si nechte posoudit konkrétní nabídku.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: brand.name,
    locale: "cs_CZ",
    type: "website",
    images: [
      {
        url: "/case-studies/homepage-hero.png",
        width: 1200,
        height: 675,
        alt: "Majetio — nemovitosti",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/case-studies/homepage-hero.png"],
  },
};

export default async function HomePage() {
  const origin = getSiteOrigin();
  const studies = listCaseStudies();

  const records = await listDiscoveryPropertyRecords(12);
  const featuredListings = records
    .filter((r) => !r.isDemo)
    .slice(0, 6)
    .map((r) => mapPublicDtoToPropertyCard(toPublicPropertyListItemDto(r)));

  // If no live listings yet, show nothing (empty state) — do not pass demos as live.
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: origin,
    description,
    inLanguage: "cs-CZ",
    potentialAction: {
      "@type": "SearchAction",
      target: `${origin}/nemovitosti?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <JsonLd id="ld-organization" data={buildOrganizationJsonLd(origin)} />
      <JsonLd id="ld-website" data={websiteJsonLd} />
      <JsonLd
        id="ld-case-studies"
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Modelové analýzy Majetio",
          numberOfItems: studies.length,
          itemListElement: studies.map((study, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: study.definition.title,
            url: `${origin}/ukazky/${study.definition.slug}`,
          })),
        }}
      />
      <PlatformHomepage featuredListings={featuredListings} />
    </>
  );
}
