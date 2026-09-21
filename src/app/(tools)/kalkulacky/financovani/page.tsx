import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { loadFinancialPassport } from "@/lib/financial-passport/actions";
import { getCachedMortgageOffers } from "@/domains/financing/service/mortgage-rates";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-layouts";
import { FinancingTool } from "@/components/tools";
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
    <>
      <FinancingTool />
      <Container width="dashboard" className="pb-16">
        <details className="rounded-[10px] border border-[#dde5e7] bg-white p-4">
          <summary className="cursor-pointer font-medium text-[#0b3550]">
            Srovnání nabídek bank a LTV scénáře
          </summary>
          <div className="mt-6">
            <PageHeader
              title="Detail financování"
              description="Katalog nabídek a scénáře hotovost / 60 % / 80 % LTV. Splátka vychází ze stejné anuitní metodiky investičního enginu."
              breadcrumbs={[
                { href: "/kalkulacky", label: "Kalkulačky" },
                { label: "Financování" },
              ]}
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
          </div>
        </details>
      </Container>
    </>
  );
}
