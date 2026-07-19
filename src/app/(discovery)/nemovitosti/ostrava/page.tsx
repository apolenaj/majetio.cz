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

const SLUG = "ostrava" as const;

export const metadata: Metadata = (() => {
  const landing = getSeoLanding(SLUG)!;
  return preparePageMeta({
    title: landing.title,
    description: landing.description,
    path: `/nemovitosti/${landing.slug}`,
  });
})();

export default async function OstravaLandingPage() {
  const landing = getSeoLanding(SLUG)!;
  const state: PropertyUrlFilterState = {
    ...EMPTY_PROPERTY_URL_STATE,
    lokalita: landing.lokalita,
  };
  const { isAuthenticated, matchProfile, profileComplete } =
    await resolveMatchProfile();
  const { cards, sortLabel, relaxedCount, showPassportCta } = buildDiscoveryCards(
    state,
    matchProfile,
    profileComplete,
  );

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
    />
  );
}
