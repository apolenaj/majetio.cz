"use client";

import Link from "next/link";
import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NotePreviewChip } from "@/components/decision-workspace/property-notes-panel";
import {
  COMPARISON_CATEGORY_LABELS_CS,
  type ComparisonMetricCategoryId,
  type ComparisonMetricKey,
  type ComparisonViewModel,
} from "@/domains/comparisons/types";
import { formatComparisonCell } from "@/domains/comparisons/service/build-view-model";
import { cn } from "@/lib/utils";

const RISK_LABELS: Record<number, string> = {
  1: "Nízké",
  2: "Střední",
  2.5: "Neznámé",
  3: "Vysoké",
  4: "Kritické",
};

const STATIC_EXPAND: Partial<
  Record<ComparisonMetricKey, { title: string; body: string }>
> = {
  valuation_confidence: {
    title: "Spolehlivost odhadu",
    body: "Odvíjí se od počtu srovnatelných nabídek, stáří dat a úplnosti vstupu. Nízká spolehlivost = berte střední odhad orientačně.",
  },
  irr_pct: {
    title: "Předpoklady IRR",
    body: "IRR je citlivé na exit, hold period a CapEx. Chybějící vstup = „Není k dispozici“, nikoli nula.",
  },
  max_offer_gap: {
    title: "Gap nabídky",
    body: "Asking minus modelované maximum. Kladný gap = prostor ke slevě vůči modelu.",
  },
  financing_gap: {
    title: "Finanční gap",
    body: "Chybějící vlastní zdroje vůči cílovému LTV. Orientační — ne posouzení úvěruschopnosti.",
  },
};

function displayCell(
  view: ComparisonViewModel,
  propertyId: string,
  key: ComparisonMetricKey,
): string {
  const col = view.properties.find((p) => p.propertyId === propertyId);
  const cell = col?.cells[key];
  if (key === "risk_level" && cell?.kind === "number") {
    return RISK_LABELS[cell.value] ?? formatComparisonCell(cell, view.unavailableLabel);
  }
  return formatComparisonCell(cell, view.unavailableLabel);
}

function HighlightLabel({
  highlight,
}: {
  highlight: "best" | "worst" | null | undefined;
}) {
  if (highlight === "best") {
    return (
      <span className="ml-1 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--status-success)]">
        (nejlepší)
      </span>
    );
  }
  if (highlight === "worst") {
    return (
      <span className="ml-1 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--status-error)]">
        (nejhorší)
      </span>
    );
  }
  return null;
}

function resolveExpand(
  view: ComparisonViewModel,
  key: ComparisonMetricKey,
): { title: string; body: string } | null {
  const def = view.metrics.find((m) => m.key === key);
  if (!def?.expandable && !STATIC_EXPAND[key]) return null;
  // Prefer first property-specific detail, else static
  for (const p of view.properties) {
    const d = p.expandDetails?.[key];
    if (d) return d;
  }
  return STATIC_EXPAND[key] ?? null;
}

