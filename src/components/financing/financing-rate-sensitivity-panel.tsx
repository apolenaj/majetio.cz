"use client";

import * as React from "react";

import {
  buildFinancingRateSensitivity,
  formatOfferRatePp,
  type FinancingRateSensitivityRow,
} from "@/domains/financing/mortgage-offer-catalog";
import type { PropertyFinancingInput } from "@/domains/financing";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/data-display/table";

function formatCzk(czk: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(czk);
}

export function FinancingRateSensitivityPanel({
  baseFinancingInput,
  modeledRatePp,
  className,
}: {
  baseFinancingInput: PropertyFinancingInput;
  modeledRatePp: number | null;
  className?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const rows: FinancingRateSensitivityRow[] = React.useMemo(() => {
    if (modeledRatePp == null) return [];
    return buildFinancingRateSensitivity({
      baseFinancingInput: {
        ...baseFinancingInput,
        nominalInterestRatePp: modeledRatePp,
      },
    });
  }, [baseFinancingInput, modeledRatePp]);

  if (modeledRatePp == null || rows.length === 0) return null;

  return (
    <Card padding="lg" className={className}>
      <CardHeader>
        <CardTitle>Citlivost na sazbu</CardTitle>
        <CardDescription>
          Modelový dopad změny úrokové sazby o +1 a +2 procentní body při stejném
          úvěru a splatnosti. Nejde o predikci budoucí sazby banky.
        </CardDescription>
      </CardHeader>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Skrýt citlivost" : "Zobrazit citlivost (+1 / +2 p.b.)"}
        </Button>
        <p className="text-sm text-[var(--text-secondary)]">
          Základ: modelová sazba {formatOfferRatePp(modeledRatePp)}
        </p>
      </div>

      {expanded ? (
        <div className="mt-4">
          <Table>
            <THead>
              <TR>
                <TH>Scénář</TH>
                <TH align="right">Sazba</TH>
                <TH align="right">Splátka / měs</TH>
                <TH align="right">Úroky celkem</TH>
                <TH align="right">LTV</TH>
                <TH align="right">Cash flow</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => (
                <TR key={row.rateDeltaPp}>
                  <TD>{row.label}</TD>
                  <TD numeric>{formatOfferRatePp(row.nominalRatePp)}</TD>
                  <TD numeric>
                    {row.monthlyPaymentCzk != null
                      ? formatCzk(row.monthlyPaymentCzk)
                      : "—"}
                  </TD>
                  <TD numeric>
                    {row.totalInterestCzk != null
                      ? formatCzk(row.totalInterestCzk)
                      : "—"}
                  </TD>
                  <TD numeric>
                    {row.ltvOnAskingPricePct != null
                      ? `${row.ltvOnAskingPricePct.toFixed(1).replace(".", ",")}\u00a0%`
                      : "—"}
                  </TD>
                  <TD numeric className="text-[var(--status-error)]">
                    {row.monthlyDebtServiceCzk != null
                      ? formatCzk(row.monthlyDebtServiceCzk)
                      : "—"}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      ) : null}
    </Card>
  );
}
