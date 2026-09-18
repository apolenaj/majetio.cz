import type { Metadata } from "next";

import {
  DiscoveryListingShell,
  buildDiscoveryCards,
  resolveMatchProfile,
} from "@/components/property/search/discovery-listing";
import { preparePageMeta } from "@/components/content/page-helpers";
import {
  EMPTY_PROPERTY_URL_STATE,
  type PropertyUrlFilterState,
} from "@/domains/properties/search/url-state";
import { getSeoLanding } from "@/domains/properties/search/seo-landings";
import { loadSponsoredPropertyCards } from "@/domains/listing-promotions";

const SLUG = "brno" as const;

export const metadata: Metadata = (() => {
  const landing = getSeoLanding(SLUG)!;
  return preparePageMeta({
    title: landing.title,
    description: landing.description,
    path: `/nemovitosti/${landing.slug}`,
  });
})();

export default async function BrnoLandingPage() {
  const landing = getSeoLanding(SLUG)!;
  const state: PropertyUrlFilterState = {
    ...EMPTY_PROPERTY_URL_STATE,
    lokalita: landing.lokalita,
  };
  const { isAuthenticated, matchProfile, profileComplete, rejectedPropertyIds } =
    await resolveMatchProfile();
  const { cards, sortLabel, relaxedCount, showPassportCta, hasLiveListings, hasDemoListings } = await buildDiscoveryCards(
    state,
    matchProfile,
    profileComplete,
    { rejectedPropertyIds },
  );
  const sponsoredCards = await loadSponsoredPropertyCards({
    city: landing.lokalita,
    limit: 4,
  });

  return (
    <DiscoveryListingShell
      title={landing.h1}
      description={landing.description}
      breadcrumbs={[
        { href: "/", label: "Domů" },
        { href: "/nemovitosti", label: "Nemovitosti" },
        { label: landing.lokalita },
      ]}
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
