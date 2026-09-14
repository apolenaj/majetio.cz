"use client";

import Link from "next/link";

import { trackLocation } from "@/domains/locations/analytics/events";
import { getGuideBySlug } from "@/content/guides";
import { getStrategyBySlug } from "@/content/strategies";
import { ButtonLink } from "@/components/ui/button-link";
import {
  buildPropertySearchHref,
  EMPTY_PROPERTY_URL_STATE,
} from "@/domains/properties/search/url-state";
import { locationHref } from "@/domains/locations/seo/location-urls";

type Props = {
  locationSlug: string;
  searchLokalita: string;
  strategySlugs: string[];
  guideSlugs?: string[];
  compareWithSlug?: string;
};

export function LocationInternalLinks({
  locationSlug,
  searchLokalita,
  strategySlugs,
  guideSlugs = [],
  compareWithSlug = "brno",
}: Props) {
  const propertyHref = buildPropertySearchHref({
    ...EMPTY_PROPERTY_URL_STATE,
    lokalita: searchLokalita,
  });
  const compareHref = `/lokality/porovnani?l=${encodeURIComponent(locationSlug)}&l=${encodeURIComponent(compareWithSlug)}`;

  function trackTarget(
    target: "properties" | "strategy" | "guide" | "mortgage" | "comparison",
  ) {
    trackLocation({
      name: "location_internal_link_clicked",
      props: { location_slug: locationSlug, target },
    });
  }

  return (
    <nav
      aria-label="Související odkazy"
      className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] p-5"
    >
      <h2 className="font-display text-lg text-[var(--text-primary)]">
        Kam dál z této lokality
      </h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Nemovitosti, strategie, průvodce a financování — odkazy z reálných dat profilu.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        <li onClick={() => trackTarget("properties")}>
          <ButtonLink href={propertyHref} className="w-full justify-center">
            Nemovitosti v lokalitě
          </ButtonLink>
        </li>
        <li onClick={() => trackTarget("mortgage")}>
          <ButtonLink
            href="/kalkulacky/financovani"
            variant="secondary"
            className="w-full justify-center"
          >
            Hypotéka / financování
          </ButtonLink>
        </li>
        <li onClick={() => trackTarget("comparison")}>
          <ButtonLink
            href={compareHref}
            variant="secondary"
            className="w-full justify-center"
          >
            Porovnat s jinou lokalitou
          </ButtonLink>
        </li>
      </ul>

      {strategySlugs.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Strategie
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {strategySlugs.map((slug) => {
              const s = getStrategyBySlug(slug);
              return (
                <li key={slug}>
                  <Link
                    href={`/strategie/${slug}`}
                    className="text-sm text-[var(--text-link)] hover:underline"
                    onClick={() => trackTarget("strategy")}
                  >
                    {s?.title ?? slug}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {guideSlugs.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Průvodce
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {guideSlugs.map((slug) => {
              const g = getGuideBySlug(slug);
              return (
                <li key={slug}>
                  <Link
                    href={`/pruvodce/${slug}`}
                    className="text-sm text-[var(--text-link)] hover:underline"
                    onClick={() => trackTarget("guide")}
                  >
                    {g?.title ?? slug}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/pruvodce"
                className="text-sm text-[var(--text-link)] hover:underline"
              >
                Všechny průvodce
              </Link>
            </li>
          </ul>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        Katalog:{" "}
        <Link href="/lokality" className="text-[var(--text-link)] hover:underline">
          Lokality
        </Link>
        {" · "}
        <Link href={locationHref("praha")} className="text-[var(--text-link)] hover:underline">
          Praha
        </Link>
      </p>
    </nav>
  );
}
