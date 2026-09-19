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
import { loadSponsoredPropertyCards } from "@/domains/listing-promotions";
import { EmptyState } from "@/components/feedback/states";
import { Container } from "@/components/ui/container";
import { enforcePublicSearchRateLimit } from "@/lib/security/public-search-guard";

type Props = { searchParams: Promise<SearchParamsLike> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const state = parsePropertySearchParams(params);
  const filterCount = countActiveFilters(state);
  const noIndex = shouldNoIndexPropertySearch({
    filterCount,
    page: state.stranka,
    hasNonDefaultSort: Boolean(state.razeni && state.razeni !== "newest"),
  });

  return preparePageMeta({
    title: noIndex ? "Výsledky hledání nemovitostí" : "Nemovitosti",
    description:
      "Procházejte nabídky Majetio s filtry v URL. Modelované metriky a odhady — ne znalecký posudek ani živý tržní index.",
    path: "/nemovitosti",
    noIndex,
  });
}

export default async function NemovitostiPage({ searchParams }: Props) {
  const guard = await enforcePublicSearchRateLimit();
  if (!guard.ok) {
    return (
      <Container className="py-10 sm:py-14">
        <EmptyState
          title="Příliš mnoho požadavků"
          description={`Zkuste to znovu za ${guard.retryAfterSec} s. Limit chrání katalog před scrapingem.`}
        />
      </Container>
    );
  }

  const params = await searchParams;
  const state = parsePropertySearchParams(params);
  const { isAuthenticated, matchProfile, profileComplete, rejectedPropertyIds } =
    await resolveMatchProfile();
  const { cards, sortLabel, relaxedCount, showPassportCta, hasLiveListings, hasDemoListings } =
    await buildDiscoveryCards(
    state,
    matchProfile,
    profileComplete,
    { rejectedPropertyIds },
  );

  // Sponsored slots — separate from organic demo/organic sort (firewall 218)
  const sponsoredCards = await loadSponsoredPropertyCards({
    city: state.lokalita ?? undefined,
    propertyType: state.typ.length ? state.typ : undefined,
    priceMin: state.cenaOd ?? undefined,
    priceMax: state.cenaDo ?? undefined,
    limit: 4,
  });

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
      description="Najděte nemovitost podle svých plánů a rozpočtu."
      breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Nemovitosti" }]}
      state={state}
      cards={cards}
      sortLabel={sortLabel}
      relaxedCount={relaxedCount}
      isAuthenticated={isAuthenticated}
      showPassportCta={showPassportCta}
      sponsoredCards={sponsoredCards}
      hasLiveListings={hasLiveListings}
      hasDemoListings={hasDemoListings}
    />
  );
}
