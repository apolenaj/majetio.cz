/**
 * SEO + structured data for property detail (Prompt 9 Part 5 / Prompt 10 Part 5).
 * No Product schema, no fake AggregateRating.
 * Offer.price = asking price only — NEVER Majetio automated estimate.
 * Titles use real listing facts — no keyword stuffing.
 */

import type { Metadata } from "next";

import type { PublicPropertyDto } from "@/domains/properties/service/dto";
import { buildPageMetadata } from "@/domains/seo/metadata";
import { getSiteOrigin } from "@/domains/seo/site-origin";
import { formatCzk } from "@/lib/format";

/**
 * Indexable only when eligible for the properties sitemap:
 * PUBLIC + ACTIVE + !demo (+ CLEAR moderation / WITHIN_LIMIT when fields present).
 */
export function isPropertyDetailIndexable(
  property: PublicPropertyDto & {
    listingQuotaState?: string | null;
    listingModerationStatus?: string | null;
  },
): boolean {
  if (
    property.visibility !== "PUBLIC" ||
    property.status !== "ACTIVE" ||
    property.isDemo
  ) {
    return false;
  }
  if (
    property.listingQuotaState != null &&
    property.listingQuotaState !== "WITHIN_LIMIT"
  ) {
    return false;
  }
  if (
    property.listingModerationStatus != null &&
    property.listingModerationStatus !== "CLEAR"
  ) {
    return false;
  }
  return true;
}

function propertyTypeLabel(property: PublicPropertyDto): string {
  const raw = (property.propertyType || "").toUpperCase();
  const map: Record<string, string> = {
    APARTMENT: "Byt",
    HOUSE: "Dům",
    LAND: "Pozemek",
    COMMERCIAL: "Komerční nemovitost",
    OTHER: "Nemovitost",
  };
  return map[raw] ?? "Nemovitost";
}

/**
 * Factual title/description from type, location, asking price — no stuffing.
 */
export function buildPropertySeoCopy(property: PublicPropertyDto): {
  title: string;
  description: string;
} {
  const place =
    property.location.district ||
    property.location.city ||
    property.location.label ||
    null;
  const typeLabel = propertyTypeLabel(property);
  const layout = property.layout || null;
  const area = property.usableArea ?? null;

  const titleParts = [
    property.title?.trim() ||
      [typeLabel, layout, place].filter(Boolean).join(" · "),
  ];
  const title = titleParts[0]!.slice(0, 70);

  const facts: string[] = [];
  if (typeLabel) facts.push(typeLabel);
  if (layout) facts.push(layout);
  if (area != null) facts.push(`${Math.round(area)} m²`);
  if (place) facts.push(place);
  if (property.askingPrice != null) {
    facts.push(formatCzk(property.askingPrice));
  }

  const fromDescription = property.description?.replace(/\s+/g, " ").trim();
  const description = (
    fromDescription ||
    `${facts.join(" · ")} — nabídka na Majetio. Modelovaný odhad není součástí této ceny.`
  ).slice(0, 155);

  return { title, description };
}

export function buildPropertyDetailMetadata(
  property: PublicPropertyDto,
): Metadata {
  const path = `/nemovitosti/${property.slug}`;
  const { title, description } = buildPropertySeoCopy(property);
  const indexable = isPropertyDetailIndexable(property);
  const primary = property.media.find((m) => m.url && !m.restricted);

  return buildPageMetadata({
    title,
    description,
    path,
    noIndex: !indexable,
    ogImage: primary?.url
      ? {
          url: primary.url,
          alt:
            primary.alt ||
            `${propertyTypeLabel(property)}${property.location.city ? ` v ${property.location.city}` : ""}`,
          width: 1200,
          height: 630,
        }
      : null,
  });
}

/**
 * RealEstateListing + Offer — never Product, never AggregateRating.
 */
export function buildPropertyDetailJsonLd(property: PublicPropertyDto): object {
  const origin = getSiteOrigin();
  const url = `${origin}/nemovitosti/${property.slug}`;
  const placeName =
    property.location.district ||
    property.location.city ||
    property.location.label ||
    undefined;

  const offer =
    property.askingPrice != null
      ? {
          "@type": "Offer",
          price: property.askingPrice,
          priceCurrency: property.currency || "CZK",
          availability:
            property.status === "ACTIVE"
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          url,
        }
      : undefined;

  const images = property.media
    .filter((m) => m.url && !m.restricted)
    .map((m) => m.url!)
    .slice(0, 8);

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description || undefined,
    url,
    datePosted: property.publishedAt || undefined,
    ...(images.length ? { image: images } : {}),
    ...(offer ? { offers: offer } : {}),
    ...(placeName
      ? {
          contentLocation: {
            "@type": "Place",
            name: placeName,
            address: {
              "@type": "PostalAddress",
              addressLocality: property.location.city || undefined,
              addressRegion: property.location.region || undefined,
              addressCountry: "CZ",
            },
          },
        }
      : {}),
  };
}
