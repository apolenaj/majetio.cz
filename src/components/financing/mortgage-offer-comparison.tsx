"use client";

import type { MortgageOfferComparisonRow } from "@/domains/financing/mortgage-offer-catalog";
import { formatOfferRatePp } from "@/domains/financing/mortgage-offer-catalog";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/data-display/table";

function formatCzk(czk: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(czk);
}

export function MortgageOfferComparison({
  rows,
  className,
}: {
  rows: MortgageOfferComparisonRow[];
  className?: string;
}) {
  if (rows.length < 2) return null;

  return (
    <Card padding="lg" className={className}>
      <CardHeader>
        <CardTitle>Porovnání vybraných nabídek</CardTitle>
        <CardDescription>
          Stejný scénář (cena, kapitál, splatnost) — liší se jen produktová sazba a
          LTV limit. Cash flow zde znamená měsíční zátěž splátky (bez příjmů z nájmu).
        </CardDescription>
      </CardHeader>

      <div className="mt-4">
        <Table>
          <THead>
            <TR>
              <TH>Produkt</TH>
              <TH align="right">Sazba</TH>
              <TH align="right">RPSN</TH>
              <TH align="right">Fixace</TH>
              <TH align="right">Max LTV</TH>
              <TH align="right">Splátka / měs</TH>
              <TH align="right">Úroky celkem</TH>
              <TH align="right">LTV scénáře</TH>
              <TH align="right">Cash flow</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR key={row.offerId}>
                <TD>
                  <div className="space-y-1">
                    <p className="font-medium">{row.bankName}</p>
                    <p className="text-xs text-[var(--text-muted)]">{row.productName}</p>
                    {row.isSponsored ? (
                      <Badge tone="warning" className="text-[10px]">
                        Sponzorováno
                      </Badge>
                    ) : null}
                  </div>
                </TD>
                <TD numeric>{formatOfferRatePp(row.nominalRatePp)}</TD>
                <TD numeric>
                  {row.aprPp != null ? formatOfferRatePp(row.aprPp) : "—"}
                </TD>
                <TD numeric>
                  {row.fixationYears != null ? `${row.fixationYears} let` : "—"}
                </TD>
                <TD numeric>
                  {row.ltvMaxPct != null ? `${row.ltvMaxPct}\u00a0%` : "—"}
                </TD>
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
    </Card>
  );
}
