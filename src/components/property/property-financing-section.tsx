"use client";

import { HypotekaJasneHandoffCard } from "@/components/privacy/data-sharing-preview";
import { InlineAlert } from "@/components/feedback/states";
import { MetricCard } from "@/components/data-display/metric-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { HandoffPreviewData } from "@/lib/financing/handoff-actions";
import { formatCzk, formatPercentPoints } from "@/lib/format";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { track } from "@/lib/analytics/events";

const NEU = "Nutno ověřit";

export type FinancingPreviewUi = {
  estimatedMonthlyPaymentCzk: number;
  estimatedRatePct: number;
  loanAmountCzk: number;
  disclaimer: string;
  isMock: boolean;
};

/**
 * Orientační financování + DataSharingPreview gate before HypotekaJasne lead.
 */
export function PropertyFinancingSection({
  askingPrice,
  equityUsedCzk,
  equitySource,
  preview,
  handoffPreview,
  isAuthenticated,
  returnPath,
}: {
  askingPrice: number | null;
  equityUsedCzk: number | null;
  equitySource: "passport" | "demo" | "none";
  preview: FinancingPreviewUi | null;
  handoffPreview: HandoffPreviewData | null;
  isAuthenticated: boolean;
  returnPath: string;
}) {
  return (
    <section aria-labelledby="financing-heading" className="space-y-4">
      <div>
        <h2
          id="financing-heading"
          className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
        >
          Orientační financování
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
          Majetio neposkytuje úvěr. Orientační splátku počítá mock HypotekaJasne
          podle rozpočtu z Finančního pasu (nebo demo kapitálu). Před předáním
          leadu vždy uvidíte DataSharingPreview.
        </p>
      </div>

      <Card padding="lg">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle as="h3">Odhad splátky</CardTitle>
            {preview?.isMock ? <Badge tone="neutral">Mock API</Badge> : null}
            {equitySource === "passport" ? (
              <Badge tone="success">Z Finančního pasu</Badge>
            ) : equitySource === "demo" ? (
              <Badge tone="premium">Demo kapitál</Badge>
            ) : null}
          </div>
          <CardDescription>
            Vstupy: nabídková cena
            {askingPrice != null ? ` ${formatCzk(askingPrice)}` : ` ${NEU}`}
            {" · "}
            vlastní zdroje{" "}
            {equityUsedCzk != null ? formatCzk(equityUsedCzk) : NEU}
          </CardDescription>
        </CardHeader>

        {!preview || askingPrice == null ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Orientační splátka: <strong>{NEU}</strong>
            {askingPrice == null
              ? " — chybí nabídková cena."
              : " — nelze spočítat bez ceny a kapitálu."}
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                title="Odhad splátky / měs."
                value={formatCzk(preview.estimatedMonthlyPaymentCzk)}
                source="HypotekaJasne mock"
              />
              <MetricCard
                title="Orientační sazba"
                value={formatPercentPoints(preview.estimatedRatePct)}
                source="HypotekaJasne mock"
              />
              <MetricCard
                title="Výše úvěru"
                value={formatCzk(preview.loanAmountCzk)}
                explanation={
                  equityUsedCzk != null
                    ? `Vlastní zdroje: ${formatCzk(equityUsedCzk)}`
                    : undefined
                }
                source="HypotekaJasne mock"
              />
            </div>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              {preview.disclaimer}
            </p>
          </>
        )}
      </Card>

      {!isAuthenticated ? (
        <Card padding="lg">
          <InlineAlert tone="warning" title="Přihlášení pro předání partnerovi">
            Pro zjištění možností financování u HypotekaJasne se přihlaste. Data
            se neodešlou bez DataSharingPreview a výslovného souhlasu.
          </InlineAlert>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href={buildLoginUrl(returnPath)}>Přihlásit se</ButtonLink>
            <ButtonLink href="/ucet/financni-profil" variant="secondary">
              Finanční pas
            </ButtonLink>
          </div>
        </Card>
      ) : handoffPreview ? (
        <HypotekaJasneHandoffCard
          preview={handoffPreview}
          source={`nemovitosti/${returnPath.split("/").pop() ?? "detail"}`}
          onOpenTrack={() => {
            track({
              name: "financing_cta_clicked",
              props: { location: "property_detail" },
            });
          }}
        />
      ) : (
        <Card padding="lg">
          <InlineAlert tone="warning" title="Doplňte Finanční pas">
            Náhled předání dat není dostupný. Doplňte profil a zkuste znovu.
          </InlineAlert>
          <ButtonLink
            href="/ucet/financni-profil"
            variant="secondary"
            size="sm"
            className="mt-4"
          >
            Otevřít Finanční pas
          </ButtonLink>
        </Card>
      )}
    </section>
  );
}
