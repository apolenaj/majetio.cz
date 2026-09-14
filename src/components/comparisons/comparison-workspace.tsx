"use client";

import Link from "next/link";
import * as React from "react";

import { EmptyState, InlineAlert } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { DecisionMatrix } from "@/components/decision-workspace/decision-matrix";
import { ComparisonDesktopTable } from "@/components/comparisons/comparison-desktop-table";
import { ComparisonMobileCards } from "@/components/comparisons/comparison-mobile-cards";
import { ComparisonSectionBoundary } from "@/components/comparisons/comparison-section-boundary";
import { ComparisonDecisionInsights } from "@/components/comparisons/comparison-decision-insights";
import { ComparisonSharePanel } from "@/components/comparisons/comparison-share-panel";
import { comparisonConfig } from "@/config/comparison";
import {
  buildComparisonViewModel,
} from "@/domains/comparisons/service/build-view-model";
import {
  COMPARISON_MODE_LABELS_CS,
  type ComparisonMetricCategoryId,
  type ComparisonMode,
  type ComparisonViewModel,
} from "@/domains/comparisons/types";
import { listMyNotesPreviewAction } from "@/domains/decision-workspace/server/actions";
import { getDemoPublicProperty } from "@/content/demo-canonical-properties";
import type { PassportState } from "@/lib/financial-passport/types";
import {
  clearCompareTray,
  readCompareTray,
  removeCompareItem,
  COMPARE_CHANGED_EVENT,
} from "@/domains/properties/search/compare-tray";

const MODES: ComparisonMode[] = [
  "overview",
  "own_home",
  "investment",
  "financing",
];

const CATEGORY_ORDER: ComparisonMetricCategoryId[] = [
  "basics",
  "value",
  "investment",
  "financing",
  "renovation",
  "location",
  "risks",
  "match",
];

function auditDateLabel(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) {
    return new Intl.DateTimeFormat("cs-CZ", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).format(new Date());
  }
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(d);
}

