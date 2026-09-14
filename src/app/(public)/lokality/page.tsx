import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import { PageHeader } from "@/components/layout/page-layouts";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/layout-primitives";
import {
  INDEXABLE_LOCATION_SLUGS,
  LOCATION_DEMO_PROFILES,
} from "@/domains/locations/content/demo-profiles";

export const metadata = preparePageMeta({
  title: "Lokality",
  description:
    "Tržní profily lokalit — ceny, nájmy, likvidita, investice a rizika. Data s uvedeným obdobím a metodikou.",
  path: "/lokality",
});

export default function LokalityPage() {
  // Demo catalog for product UX — all marked isDemo; SEO noindex via isLocationPageIndexable
  const locations = INDEXABLE_LOCATION_SLUGS.map(
    (slug) => LOCATION_DEMO_PROFILES[slug]!,
  );

  return (
    <Container className="py-12 sm:py-16">
      <PageHeader
        title="Lokality"
        description="Tržní profily lokalit (demo data) — ceny, nájmy, likvidita. Každý profil uvádí období, metodiku a zda jde o demonstraci."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Lokality" }]}
        actions={
          <ButtonLink href="/lokality/porovnani" variant="secondary" size="sm">
            Porovnat lokality
          </ButtonLink>
        }
      />

      <Grid cols={2} className="mt-8 gap-4">
        {locations.map((profile) => {
          const asking = profile.summary.find(
            (m) => m.key === "property_market.median_asking_price_sqm",
          );
          return (
            <Card key={profile.location.slug} variant="interactive" as="article" padding="md">
              <Link href={profile.location.canonicalPath} className="block">
                <p className="text-xs text-[var(--text-muted)]">
                  {profile.location.hierarchyLabel}
                  {profile.isDemo ? " · Demo data" : null}
                </p>
                <h2 className="mt-1 font-display text-xl text-[var(--text-primary)]">
                  {profile.location.publicLabel}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">
                  {profile.heroSummary}
                </p>
                {asking ? (
                  <p className="mt-3 font-metric text-sm text-[var(--text-primary)]">
                    Medián nabídky: {asking.formattedValue}
                    <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">
                      · {profile.periodLabel}
                      {asking.confidence != null
                        ? ` · conf. ${(asking.confidence * 100).toFixed(0)} %`
                        : null}
                    </span>
                  </p>
                ) : null}
              </Link>
            </Card>
          );
        })}
      </Grid>

      <p className="mt-8 text-sm text-[var(--text-muted)]">
        <Link href="/metodika#lokality" className="text-[var(--text-link)] hover:underline">
          Metodika lokality
        </Link>
        {" · "}
        Demo profily nejsou indexovány vyhledávači (noindex).
      </p>
    </Container>
  );
}
