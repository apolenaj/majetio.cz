import Link from "next/link";

import { PropertyCard, type PropertyCardData } from "@/components/property/property-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Grid } from "@/components/ui/layout-primitives";
import {
  buildPropertySearchHref,
  EMPTY_PROPERTY_URL_STATE,
} from "@/domains/properties/search/url-state";
import type { LocationAvailablePropertiesProps } from "@/components/locations/types";

const CTA_FILTERS: { label: string; patch: Partial<import("@/domains/properties/search/url-state").PropertyUrlFilterState> }[] = [
  { label: "Byty v lokalitě", patch: { typ: ["byt"] } },
  { label: "2+kk", patch: { typ: ["byt"], dispozice: ["2+kk"] } },
  { label: "Do 8 mil. Kč", patch: { cenaDo: 8_000_000 } },
  { label: "Dlouhodobý pronájem", patch: { strategie: ["dlouhodoby-pronajem"] } },
];

export function LocationAvailableProperties({
  searchLokalita,
  cards,
  totalCount,
}: LocationAvailablePropertiesProps) {
  const baseState = {
    ...EMPTY_PROPERTY_URL_STATE,
    lokalita: searchLokalita,
    razeni: "newest" as const,
  };

  const allHref = buildPropertySearchHref(baseState);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {CTA_FILTERS.map((cta) => (
          <ButtonLink
            key={cta.label}
            href={buildPropertySearchHref({ ...baseState, ...cta.patch })}
            variant="secondary"
            size="sm"
          >
            {cta.label}
          </ButtonLink>
        ))}
        <ButtonLink href={allHref} size="sm">
          Všechny nemovitosti ({totalCount})
        </ButtonLink>
      </div>

      {cards.length > 0 ? (
        <Grid cols={3} className="gap-4">
          {cards.slice(0, 6).map((property) => (
            <PropertyCard key={property.id ?? property.href} property={property} />
          ))}
        </Grid>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">
          V demo datech zatím nejsou nemovitosti pro tuto lokalitu.{" "}
          <Link href={allHref} className="text-[var(--text-link)] hover:underline">
            Prohlédnout celý katalog
          </Link>
        </p>
      )}

      <p className="text-xs text-[var(--text-muted)]">
        Používáme stejný vyhledávač jako{" "}
        <Link href="/nemovitosti" className="text-[var(--text-link)] hover:underline">
          /nemovitosti
        </Link>
        . Filtry se předávají přes URL parametry.
      </p>
    </div>
  );
}
