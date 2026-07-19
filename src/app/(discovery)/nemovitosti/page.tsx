import type { Metadata } from "next";

import { InlineAlert } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { PropertySearchFilters } from "@/components/property/search/property-search-filters";
import { PropertySearchResults } from "@/components/property/search/property-search-results";
import type { PropertyCardData } from "@/components/property/property-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { preparePageMeta } from "@/components/content/page-helpers";
import { listDemoPublicProperties } from "@/content/demo-canonical-properties";
import { mapPublicDtoToPropertyCard } from "@/domains/properties/service/card-mapper";
import {
  applyUrlFiltersToListings,
  type SearchableListing,
} from "@/domains/properties/search/apply-filters";
import {
  parsePropertySearchParams,
  RAZENI_OPTIONS,
  type SearchParamsLike,
} from "@/domains/properties/search/url-state";
import {
  computePropertyMatchScore,
  isMatchProfileComplete,
  sortByMatchScore,
} from "@/domains/properties/service/match-score";
import {
  listingToMatchInput,
  passportToMatchProfile,
} from "@/domains/properties/service/match-profile";
import { auth } from "@/lib/auth";
import { loadFinancialPassport } from "@/lib/financial-passport/actions";

export const metadata: Metadata = preparePageMeta({
  title: "Nemovitosti",
  description:
    "Procházejte demonstrační nabídky Majetio s filtry v URL. Nejde o živý trh.",
  path: "/nemovitosti",
});

type Props = { searchParams: Promise<SearchParamsLike> };

function demoListings(): SearchableListing[] {
  return listDemoPublicProperties().map((dto) => {
    const extra: SearchableListing = { ...dto };
    if (dto.slug.includes("vinohrady")) {
      extra.energyRating = "C";
      extra.condition = "GOOD";
      extra.ownershipType = "PERSONAL";
      extra.strategySlugs = ["dlouhodoby-pronajem"];
      extra.freshness = "FRESH";
    } else if (dto.slug.includes("rekonstrukce")) {
      extra.energyRating = "G";
      extra.condition = "NEEDS_RENOVATION";
      extra.ownershipType = "PERSONAL";
      extra.strategySlugs = ["rekonstrukce"];
      extra.landArea = 420;
      extra.freshness = "STALE";
    } else if (dto.slug.includes("brno")) {
      extra.energyRating = "B";
      extra.condition = "EXCELLENT";
      extra.ownershipType = "PERSONAL";
      extra.strategySlugs = ["dlouhodoby-pronajem", "vlastni-bydleni"];
      extra.freshness = "FRESH";
    } else if (dto.slug.includes("nizka")) {
      extra.energyRating = "E";
      extra.condition = "AVERAGE";
      extra.ownershipType = "COOPERATIVE";
      extra.strategySlugs = ["flip"];
      extra.freshness = "STALE";
    }
    return extra;
  });
}

export default async function NemovitostiPage({ searchParams }: Props) {
  const params = await searchParams;
  const state = parsePropertySearchParams(params);
  const all = demoListings();
  let filtered = applyUrlFiltersToListings(all, state);

  const session = await auth();
  const isAuthenticated = Boolean(session?.user?.id);

  let matchProfile = null;
  let profileComplete = false;
  if (isAuthenticated) {
    const passport = await loadFinancialPassport();
    if (passport.ok) {
      matchProfile = passportToMatchProfile(passport.state);
      profileComplete = isMatchProfileComplete(matchProfile);
    }
  }

  const wantsRecommended = state.razeni === "recommended";
  const scoreMap = new Map<
    string,
    ReturnType<typeof computePropertyMatchScore>
  >();

  for (const listing of filtered) {
    const score = computePropertyMatchScore(
      listingToMatchInput(listing),
      matchProfile,
    );
    scoreMap.set(listing.id, score);
  }

  if (wantsRecommended && profileComplete) {
    filtered = sortByMatchScore(filtered, scoreMap);
  }

  const cards: PropertyCardData[] = filtered.map((listing) => {
    const card = mapPublicDtoToPropertyCard(listing);
    const match = scoreMap.get(listing.id);
    if (wantsRecommended && match?.profileComplete) {
      card.matchScore = match.score;
      card.matchReasons = match.reasons.map((r) => ({
        tone: r.tone,
        label: r.label,
      }));
    }
    return card;
  });

  const sortLabel =
    RAZENI_OPTIONS.find((o) => o.sort === (state.razeni ?? "newest"))?.label ??
    "Nejnovější";

  let relaxedCount: number | null = null;
  if (state.cenaDo != null && filtered.length === 0) {
    relaxedCount = applyUrlFiltersToListings(all, {
      ...state,
      cenaDo: Math.round(state.cenaDo * 1.25),
    }).length;
  }

  return (
    <Container className="py-10 sm:py-14 pb-28">
      <PageHeader
        title="Nemovitosti"
        description="Filtry a řazení zůstávají v adrese — po návratu Zpět se hledání i scroll obnoví."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Nemovitosti" }]}
        badge={<Badge tone="premium">Demo data</Badge>}
        actions={
          <ButtonLink href="/analyza" size="sm">
            Analyzovat nemovitost
          </ButtonLink>
        }
      />

      <InlineAlert tone="warning" title="Demonstrační nabídky" className="mb-8">
        Zobrazené nemovitosti slouží k ověření filtrů, karet a UX stavů. Nejsou aktuální
        inzeráty z trhu.
      </InlineAlert>

      <PropertySearchFilters state={state} resultCount={cards.length} />

      <PropertySearchResults
        properties={cards}
        state={state}
        sortLabel={sortLabel}
        relaxedCount={relaxedCount}
        isAuthenticated={isAuthenticated}
        showPassportCta={wantsRecommended && !profileComplete}
      />
    </Container>
  );
}
