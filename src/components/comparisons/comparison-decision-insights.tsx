"use client";

import * as React from "react";

import { InlineAlert } from "@/components/feedback/states";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getComparisonDecisionPackAction } from "@/domains/comparisons/server/actions";
import type { ComparisonDecisionPack } from "@/domains/comparisons/decision/types";
import { formatDateTime } from "@/lib/format";

/**
 * Optional Decision Pack insights — failures must not crash the page.
 */
export function ComparisonDecisionInsights({
  comparisonId,
}: {
  comparisonId: string | null;
}) {
  const [pack, setPack] = React.useState<ComparisonDecisionPack | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(
    async (refresh = false) => {
      if (!comparisonId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await getComparisonDecisionPackAction({
          comparisonId,
          refresh,
        });
        if (!result.ok) {
          setError(result.error);
          setPack(null);
        } else {
          setPack(result.pack);
        }
      } catch {
        setError("Decision Pack se nepodařilo načíst.");
        setPack(null);
      } finally {
        setLoading(false);
      }
    },
    [comparisonId],
  );

  React.useEffect(() => {
    void load(false);
  }, [load]);

  if (!comparisonId) return null;

  if (error) {
    return (
      <InlineAlert tone="warning" title="Decision insights nejsou k dispozici">
        {error} Tabulkové porovnání níže funguje dál.
      </InlineAlert>
    );
  }

  if (loading && !pack) {
    return (
      <p className="text-sm text-[var(--text-muted)]" role="status">
        Načítám decision insights…
      </p>
    );
  }

  if (!pack) return null;

  return (
    <section
      aria-labelledby="decision-insights-heading"
      className="comparison-print-block space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="decision-insights-heading"
          className="font-display text-xl text-[var(--text-primary)]"
        >
          Decision insights
        </h2>
        {pack.isStale ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            loading={loading}
            onClick={() => void load(true)}
          >
            Aktualizovat porovnání
          </Button>
        ) : null}
      </div>

      {pack.refreshHintCs ? (
        <InlineAlert
          tone="info"
          title="Některá data se od posledního porovnání změnila"
        >
          {pack.refreshHintCs}
        </InlineAlert>
      ) : null}

      <Card className="space-y-2 p-4">
        <p className="text-sm text-[var(--text-secondary)]">{pack.advice.headlineCs}</p>
        {pack.advice.recommendedStepCs ? (
          <p className="text-sm text-[var(--text-primary)]">
            {pack.advice.recommendedStepCs}
          </p>
        ) : null}
        <p className="text-xs text-[var(--text-muted)]">
          Stav připravenosti:{" "}
          {pack.completeness === "ready_for_decision"
            ? "připraveno k rozhodnutí"
            : pack.completeness === "medium"
              ? "střední"
              : "nízká"}
          {pack.snapshot.metricsAt
            ? ` · Data k ${formatDateTime(pack.snapshot.metricsAt)}`
            : null}
        </p>
      </Card>

      <ul className="grid gap-3 sm:grid-cols-2">
        {pack.properties.map((p) => (
          <li key={p.propertyId}>
            <Card className="space-y-2 p-4 text-sm">
              <p className="font-medium text-[var(--text-primary)]">{p.title}</p>
              {p.negotiation.gapCzk != null ? (
                <p className="text-[var(--text-secondary)]">
                  Gap nabídky:{" "}
                  {new Intl.NumberFormat("cs-CZ", {
                    style: "currency",
                    currency: "CZK",
                    maximumFractionDigits: 0,
                  }).format(p.negotiation.gapCzk)}
                  {p.negotiation.summaryCs
                    ? ` — ${p.negotiation.summaryCs}`
                    : ""}
                </p>
              ) : (
                <p className="text-[var(--text-muted)]">
                  Gap nabídky: Není k dispozici
                </p>
              )}
              {p.renovation.costBaseCzk != null ? (
                <p className="text-[var(--text-secondary)]">
                  Rekonstrukce low/base/high:{" "}
                  {[
                    p.renovation.costLowCzk,
                    p.renovation.costBaseCzk,
                    p.renovation.costHighCzk,
                  ]
                    .map((v) =>
                      v == null
                        ? "—"
                        : new Intl.NumberFormat("cs-CZ", {
                            style: "currency",
                            currency: "CZK",
                            maximumFractionDigits: 0,
                          }).format(v),
                    )
                    .join(" / ")}
                  {p.renovation.durationDays != null
                    ? ` · ${p.renovation.durationDays} dní`
                    : ""}
                </p>
              ) : null}
              <p className="text-[var(--text-secondary)]">
                Rizika — kritická {p.risks.counts.critical}, vysoká{" "}
                {p.risks.counts.high}, střední {p.risks.counts.medium}
              </p>
              {p.majetioScore.score != null ? (
                <p className="text-[var(--text-secondary)]">
                  Majetio skóre {Math.round(p.majetioScore.score)}
                  {p.majetioScore.confidence &&
                  p.majetioScore.confidence !== "unknown"
                    ? ` (spolehlivost ${p.majetioScore.confidence})`
                    : ""}
                </p>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>

      {pack.staleDiffs.length > 0 ? (
        <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
          {pack.staleDiffs.map((d, i) => (
            <li key={`${d.propertyId}-${d.field}-${i}`}>
              {d.propertyTitle}: {d.messageCs}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
