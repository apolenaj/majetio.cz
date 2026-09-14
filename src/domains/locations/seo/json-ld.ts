/**
 * Location page JSON-LD — BreadcrumbList + Place only.
 * Never emit AggregateRating / Review (no fake ratings).
 */

import type { LocationPageProfile } from "@/domains/locations/types/location-page";
import { buildLocationBreadcrumbs } from "@/domains/locations/seo/location-urls";

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://majetio.cz";

export function buildLocationBreadcrumbJsonLd(profile: LocationPageProfile) {
  const crumbs = buildLocationBreadcrumbs(profile);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href
        ? { item: c.href.startsWith("http") ? c.href : `${SITE}${c.href}` }
        : { item: `${SITE}${profile.location.canonicalPath}` }),
    })),
  };
}

/**
 * Place schema — geographic identity only.
 * Forbidden: aggregateRating, review, offers with fake scores.
 */
export function buildLocationPlaceJsonLd(profile: LocationPageProfile) {
  const place: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: profile.location.publicLabel,
    url: `${SITE}${profile.location.canonicalPath}`,
    description: buildPlaceDescription(profile),
    address: {
      "@type": "PostalAddress",
      addressLocality: profile.location.name,
      addressCountry: "CZ",
    },
  };

  // No coordinates on Place when only approximate — avoid implying exact address
  return place;
}

function buildPlaceDescription(profile: LocationPageProfile): string {
  const asking = profile.summary.find(
    (m) => m.key === "property_market.median_asking_price_sqm",
  );
  if (asking?.formattedValue) {
    return `Tržní profil lokality ${profile.location.publicLabel}. Medián nabídky ${asking.formattedValue}. Období: ${profile.periodLabel}.`;
  }
  return `Tržní profil lokality ${profile.location.publicLabel}. Období: ${profile.periodLabel}.`;
}

export function buildLocationSeoJsonLd(profile: LocationPageProfile) {
  return [buildLocationBreadcrumbJsonLd(profile), buildLocationPlaceJsonLd(profile)];
}
