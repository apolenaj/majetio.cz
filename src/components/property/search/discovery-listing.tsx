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
import { listDiscoveryPropertyRecords } from "@/domains/properties/service/prisma-property-repository";
import { toPublicPropertyListItemDto } from "@/domains/properties/service/dto";

export async function loadDiscoveryListings(): Promise<SearchableListing[]> {
  const records = await listDiscoveryPropertyRecords(250);
  return records.map((record) => {
    const dto = toPublicPropertyListItemDto(record);
    const extra: SearchableListing = {
      ...dto,
      energyRating: record.energyRating,
      condition: record.condition,
      ownershipType: record.ownershipType,
      freshness: record.freshness,
      status: record.status,
      description: record.description,
      publishedAt:
        typeof record.publishedAt === "string"
          ? record.publishedAt
          : record.publishedAt?.toISOString() ?? null,
      completenessScore: record.completenessScore,
    };
    return extra;
  });
}

/** @deprecated Prefer loadDiscoveryListings — kept for sync tests. */
export function demoListings(): SearchableListing[] {
  return [];
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

export async function buildDiscoveryCards(
  state: PropertyUrlFilterState,
  matchProfile: MatchProfile | null,
  profileComplete: boolean,
  options?: { rejectedPropertyIds?: ReadonlySet<string> },
): Promise<{
  cards: PropertyCardData[];
  sortLabel: string;
  relaxedCount: number | null;
  showPassportCta: boolean;
  hasLiveListings: boolean;
  hasDemoListings: boolean;
}> {
  const all = await loadDiscoveryListings();
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
    hasLiveListings: all.some((l) => !l.isDemo),
    hasDemoListings: all.some((l) => l.isDemo),
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
  hasLiveListings = false,
  hasDemoListings = false,
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
  hasLiveListings?: boolean;
  hasDemoListings?: boolean;
}) {
  return (
    <Container className="overflow-x-hidden py-10 sm:py-14 pb-28">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        badge={
          hasLiveListings ? (
            <Badge tone="success">Živé nabídky</Badge>
          ) : hasDemoListings ? (
            <Badge tone="premium">Modelové ukázky</Badge>
          ) : undefined
        }
        actions={
          <ButtonLink href="/pridat-nemovitost" size="sm">
            Přidat nemovitost
          </ButtonLink>
        }
      />

      {hasDemoListings && !hasLiveListings ? (
        <InlineAlert tone="warning" title="Modelové ukázky" className="mb-8">
          Zatím nejsou publikované reálné inzeráty. Zobrazené položky jsou modelové studie
          pro ověření filtrů — nejsou aktuální nabídky z trhu.
        </InlineAlert>
      ) : hasDemoListings ? (
        <InlineAlert tone="info" title="Oddělení modelových ukázek" className="mb-8">
          Katalog obsahuje publikované nabídky. Položky označené jako demo nejsou reálné
          inzeráty.
        </InlineAlert>
      ) : null}

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
