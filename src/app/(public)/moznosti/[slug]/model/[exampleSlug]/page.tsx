import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { preparePageMeta } from "@/components/content/page-helpers";
import { HousingOptionExampleDetailView } from "@/components/housing-options/housing-option-example-detail";
import {
  allHousingOptionExampleStaticParams,
  getHousingOptionExample,
} from "@/content/housing-options";

type Props = { params: Promise<{ slug: string; exampleSlug: string }> };

export function generateStaticParams() {
  return allHousingOptionExampleStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, exampleSlug } = await params;
  const match = getHousingOptionExample(slug, exampleSlug);
  if (!match) {
    return { title: "Model nenalezen" };
  }
  return preparePageMeta({
    title: `${match.example.title} · ${match.category.title}`,
    description: match.example.description,
    path: `/moznosti/${slug}/model/${exampleSlug}`,
  });
}

export default async function HousingOptionExamplePage({ params }: Props) {
  const { slug, exampleSlug } = await params;
  const match = getHousingOptionExample(slug, exampleSlug);
  if (!match) notFound();
  return (
    <HousingOptionExampleDetailView
      category={match.category}
      example={match.example}
    />
  );
}
