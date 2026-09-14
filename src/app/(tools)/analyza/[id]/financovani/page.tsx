import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { loadFinancialPassport } from "@/lib/financial-passport/actions";
import { getCachedMortgageOffers } from "@/domains/financing/service/mortgage-rates";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-layouts";
import { AnalysisFinancingClient } from "./analysis-financing-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Analýza · Financování",
    description:
      "Financování konkrétní nemovitosti — LTV, splátka, porovnání scénářů a dopad na cash flow a IRR.",
    robots: { index: false, follow: false },
    alternates: { canonical: `/analyza/${id}/financovani` },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;

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
        title="Financování"
        description="Orientační modelový scénář financování. Změna scénáře (výše kapitálu, sazba) se promítne do investiční analýzy."
        breadcrumbs={[
          { href: "/analyza", label: "Analýza" },
          { href: `/analyza/${id}`, label: id },
          { label: "Financování" },
        ]}
        badge={
          <span className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--border-default)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
            Modelový scénář
          </span>
        }
      />
      <AnalysisFinancingClient
        analysisId={id}
        offers={offers}
        freshness={freshness}
        isAuthenticated={isAuthenticated}
        passportState={passportState}
        callbackUrl={`/analyza/${id}/financovani`}
        handoffSource={`analyza/${id}/financovani`}
      />
    </Container>
  );
}
