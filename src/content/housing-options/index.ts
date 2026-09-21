import { HOUSING_OPTION_CATEGORIES } from "./catalog";
import type {
  HousingOptionCategory,
  HousingOptionExample,
  HousingOptionSlug,
} from "./types";

export type {
  HousingMetric,
  HousingOptionCategory,
  HousingOptionExample,
  HousingOptionSlug,
  SwapSide,
} from "./types";

export { HOUSING_OPTION_CATEGORIES } from "./catalog";

const BY_SLUG = new Map(
  HOUSING_OPTION_CATEGORIES.map((c) => [c.slug, c] as const),
);

export function getHousingOption(slug: string): HousingOptionCategory | undefined {
  return BY_SLUG.get(slug as HousingOptionSlug);
}

export function getHousingOptionExample(
  categorySlug: string,
  exampleSlug: string,
): { category: HousingOptionCategory; example: HousingOptionExample } | undefined {
  const category = getHousingOption(categorySlug);
  if (!category) return undefined;
  const example = category.examples.find((e) => e.slug === exampleSlug);
  if (!example) return undefined;
  return { category, example };
}

export function allHousingOptionSlugs(): HousingOptionSlug[] {
  return HOUSING_OPTION_CATEGORIES.map((c) => c.slug);
}

export function allHousingOptionStaticParams(): { slug: string }[] {
  return allHousingOptionSlugs().map((slug) => ({ slug }));
}

export function allHousingOptionExampleStaticParams(): {
  slug: string;
  exampleSlug: string;
}[] {
  return HOUSING_OPTION_CATEGORIES.flatMap((c) =>
    c.examples.map((e) => ({ slug: c.slug, exampleSlug: e.slug })),
  );
}

export function exampleDetailHref(categorySlug: string, exampleSlug: string): string {
  return `/moznosti/${categorySlug}/model/${exampleSlug}`;
}
