import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { preparePageMeta } from "@/components/content/page-helpers";
import { ForeignListingDetail } from "@/components/foreign-properties/foreign-properties-views";
import {
  FOREIGN_LISTINGS,
  getForeignCountry,
  getForeignListing,
} from "@/content/foreign-properties";
import { getSiteOrigin } from "@/domains/seo/site-origin";

type Props = {
  params: Promise<{ country: string; slug: string }>;
};

export function generateStaticParams() {
  return FOREIGN_LISTINGS.map((l) => ({
    country: l.countrySlug,
    slug: l.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, slug } = await params;
  const listing = getForeignListing(country, slug);
  const countryMeta = getForeignCountry(country);
  if (!listing || !countryMeta) return { title: "Nabídka nenalezena" };
  return preparePageMeta({
    title: `${listing.title} | ${countryMeta.name}`,
    description: listing.description,
    path: `/zahranicni-nemovitosti/${country}/${slug}`,
  });
}

export default async function ZahranicniListingPage({ params }: Props) {
  const { country, slug } = await params;
  const listing = getForeignListing(country, slug);
  if (!listing) notFound();
  const propertyUrl = `${getSiteOrigin()}/zahranicni-nemovitosti/${country}/${slug}`;
  return <ForeignListingDetail listing={listing} propertyUrl={propertyUrl} />;
}
