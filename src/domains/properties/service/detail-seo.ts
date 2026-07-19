/**
 * SEO + structured data for property detail (Prompt 9 Part 5).
 * No Product schema, no fake AggregateRating.
 */

import type { Metadata } from "next";
import type { PublicPropertyDto } from "@/domains/properties/service/dto";

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://majetio.cz";

/**
 * Indexable only for real public ACTIVE listings (not demo, not private).
 */
export function isPropertyDetailIndexable(property: PublicPropertyDto): boolean {
  return (
    property.visibility === "PUBLIC" &&
    property.status === "ACTIVE" &&
    !property.isDemo
  );
}

export function buildPropertyDetailMetadata(
  property: PublicPropertyDto,
): Metadata {
  const path = `/nemovitosti/${property.slug}`;
  const place =
    property.location.label ??
    property.location.city ??
    "Nemovitost";
  const title = property.title;
  const description =
    property.description?.slice(0, 155) ||
    `${place} — detail nabídky na Majetio. Transparentní ekonomika bez falešných ratingů.`;

  const indexable = isPropertyDetailIndexable(property);

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      type: "website",
      title: `${title} · Majetio`,
      description,
      url: path,
      images: property.media.find((m) => m.url && !m.restricted)?.url
        ? [
            {
              url: property.media.find((m) => m.url && !m.restricted)!.url!,
              alt: property.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Majetio`,
      description,
    },
  };
}

/**
 * RealEstateListing + Offer — never Product, never AggregateRating.
 */
export function buildPropertyDetailJsonLd(property: PublicPropertyDto): object {
  const url = `${SITE}/nemovitosti/${property.slug}`;
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

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description || undefined,
    url,
    datePosted: property.publishedAt || undefined,
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
