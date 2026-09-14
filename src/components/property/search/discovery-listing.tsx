/**
 * Shared listing UI for /nemovitosti and SEO city landings.
 */

import { InlineAlert } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { PropertySearchFilters } from "@/components/property/search/property-search-filters";
import { PropertySearchResults } from "@/components/property/search/property-search-results";
import type { PropertyCardData } from "@/components/property/property-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { listDemoPublicProperties } from "@/content/demo-canonical-properties";
import { isDemoPropertyContentAllowed } from "@/lib/demo-content-gate";
import { mapPublicDtoToPropertyCard } from "@/domains/properties/service/card-mapper";
import {
  applyUrlFiltersToListings,
  type SearchableListing,
} from "@/domains/properties/search/apply-filters";
import {
  RAZENI_OPTIONS,
  type PropertyUrlFilterState,
} from "@/domains/properties/search/url-state";
import {
  computePropertyMatchScore,
  isMatchProfileComplete,
  sortByMatchScore,
  type MatchProfile,
} from "@/domains/properties/service/match-score";
import {
  listingToMatchInput,
  passportToMatchProfile,
} from "@/domains/properties/service/match-profile";
import { auth } from "@/lib/auth";
import { loadFinancialPassport } from "@/lib/financial-passport/actions";
import {
  excludeRejectedFromRecommendations,
  listRejectedPropertyIdsForUser,
} from "@/domains/favourites/service/recommendation-exclusion";
import { SPONSORED_FIREWALL_DISCLAIMER_CS } from "@/components/property/sponsored-listing-badge";

export function demoListings(): SearchableListing[] {
  if (!isDemoPropertyContentAllowed()) {
    return [];
  }
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

export async function resolveMatchProfile(): Promise<{
  isAuthenticated: boolean;
  matchProfile: MatchProfile | null;
  profileComplete: boolean;
  rejectedPropertyIds: ReadonlySet<string>;
}> {
  const emptyRejected = new Set<string>();
  const session = await auth();
  const isAuthenticated = Boolean(session?.user?.id);
  if (!isAuthenticated || !session?.user?.id) {
    return {
      isAuthenticated: false,
      matchProfile: null,
      profileComplete: false,
      rejectedPropertyIds: emptyRejected,
    };
  }
  const [passport, rejectedPropertyIds] = await Promise.all([
    loadFinancialPassport(),
    listRejectedPropertyIdsForUser(session.user.id),
  ]);
  if (!passport.ok) {
    return {
      isAuthenticated: true,
      matchProfile: null,
      profileComplete: false,
      rejectedPropertyIds,
    };
  }
  const matchProfile = passportToMatchProfile(passport.state);
  return {
    isAuthenticated: true,
    matchProfile,
    profileComplete: isMatchProfileComplete(matchProfile),
    rejectedPropertyIds,
  };
}

export function buildDiscoveryCards(
  state: PropertyUrlFilterState,
  matchProfile: MatchProfile | null,
  profileComplete: boolean,
  options?: { rejectedPropertyIds?: ReadonlySet<string> },
): {
  cards: PropertyCardData[];
  sortLabel: string;
  relaxedCount: number | null;
  showPassportCta: boolean;
} {
  const all = demoListings();
  let filtered = applyUrlFiltersToListings(all, state);
  const wantsRecommended = state.razeni === "recommended";

  // BOD 85–89: never re-recommend explicitly rejected favourites
  if (options?.rejectedPropertyIds?.size) {
    filtered = excludeRejectedFromRecommendations(
      filtered,
      options.rejectedPropertyIds,
    );
  }

  const scoreMap = new Map<
    string,
    ReturnType<typeof computePropertyMatchScore>
  >();

  for (const listing of filtered) {
    scoreMap.set(
      listing.id,
      computePropertyMatchScore(listingToMatchInput(listing), matchProfile),
    );
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

  return {
    cards,
    sortLabel,
    relaxedCount,
    showPassportCta: wantsRecommended && !profileComplete,
  };
}

export function DiscoveryListingShell({
  title,
  description,
  breadcrumbs,
  state,
  cards,
  sortLabel,
  relaxedCount,
  isAuthenticated,
  showPassportCta,
  sponsoredCards = [],
}: {
  title: string;
  description: string;
  breadcrumbs: { href?: string; label: string }[];
  state: PropertyUrlFilterState;
  cards: PropertyCardData[];
  sortLabel: string;
  relaxedCount: number | null;
  isAuthenticated: boolean;
  showPassportCta: boolean;
  /** Paid slots — rendered separately; never merged into organic sort. */
  sponsoredCards?: PropertyCardData[];
}) {
  return (
    <Container className="overflow-x-hidden py-10 sm:py-14 pb-28">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        badge={<Badge tone="premium">Demo data</Badge>}
        actions={
          <ButtonLink href="/analyza" size="sm">
            Analyzovat nemovitost
          </ButtonLink>
        }
      />

      <InlineAlert tone="warning" title="Demonstrační nabídky" className="mb-8">
        Zobrazené nemovitosti slouží k ověření filtrů, karet a UX stavů. Nejsou aktuální
        inzeráty z trhu. Sponzorované umístění (pokud je) neovlivňuje Majetio Score ani
        organické řazení.
      </InlineAlert>

      <PropertySearchFilters state={state} resultCount={cards.length} />

      {sponsoredCards.length > 0 ? (
        <section
          aria-labelledby="sponsored-heading"
          className="mb-10 space-y-4"
          data-testid="sponsored-placements"
        >
          <div>
            <h2
              id="sponsored-heading"
              className="font-display text-xl text-[var(--text-primary)]"
            >
              Sponzorované nabídky
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {SPONSORED_FIREWALL_DISCLAIMER_CS}
            </p>
          </div>
          <PropertySearchResults
            properties={sponsoredCards}
            state={state}
            sortLabel="Sponzorováno"
            relaxedCount={null}
            isAuthenticated={isAuthenticated}
            showPassportCta={false}
          />
        </section>
      ) : null}

      <PropertySearchResults
        properties={cards}
        state={state}
        sortLabel={sortLabel}
        relaxedCount={relaxedCount}
        isAuthenticated={isAuthenticated}
        showPassportCta={showPassportCta}
      />
    </Container>
  );
}
