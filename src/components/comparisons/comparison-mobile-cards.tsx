"use client";

import Link from "next/link";
import * as React from "react";

import { Label } from "@/components/forms/field";
import { Select } from "@/components/forms/controls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

/**
 * Mobile: horizontal scroll viewport with exactly 2 property cards side-by-side
 * (not 4 squeezed columns). Selectors switch which pair is shown.
 */
export function ComparisonMobileCards({
  view,
  metricsByCategory,
  onRemove,
}: {
  view: ComparisonViewModel;
  metricsByCategory: Array<{
    cat: ComparisonMetricCategoryId;
    metrics: ComparisonViewModel["metrics"];
  }>;
  onRemove: (slug: string) => void;
}) {
  const props = view.properties;
  const [leftId, setLeftId] = React.useState(props[0]?.propertyId ?? "");
  const [rightId, setRightId] = React.useState(
    props[1]?.propertyId ?? props[0]?.propertyId ?? "",
  );
  const [expandedKey, setExpandedKey] = React.useState<ComparisonMetricKey | null>(
    null,
  );

  React.useEffect(() => {
    if (!props.some((p) => p.propertyId === leftId)) {
      setLeftId(props[0]?.propertyId ?? "");
    }
    if (!props.some((p) => p.propertyId === rightId)) {
      setRightId(props[1]?.propertyId ?? props[0]?.propertyId ?? "");
    }
  }, [props, leftId, rightId]);

  const left = props.find((p) => p.propertyId === leftId) ?? props[0];
  const right =
    props.find((p) => p.propertyId === rightId) ?? props[1] ?? props[0];
  if (!left || !right) return null;

  const pair = [left, right];
  const countLabel =
    view.properties.length === 1
      ? "Porovnáváte 1 nemovitost"
      : `Porovnáváte ${view.properties.length} nemovitosti`;

  return (
    <div className="space-y-4 lg:hidden">
      <p className="sr-only" role="status">
        {countLabel}. Na mobilu zobrazujeme 2 nabídky vedle sebe.
      </p>
      <p className="text-sm text-[var(--text-secondary)]">
        Na mobilu porovnávejte 2 nabídky vedle sebe — posouvejte horizontálně.
        Ostatní vyberte v seznamech.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="cmp-left">Levý sloupec</Label>
          <Select
            id="cmp-left"
            value={left.propertyId}
            onChange={(e) => setLeftId(e.target.value)}
            aria-label="Vybrat levou nemovitost"
          >
            {props.map((p) => (
              <option key={p.propertyId} value={p.propertyId}>
                {p.title}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="cmp-right">Pravý sloupec</Label>
          <Select
            id="cmp-right"
            value={right.propertyId}
            onChange={(e) => setRightId(e.target.value)}
            aria-label="Vybrat pravou nemovitost"
          >
            {props.map((p) => (
              <option key={p.propertyId} value={p.propertyId}>
                {p.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2">
        <div className="flex w-max min-w-full gap-3">
          {pair.map((p) => (
            <Card
              key={p.propertyId}
              className="w-[min(72vw,18rem)] shrink-0 space-y-2 p-3 sm:w-[min(45vw,20rem)]"
            >
              <h3 className="font-display text-base leading-snug text-[var(--text-primary)]">
                <Link href={p.href} className="hover:underline">
                  {p.title}
                </Link>
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {displayCell(view, p.propertyId, "asking_price")}
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="px-0"
                onClick={() => onRemove(p.slug)}
              >
                Odebrat
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {metricsByCategory.map(({ cat, metrics }) => (
          <section key={cat} aria-labelledby={`cmp-m-${cat}`}>
            <h4
              id={`cmp-m-${cat}`}
              className="mb-2 font-medium text-[var(--text-primary)]"
            >
              {COMPARISON_CATEGORY_LABELS_CS[cat]}
            </h4>
            <ul className="space-y-2">
              {metrics.map((m) => {
                const open = expandedKey === m.key;
                return (
                  <li
                    key={m.key}
                    className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-2"
                  >
                    <button
                      type="button"
                      className="mb-2 w-full text-left text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]"
                      aria-expanded={open}
                      onClick={() =>
                        setExpandedKey((k) => (k === m.key ? null : m.key))
                      }
                    >
                      {m.labelCs}
                      {m.expandable ? " ▾" : ""}
                    </button>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {pair.map((p) => {
                        const highlight = p.highlights[m.key];
                        const label = displayCell(view, p.propertyId, m.key);
                        return (
                          <div
                            key={p.propertyId}
                            className={cn(
                              highlight === "best" &&
                                "font-medium text-[var(--status-success)]",
                              highlight === "worst" &&
                                "text-[var(--status-error)]",
                            )}
                          >
                            {label}
                            {highlight === "best" ? (
                              <span className="ml-1 text-[0.65rem]">(nejlepší)</span>
                            ) : null}
                            {highlight === "worst" ? (
                              <span className="ml-1 text-[0.65rem]">(nejhorší)</span>
                            ) : null}
                            {open && p.expandDetails?.[m.key] ? (
                              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                {p.expandDetails[m.key]!.body}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
