import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { preparePageMeta } from "@/components/content/page-helpers";
import { HousingOptionCategoryView } from "@/components/housing-options/housing-option-category-view";
import {
  allHousingOptionStaticParams,
  getHousingOption,
} from "@/content/housing-options";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allHousingOptionStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getHousingOption(slug);
  if (!category) {
    return { title: "Možnost nenalezena" };
  }
  return preparePageMeta({
    title: category.seoTitle,
    description: category.seoDescription,
    path: `/moznosti/${category.slug}`,
  });
}

export default async function MoznostSlugPage({ params }: Props) {
  const { slug } = await params;
  const category = getHousingOption(slug);
  if (!category) notFound();
  return <HousingOptionCategoryView category={category} />;
}
