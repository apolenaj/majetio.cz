import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { loadFinancialPassport } from "@/lib/financial-passport/actions";
import { getCachedMortgageOffers } from "@/domains/financing/service/mortgage-rates";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-layouts";
import { FinancingCalculatorClient } from "./financing-calculator-client";

export const metadata: Metadata = {
  title: "Kalkulačka financování",
  description:
    "Spočítejte orientační strukturu financování nemovitosti — LTV, splátku, celkové náklady a porovnejte různé scénáře (hotovost, 60 % LTV, 80 % LTV).",
  robots: { index: true, follow: true },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cena?: string }>;
}) {
  const params = await searchParams;
  const parsedPrice = Number(params.cena);
  const askingPriceCzk = Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : null;
  const [session, { offers, freshness }] = await Promise.all([
    auth(),
    getCachedMortgageOffers(),
  ]);

  const isAuthenticated = Boolean(session?.user?.id);

  let passportState = null;
  if (isAuthenticated) {
    const passportResult = await loadFinancialPassport();
    if (passportResult.ok) {
      passportState = passportResult.state;
    }
  }

  return (
    <Container width="dashboard" className="py-10">
      <PageHeader
        title="Kalkulačka financování"
        description="Orientační výpočet struktury financování nemovitosti. Zadejte kupní cenu a vlastní kapitál — kalkulačka ukáže LTV, měsíční splátku, celkové náklady a porovná scénáře s různou pákou."
        breadcrumbs={[
          { href: "/kalkulacky", label: "Kalkulačky" },
          { label: "Financování" },
        ]}
        badge={
          <span className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--border-default)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
            Modelový scénář
          </span>
        }
      />
      <FinancingCalculatorClient
        offers={offers}
        freshness={freshness}
        isAuthenticated={isAuthenticated}
        passportState={passportState}
        callbackUrl="/kalkulacky/financovani"
        handoffSource="kalkulacky/financovani"
        askingPriceCzk={askingPriceCzk}
      />
    </Container>
  );
}
