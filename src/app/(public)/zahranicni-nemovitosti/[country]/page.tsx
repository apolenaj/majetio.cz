import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { preparePageMeta } from "@/components/content/page-helpers";
import { ForeignCountryPage } from "@/components/foreign-properties/foreign-properties-views";
import {
  FOREIGN_COUNTRIES,
  getForeignCountry,
} from "@/content/foreign-properties";

type Props = { params: Promise<{ country: string }> };

export function generateStaticParams() {
  return FOREIGN_COUNTRIES.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: slug } = await params;
  const country = getForeignCountry(slug);
  if (!country) return { title: "Země nenalezena" };
  return preparePageMeta({
    title: `Nemovitosti — ${country.name}`,
    description: country.heroNote,
    path: `/zahranicni-nemovitosti/${country.slug}`,
  });
}

export default async function ZahranicniCountryPage({ params }: Props) {
  const { country: slug } = await params;
  if (!getForeignCountry(slug)) notFound();
  return <ForeignCountryPage countrySlug={slug} />;
}
