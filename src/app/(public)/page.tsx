import type { Metadata } from "next";

import { JsonLd, buildOrganizationJsonLd } from "@/components/seo/json-ld";
import { MarketingHomepage } from "@/components/marketing/marketing-homepage";
import { brand } from "@/config/brand";
import { getFeaturedCaseStudy, listCaseStudies } from "@/content/case-studies";
import { getSiteOrigin } from "@/domains/seo/site-origin";

const title = "Majetio — analýza nemovitosti před koupí";
const description =
  "Než koupíte nemovitost, poznejte její čísla i rizika. Ekonomika koupě, náklady, scénáře a otázky k ověření.";

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
        alt: "Ilustrační fotografie — Majetio",
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

export default function HomePage() {
  const origin = getSiteOrigin();
  const featured = getFeaturedCaseStudy();
  const studies = listCaseStudies();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: origin,
    description,
    inLanguage: "cs-CZ",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Umíte načíst inzerát automaticky?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Zatím ne. Pošlete odkaz nebo údaje ručně — podklady doplníme při zpracování poptávky.",
        },
      },
      {
        "@type": "Question",
        name: "Je odeslání formuláře objednávkou?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ne. Jde o nezávaznou poptávku. Platbu nespouštíme, dokud nebude funkční objednávkový proces.",
        },
      },
    ],
  };

  return (
    <>
      <JsonLd id="ld-organization" data={buildOrganizationJsonLd(origin)} />
      <JsonLd id="ld-website" data={websiteJsonLd} />
      <JsonLd id="ld-faq" data={faqJsonLd} />
      <JsonLd
        id="ld-featured-study"
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
      <p className="sr-only">
        Ukázková studie: {featured.definition.title}
      </p>
      <MarketingHomepage />
    </>
  );
}
