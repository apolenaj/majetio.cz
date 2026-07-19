import type { Metadata } from "next";

import { InlineAlert } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { PropertyCard } from "@/components/property/property-card";
import { PropertySearchFilters } from "@/components/property/search/property-search-filters";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/layout-primitives";
import { preparePageMeta } from "@/components/content/page-helpers";
import { listDemoPublicProperties } from "@/content/demo-canonical-properties";
import { mapPublicDtoToPropertyCard } from "@/domains/properties/service/card-mapper";
import {
  applyUrlFiltersToListings,
  type SearchableListing,
} from "@/domains/properties/search/apply-filters";
import {
  parsePropertySearchParams,
  type SearchParamsLike,
} from "@/domains/properties/search/url-state";
import { RAZENI_OPTIONS } from "@/domains/properties/search/url-state";

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
    } else if (dto.slug.includes("rekonstrukce")) {
      extra.energyRating = "G";
      extra.condition = "NEEDS_RENOVATION";
      extra.ownershipType = "PERSONAL";
      extra.strategySlugs = ["rekonstrukce"];
      extra.landArea = 420;
    } else if (dto.slug.includes("brno")) {
      extra.energyRating = "B";
      extra.condition = "EXCELLENT";
      extra.ownershipType = "PERSONAL";
      extra.strategySlugs = ["dlouhodoby-pronajem", "vlastni-bydleni"];
    } else if (dto.slug.includes("nizka")) {
      extra.energyRating = "E";
      extra.condition = "AVERAGE";
      extra.ownershipType = "COOPERATIVE";
      extra.strategySlugs = ["flip"];
    }
    return extra;
  });
}

export default async function NemovitostiPage({ searchParams }: Props) {
  const params = await searchParams;
  const state = parsePropertySearchParams(params);
  const filtered = applyUrlFiltersToListings(demoListings(), state);
  const cards = filtered.map(mapPublicDtoToPropertyCard);
  const sortLabel =
    RAZENI_OPTIONS.find((o) => o.sort === (state.razeni ?? "newest"))?.label ??
    "Nejnovější";

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        title="Nemovitosti"
        description="Filtry a řazení zůstávají v adrese — po refreshi se stav neztratí."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Nemovitosti" }]}
        badge={<Badge tone="premium">Demo data</Badge>}
        actions={
          <ButtonLink href="/analyza" size="sm">
            Analyzovat nemovitost
          </ButtonLink>
        }
      />

      <InlineAlert tone="warning" title="Demonstrační nabídky" className="mb-8">
        Zobrazené nemovitosti slouží k ověření filtrů a URL stavu. Nejsou aktuální
        inzeráty z trhu.
      </InlineAlert>

      <PropertySearchFilters state={state} resultCount={cards.length} />

      <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
        <p>
          Nalezeno:{" "}
          <strong className="font-metric text-[var(--text-primary)]">{cards.length}</strong>{" "}
          (demo)
        </p>
        <p>Řazení: {sortLabel}</p>
      </div>

      {cards.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--border-default)] p-8 text-center text-sm text-[var(--text-secondary)]">
          Žádné nemovitosti neodpovídají filtrům. Upravte kritéria nebo{" "}
          <ButtonLink href="/nemovitosti" variant="link" className="inline">
            vymažte filtry
          </ButtonLink>
          .
        </p>
      ) : (
        <Grid cols={3}>
          {cards.map((property) => (
            <PropertyCard key={property.href} property={property} />
          ))}
        </Grid>
      )}
    </Container>
  );
}