export function ComparisonWorkspace({
  initialSlugs,
  initialView,
  passport = null,
  comparisonId = null,
}: {
  initialSlugs?: string[];
  initialView?: ComparisonViewModel | null;
  passport?: PassportState | null;
  comparisonId?: string | null;
}) {
  const [mode, setMode] = React.useState<ComparisonMode>(
    initialView?.mode ?? "overview",
  );
  const [usePassport, setUsePassport] = React.useState(true);
  const [notePreviews, setNotePreviews] = React.useState<
    Record<string, { preview: string; tags: string[] }>
  >({});
  const [slugs, setSlugs] = React.useState<string[]>(() => {
    if (initialSlugs?.length) return initialSlugs;
    if (initialView?.properties.length) {
      return initialView.properties.map((p) => p.slug);
    }
    return [];
  });

  React.useEffect(() => {
    if (comparisonId || initialSlugs?.length) return;
    const sync = () => {
      setSlugs(readCompareTray().map((i) => i.slug));
    };
    sync();
    window.addEventListener(COMPARE_CHANGED_EVENT, sync);
    return () => window.removeEventListener(COMPARE_CHANGED_EVENT, sync);
  }, [comparisonId, initialSlugs]);

  const view = React.useMemo(() => {
    try {
      if (initialView && comparisonId && mode === initialView.mode && usePassport) {
        // Prefer server view when mode matches; rebuild when mode/passport toggles
      }
      return buildComparisonViewModel({
        id: comparisonId,
        name: initialView?.name,
        mode,
        properties: slugs.map((slug, order) => {
          const demo = getDemoPublicProperty(slug);
          const fromInitial = initialView?.properties.find((p) => p.slug === slug);
          return {
            propertyId: fromInitial?.propertyId ?? demo?.id ?? slug,
            slug,
            order,
          };
        }),
        passport: usePassport ? passport : null,
        createdAt: initialView?.createdAt,
        updatedAt: initialView?.updatedAt,
      });
    } catch {
      return buildComparisonViewModel({
        id: comparisonId,
        mode,
        properties: [],
        passport: null,
      });
    }
  }, [slugs, mode, passport, usePassport, comparisonId, initialView]);

  const propertyIdsKey = view.properties.map((p) => p.propertyId).join(",");
  React.useEffect(() => {
    if (!propertyIdsKey) {
      setNotePreviews({});
      return;
    }
    void (async () => {
      try {
        const result = await listMyNotesPreviewAction({
          propertyIds: propertyIdsKey.split(","),
        });
        if (result.ok) setNotePreviews(result.notes);
      } catch {
        // notes are optional — never crash comparison
      }
    })();
  }, [propertyIdsKey]);

  function removeSlug(slug: string) {
    setSlugs((prev) => prev.filter((s) => s !== slug));
    removeCompareItem(slug);
  }

  const count = view.properties.length;
  const atLimit = count >= comparisonConfig.maxProperties;
  const compareLiveLabel =
    count === 0
      ? "Zatím neporovnáváte žádnou nemovitost."
      : count === 1
        ? "Porovnáváte 1 nemovitost. Přidejte alespoň 2 nemovitosti."
        : `Porovnáváte ${count} nemovitosti.`;

  if (count < comparisonConfig.minPropertiesToCompare) {
    return (
      <div className="space-y-6">
        <div className="sr-only" role="status" aria-live="polite">
          {compareLiveLabel}
        </div>
        <EmptyState
          title={comparisonConfig.emptyCompareMessageCs}
          description={`Porovnání podporuje maximálně ${comparisonConfig.maxProperties} položek. Výběr přidáte ikonou porovnání na kartě.`}
          action={
            <ButtonLink href="/nemovitosti" variant="secondary">
              Procházet nemovitosti
            </ButtonLink>
          }
        />
        {count > 0 ? (
          <ul className="space-y-2">
            {view.properties.map((p) => (
              <li key={p.propertyId}>
                <Card className="flex items-center justify-between gap-3 p-3">
                  <Link href={p.href} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSlug(p.slug)}
                  >
                    Odebrat
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  const metricsByCategory = CATEGORY_ORDER.map((cat) => ({
    cat,
    metrics: view.metrics
      .filter(
        (m) =>
          m.category === cat && view.orderedMetricKeys.includes(m.key),
      )
      .sort(
        (a, b) =>
          view.orderedMetricKeys.indexOf(a.key) -
          view.orderedMetricKeys.indexOf(b.key),
      ),
  })).filter((g) => g.metrics.length > 0);

  const dataAudit = auditDateLabel(view.updatedAt ?? view.createdAt);

  return (
    <div className="comparison-workspace space-y-8">
      <div className="sr-only" role="status" aria-live="polite">
        {compareLiveLabel}
      </div>

      {atLimit ? (
        <InlineAlert tone="info" title={`${count}/${comparisonConfig.maxProperties}`}>
          Pro přidání další nemovitosti nejprve jednu odeberte.
        </InlineAlert>
      ) : null}

      <div
        className="flex flex-wrap gap-2 print:hidden"
        role="tablist"
        aria-label="Režim porovnání"
      >
        {MODES.map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant={mode === m ? "secondary" : "outline"}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
          >
            {COMPARISON_MODE_LABELS_CS[m]}
          </Button>
        ))}
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4 print:hidden">
        <div>
          <p className="font-medium text-[var(--text-primary)]">
            Finanční pas — LTV a splátky
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            {passport
              ? view.passportApplied
                ? "Přepočet používá vlastní zdroje z Finančního pasu."
                : "Zapněte pas pro přepočet LTV a orientační splátky."
              : "Přihlaste se a doplňte Finanční pas pro osobní LTV a splátky."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {passport ? (
            <Button
              type="button"
              size="sm"
              variant={usePassport ? "secondary" : "outline"}
              onClick={() => setUsePassport((v) => !v)}
            >
              {usePassport ? "Pas zapnutý" : "Zapnout pas"}
            </Button>
          ) : (
            <ButtonLink href="/ucet/financni-profil" size="sm" variant="secondary">
              Otevřít Finanční pas
            </ButtonLink>
          )}
        </div>
      </Card>

      <ComparisonSectionBoundary title="Decision insights">
        <ComparisonDecisionInsights comparisonId={comparisonId} />
      </ComparisonSectionBoundary>

      <ComparisonSectionBoundary title="Rychlé shrnutí">
        {view.summary.length > 0 ? (
          <section aria-labelledby="comparison-summary-heading">
            <h2
              id="comparison-summary-heading"
              className="font-display text-xl text-[var(--text-primary)]"
            >
              Rychlé rozhodovací shrnutí
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {view.summary.map((s) => (
                <li key={s.id}>
                  <Card className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                      {s.label}
                    </p>
                    <p className="mt-1 font-display text-lg text-[var(--text-primary)]">
                      {s.valueLabel}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {s.propertyTitle}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </ComparisonSectionBoundary>

      {view.warnings.map((w) => (
        <InlineAlert
          key={w.id}
          tone={w.severity === "warning" ? "warning" : "info"}
          title={w.title}
        >
          {w.body}
        </InlineAlert>
      ))}

      <ComparisonSectionBoundary
        title="Decision Matrix"
        fallbackDescription="Matice priorít selhala — tabulka metrik níže zůstává dostupná."
      >
        <div className="print:hidden">
          <DecisionMatrix
            properties={view.properties}
            comparisonId={comparisonId}
            storageKey={slugs.join(",") || "tray"}
          />
        </div>
      </ComparisonSectionBoundary>

      <ComparisonSectionBoundary title="Tabulka porovnání">
        <ComparisonDesktopTable
          view={view}
          metricsByCategory={metricsByCategory}
          notePreviews={notePreviews}
          onRemove={removeSlug}
        />
        <ComparisonMobileCards
          view={view}
          metricsByCategory={metricsByCategory}
          onRemove={removeSlug}
        />
      </ComparisonSectionBoundary>

      {comparisonId ? (
        <ComparisonSectionBoundary title="Sdílení">
          <ComparisonSharePanel comparisonId={comparisonId} />
        </ComparisonSectionBoundary>
      ) : (
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              clearCompareTray();
              setSlugs([]);
            }}
          >
            Vymazat výběr
          </Button>
          {atLimit ? (
            <p className="text-sm text-[var(--text-muted)]">
              Pro přidání další nemovitosti nejprve jednu odeberte.
            </p>
          ) : (
            <ButtonLink href="/nemovitosti" variant="ghost" size="sm">
              Přidat další
            </ButtonLink>
          )}
        </div>
      )}

      <footer className="comparison-print-footer space-y-1 text-xs text-[var(--text-muted)]">
        <p>
          Orientační porovnání. Chybějící data = „{view.unavailableLabel}“, nikoli
          nula. Zvýraznění nejlepší/nejhorší má textový label i barvu.
        </p>
        <p>
          Zdroje: Majetio katalog, valuation / investment / renovation moduly,
          Finanční pas (pokud zapnutý). Data k {dataAudit}.
        </p>
      </footer>
    </div>
  );
}
