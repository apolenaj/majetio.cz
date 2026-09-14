"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";

import { InlineAlert } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getMyDecisionPrioritiesAction,
  prefillPrioritiesFromPassportAction,
  saveComparisonManualOrderAction,
  saveMyDecisionPrioritiesAction,
} from "@/domains/decision-workspace/server/actions";
import {
  computeDecisionMatch,
  applyManualPropertyOrder,
  type DecisionMatchResult,
} from "@/domains/decision-workspace/matrix/decision-match";
import {
  DECISION_CRITERIA,
  DECISION_PRIORITY_LABELS_CS,
  DEFAULT_DECISION_PRIORITIES,
  type DecisionPriorities,
  type DecisionPriorityLevel,
  type DecisionCriterionId,
} from "@/domains/decision-workspace/matrix/priorities";
import type { ComparisonPropertyColumn } from "@/domains/comparisons/types";
import { cn } from "@/lib/utils";

const LEVELS: DecisionPriorityLevel[] = ["LOW", "MEDIUM", "HIGH"];

const MANUAL_ORDER_KEY = "majetio.comparison.manualOrder.v1";

function readLocalManualOrder(key: string): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${MANUAL_ORDER_KEY}:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : null;
  } catch {
    return null;
  }
}

function writeLocalManualOrder(key: string, order: string[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${MANUAL_ORDER_KEY}:${key}`, JSON.stringify(order));
}

export function DecisionMatrix({
  properties,
  comparisonId = null,
  storageKey = "tray",
  onOrderChange,
}: {
  properties: ComparisonPropertyColumn[];
  comparisonId?: string | null;
  /** Session key for guest manual order (e.g. joined slugs). */
  storageKey?: string;
  onOrderChange?: (orderedPropertyIds: string[]) => void;
}) {
  const [priorities, setPriorities] = React.useState<DecisionPriorities>(
    DEFAULT_DECISION_PRIORITIES,
  );
  const [manualOrder, setManualOrder] = React.useState<string[] | null>(null);
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      const result = await getMyDecisionPrioritiesAction();
      setPriorities(result.priorities);
    })();
    setManualOrder(readLocalManualOrder(storageKey));
  }, [storageKey]);

  const matches: DecisionMatchResult[] = React.useMemo(
    () =>
      computeDecisionMatch({
        properties,
        priorities,
      }),
    [properties, priorities],
  );

  const displayOrder = React.useMemo(() => {
    const base = properties.map((p) => p.propertyId);
    if (manualOrder && manualOrder.length > 0) {
      return applyManualPropertyOrder(
        base.map((id) => ({ propertyId: id })),
        manualOrder,
      ).map((x) => x.propertyId);
    }
    // Auto sort by match score only when user has NOT set manual order
    return [...matches]
      .sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1))
      .map((m) => m.propertyId);
  }, [properties, manualOrder, matches]);

  React.useEffect(() => {
    onOrderChange?.(displayOrder);
  }, [displayOrder, onOrderChange]);

  function setLevel(id: DecisionCriterionId, level: DecisionPriorityLevel) {
    setPriorities((prev) => ({ ...prev, [id]: level }));
  }

  async function onSavePriorities() {
    setPending(true);
    setMessage(null);
    const result = await saveMyDecisionPrioritiesAction({ priorities });
    setPending(false);
    setMessage(result.ok ? "Priority uloženy." : "Přihlaste se pro uložení priorit.");
  }

  async function onPrefillPassport() {
    setPending(true);
    const result = await prefillPrioritiesFromPassportAction();
    setPending(false);
    if (result.ok) {
      setPriorities(result.priorities);
      setMessage("Priority předvyplněny z Finančního pasu.");
    } else {
      setMessage("Přihlaste se a doplňte Finanční pas.");
    }
  }

  function move(id: string, dir: -1 | 1) {
    const current =
      manualOrder && manualOrder.length > 0
        ? [...manualOrder]
        : [...displayOrder];
    const idx = current.indexOf(id);
    if (idx < 0) return;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= current.length) return;
    const swapped = [...current];
    const tmp = swapped[idx]!;
    swapped[idx] = swapped[nextIdx]!;
    swapped[nextIdx] = tmp;
    setManualOrder(swapped);
    writeLocalManualOrder(storageKey, swapped);
    if (comparisonId) {
      void saveComparisonManualOrderAction({
        comparisonId,
        manualOrder: swapped,
      });
    }
    setMessage(
      "Pořadí nastaveno ručně — automatické řazení podle Decision Match ho nepřepíše.",
    );
  }

  function clearManualOrder() {
    setManualOrder(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`${MANUAL_ORDER_KEY}:${storageKey}`);
    }
    setMessage("Ruční pořadí zrušeno — znovu platí Decision Match.");
  }

  const matchById = new Map(matches.map((m) => [m.propertyId, m]));

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-[var(--text-primary)]">
              Decision Matrix
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Nastavte prioritu kritérií. Decision Match váží pořadí metrik —
              vysvětlitelně, bez černé skříňky.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={pending}
              onClick={() => void onPrefillPassport()}
            >
              Z Finančního pasu
            </Button>
            <Button
              type="button"
              size="sm"
              loading={pending}
              onClick={() => void onSavePriorities()}
            >
              Uložit priority
            </Button>
          </div>
        </div>

        {message ? (
          <InlineAlert tone="info" title="Decision Workspace">
            {message}
          </InlineAlert>
        ) : null}

        <ul className="space-y-3">
          {DECISION_CRITERIA.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] pb-3"
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {c.labelCs}
              </span>
              <div className="flex gap-1" role="group" aria-label={`Priorita: ${c.labelCs}`}>
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setLevel(c.id, level)}
                    className={cn(
                      "rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium",
                      priorities[c.id] === level
                        ? "border-[var(--action-primary)] bg-[color-mix(in_srgb,var(--action-primary)_12%,white)]"
                        : "border-[var(--border-default)] text-[var(--text-secondary)]",
                    )}
                  >
                    {DECISION_PRIORITY_LABELS_CS[level]}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg text-[var(--text-primary)]">
            Decision Match &amp; pořadí
          </h3>
          {manualOrder ? (
            <Button type="button" size="sm" variant="ghost" onClick={clearManualOrder}>
              Zrušit ruční pořadí
            </Button>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              Řazeno podle Match — upravte šipkami pro ruční pořadí.
            </p>
          )}
        </div>

        <ol className="space-y-3">
          {displayOrder.map((id, index) => {
            const col = properties.find((p) => p.propertyId === id);
            const match = matchById.get(id);
            if (!col || !match) return null;
            return (
              <li
                key={id}
                className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-3"
              >
                <div className="flex items-start gap-2">
                  <GripVertical
                    className="mt-1 size-4 shrink-0 text-[var(--text-muted)]"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--text-primary)]">
                      <span className="text-[var(--text-muted)]">
                        #{index + 1}{" "}
                      </span>
                      {col.title}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Decision Match:{" "}
                      {match.matchScore != null
                        ? `${match.matchScore} / 100`
                        : "Není k dispozici"}
                      {manualOrder ? " · ruční pořadí" : ""}
                    </p>
                    {match.breakdown.length > 0 ? (
                      <ul className="mt-2 space-y-0.5 text-xs">
                        {match.breakdown.map((b, i) => (
                          <li
                            key={`${b.label}-${i}`}
                            className={cn(
                              b.tone === "strength" && "text-[var(--status-success)]",
                              b.tone === "weakness" && "text-[var(--status-warning)]",
                            )}
                          >
                            {b.label}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        Decision breakdown zatím bez silných/slabých signálů.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label="Posunout nahoru"
                      disabled={index === 0}
                      onClick={() => move(id, -1)}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label="Posunout dolů"
                      disabled={index === displayOrder.length - 1}
                      onClick={() => move(id, 1)}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