export function ComparisonDesktopTable({
  view,
  metricsByCategory,
  notePreviews,
  onRemove,
}: {
  view: ComparisonViewModel;
  metricsByCategory: Array<{
    cat: ComparisonMetricCategoryId;
    metrics: ComparisonViewModel["metrics"];
  }>;
  notePreviews: Record<string, { preview: string; tags: string[] }>;
  onRemove: (slug: string) => void;
}) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const countLabel =
    view.properties.length === 1
      ? "Porovnáváte 1 nemovitost"
      : `Porovnáváte ${view.properties.length} nemovitosti`;

  return (
    <div className="comparison-print-block hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[48rem] border-collapse text-sm">
        <caption className="sr-only">
          {countLabel}. Metriky ve sloupcích, první sloupec jsou názvy metrik.
          Nejlepší a nejhorší hodnoty mají textový label.
        </caption>
        <thead className="sticky top-0 z-[2]">
          <tr>
            <th
              scope="col"
              className="sticky top-0 left-0 z-[3] bg-[var(--background-primary)] p-3 text-left font-medium text-[var(--text-muted)] shadow-[0_1px_0_var(--border-default)]"
            >
              Metrika
            </th>
            {view.properties.map((p) => (
              <th
                key={p.propertyId}
                scope="col"
                className="sticky top-0 z-[2] min-w-[11rem] bg-[var(--background-primary)] p-3 text-left align-bottom shadow-[0_1px_0_var(--border-default)]"
              >
                <Link
                  href={p.href}
                  className="font-display text-base text-[var(--text-primary)] hover:underline"
                >
                  {p.title}
                </Link>
                <p className="mt-1 text-sm font-normal text-[var(--text-secondary)]">
                  {displayCell(view, p.propertyId, "asking_price")}
                </p>
                {p.isDemo ? (
                  <span className="mt-1 block text-[0.65rem] font-semibold uppercase text-[var(--action-premium)]">
                    Demo
                  </span>
                ) : null}
                {notePreviews[p.propertyId] ? (
                  <NotePreviewChip
                    preview={notePreviews[p.propertyId]!.preview}
                    tags={notePreviews[p.propertyId]!.tags}
                  />
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-1 px-0"
                  onClick={() => onRemove(p.slug)}
                >
                  Odebrat
                </Button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metricsByCategory.map(({ cat, metrics }) => (
            <React.Fragment key={cat}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={view.properties.length + 1}
                  className="bg-[var(--background-secondary)] px-3 py-2 text-left font-medium text-[var(--text-primary)]"
                >
                  {COMPARISON_CATEGORY_LABELS_CS[cat]}
                </th>
              </tr>
              {metrics.map((m) => {
                const detail = resolveExpand(view, m.key);
                const isOpen = expanded.has(m.key);
                return (
                  <React.Fragment key={m.key}>
                    <tr className="border-b border-[var(--border-default)]">
                      <th
                        scope="row"
                        className="sticky left-0 z-[1] bg-[var(--background-primary)] p-3 text-left font-normal text-[var(--text-secondary)]"
                      >
                        {detail ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                            aria-expanded={isOpen}
                            onClick={() => toggleExpand(m.key)}
                          >
                            {m.labelCs}
                            <ChevronDown
                              className={cn(
                                "size-3.5 shrink-0 transition-transform",
                                isOpen && "rotate-180",
                              )}
                              aria-hidden
                            />
                          </button>
                        ) : (
                          m.labelCs
                        )}
                      </th>
                      {view.properties.map((p) => {
                        const highlight = p.highlights[m.key];
                        const label = displayCell(view, p.propertyId, m.key);
                        const missing = label === view.unavailableLabel;
                        const perPropertyDetail = p.expandDetails?.[m.key];
                        return (
                          <td
                            key={p.propertyId}
                            className={cn(
                              "p-3 align-top",
                              highlight === "best" &&
                                "bg-[color-mix(in_srgb,var(--status-success)_12%,transparent)] font-medium text-[var(--status-success)]",
                              highlight === "worst" &&
                                "bg-[color-mix(in_srgb,var(--status-error)_10%,transparent)] text-[var(--status-error)]",
                              missing && "text-[var(--text-muted)]",
                            )}
                          >
                            <span>
                              {label}
                              <HighlightLabel highlight={highlight} />
                            </span>
                            {isOpen && perPropertyDetail ? (
                              <p className="mt-2 text-xs font-normal text-[var(--text-secondary)]">
                                {perPropertyDetail.body}
                              </p>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                    {detail && isOpen ? (
                      <tr className="border-b border-[var(--border-default)] bg-[var(--background-secondary)]/60">
                        <td
                          colSpan={view.properties.length + 1}
                          className="px-3 py-3 text-sm text-[var(--text-secondary)]"
                        >
                          <p className="font-medium text-[var(--text-primary)]">
                            {detail.title}
                          </p>
                          <p className="mt-1">{detail.body}</p>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
