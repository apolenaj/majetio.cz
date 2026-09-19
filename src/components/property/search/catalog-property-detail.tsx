import { Suspense } from "react";

import { CatalogDecisionView } from "@/components/property/search/catalog-decision-view";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteOrigin } from "@/domains/seo/site-origin";
import { catalogPropertyHref, type Property } from "@/lib/mock-properties";

function catalogListingJsonLd(property: Property) {
  const origin = getSiteOrigin();
  const url = `${origin}${catalogPropertyHref(property.id)}`;
  const city = property.lokalita.split(" - ")[0]?.trim() || property.lokalita;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.nazev,
    description: "Ukázková nabídka. Čísla analýzy nejsou odhad trhu.",
    url,
    offers: {
      "@type": "Offer",
      price: property.cena,
      priceCurrency: "CZK",
      availability: "https://schema.org/InStock",
      url,
    },
    contentLocation: {
      "@type": "Place",
      name: property.lokalita,
      address: {
        "@type": "PostalAddress",
        addressLocality: city,
        addressCountry: "CZ",
      },
    },
  };
}

export function CatalogPropertyDetail({ property }: { property: Property }) {
  return (
    <>
      <JsonLd id="catalog-listing" data={catalogListingJsonLd(property)} />
      <Suspense fallback={<div className="mx-auto max-w-[1440px] px-4 py-10 text-sm">Načítám detail…</div>}>
        <CatalogDecisionView property={property} />
      </Suspense>
    </>
  );
}
