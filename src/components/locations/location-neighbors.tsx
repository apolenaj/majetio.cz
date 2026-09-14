import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Grid } from "@/components/ui/layout-primitives";
import { formatCzk } from "@/lib/format";
import { locationHref } from "@/domains/locations/seo/location-urls";
import type { LocationNeighborsProps } from "@/components/locations/types";

export function LocationNeighbors({ neighbors, currentSlug }: LocationNeighborsProps) {
  const items = neighbors.filter((n) => n.slug !== currentSlug);
  if (items.length === 0) return null;

  return (
    <Grid cols={3} className="gap-4">
      {items.map((n) => (
        <Card key={n.slug} variant="interactive" as="article" padding="md">
          <Link href={locationHref(n.slug)} className="block">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              {n.relation === "sibling"
                ? "Sousední část"
                : n.relation === "parent"
                  ? "Nadřazená lokalita"
                  : "Blízká lokalita"}
            </p>
            <h3 className="mt-1 font-display text-lg text-[var(--text-primary)]">
              {n.publicLabel}
            </h3>
            {n.medianPriceSqm != null ? (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Medián nabídky: {formatCzk(n.medianPriceSqm).replace(/\s?Kč$/, " Kč/m²")}
              </p>
            ) : null}
          </Link>
        </Card>
      ))}
    </Grid>
  );
}
