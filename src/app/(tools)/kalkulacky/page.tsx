import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import { InlineAlert } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/layout-primitives";
import { MEGA_KALKULACKY } from "@/config/navigation";

export const metadata: Metadata = preparePageMeta({
  title: "Kalkulačky",
  description: "Přehled kalkulaček Majetio. Výpočtová logika se připravuje.",
  path: "/kalkulacky",
});

export default function KalkulackyPage() {
  return (
    <Container className="py-12 sm:py-16">
      <PageHeader
        title="Kalkulačky"
        description="Nástroje pro výnos, cash flow, financování a nabídkovou cenu."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Kalkulačky" }]}
      />
      <InlineAlert tone="info" title="Bez falešných výsledků" className="mb-8">
        Každá kalkulačka má připravenou stránku se strukturou. Engine výpočtů přijde ve
        Fázi 3 s testy.
      </InlineAlert>
      <Grid cols={2}>
        {MEGA_KALKULACKY.filter((c) => c.href !== "/kalkulacky").map((calc) => (
          <Card key={calc.href} variant="interactive" as="article">
            <Link href={calc.href} className="block">
              <h2 className="font-display text-xl">{calc.label}</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Zobrazit strukturu nástroje →
              </p>
            </Link>
          </Card>
        ))}
      </Grid>
    </Container>
  );
}
