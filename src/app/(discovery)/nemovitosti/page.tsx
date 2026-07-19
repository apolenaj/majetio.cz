import type { Metadata } from "next";

import { DiscoveryListingShell, buildDiscoveryCards, resolveMatchProfile } from "@/components/property/search/discovery-listing";
import { preparePageMeta } from "@/components/content/page-helpers";
import {
  countActiveFilters,
  parsePropertySearchParams,
  type SearchParamsLike,
} from "@/domains/properties/search/url-state";
import { shouldNoIndexPropertySearch } from "@/domains/properties/search/seo-landings";
import { track } from "@/lib/analytics/events";

type Props = { searchParams: Promise<SearchParamsLike> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const state = parsePropertySearchParams(params);
  const filterCount = countActiveFilters(state);
  const noIndex = shouldNoIndexPropertySearch({
    filterCount,
    page: state.stranka,
  });

  return preparePageMeta({
    title: noIndex ? "Výsledky hledání nemovitostí" : "Nemovitosti",
    description:
      "Procházejte demonstrační nabídky Majetio s filtry v URL. Nejde o živý trh.",
    path: "/nemovitosti",
    noIndex,
  });
}

export default async function NemovitostiPage({ searchParams }: Props) {
  const params = await searchParams;
  const state = parsePropertySearchParams(params);
  const { isAuthenticated, matchProfile, profileComplete } =
    await resolveMatchProfile();
  const { cards, sortLabel, relaxedCount, showPassportCta } = buildDiscoveryCards(
    state,
    matchProfile,
    profileComplete,
  );

  if (state.razeni === "recommended") {
    track({
      name: "recommendation_sort_viewed",
      props: {
        profile_complete: profileComplete,
        result_count_bucket:
          cards.length === 0
            ? "0"
            : cards.length <= 5
              ? "1-5"
              : cards.length <= 20
                ? "6-20"
                : "21+",
      },
    });
  }

  return (
    <DiscoveryListingShell
      title="Nemovitosti"
      description="Filtry a řazení zůstávají v adrese — po návratu Zpět se hledání i scroll obnoví."
      breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Nemovitosti" }]}
      state={state}
      cards={cards}
      sortLabel={sortLabel}
      relaxedCount={relaxedCount}
      isAuthenticated={isAuthenticated}
      showPassportCta={showPassportCta}
    />
  );
}
