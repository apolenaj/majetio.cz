"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ActiveFilterChips } from "@/components/property/search/active-filter-chips";
import {
  FilterAccordion,
  filterInputClassName,
} from "@/components/property/search/filter-accordion";
import { InvestmentFilter } from "@/components/property/search/investment-filter";
import { MapFilter } from "@/components/property/search/map-filter";
import { PriceFilter } from "@/components/property/search/price-filter";
import { PropertySearchInput } from "@/components/property/search/property-search-input";
import { Label } from "@/components/forms/field";
import { Select } from "@/components/forms/controls";
import { Button } from "@/components/ui/button";
import {
  DISPOZICE_OPTIONS,
  ENERGIE_OPTIONS,
  KVALITA_OPTIONS,
  RAZENI_OPTIONS,
  STAV_OPTIONS,
  STRATEGIE_OPTIONS,
  TYP_OPTIONS,
  VLASTNICTVI_OPTIONS,
  buildPropertySearchHref,
  countActiveFilters,
  type PropertyUrlFilterState,
} from "@/domains/properties/search/url-state";
import { aggregateSearchFilters } from "@/domains/properties/search/analytics-aggregates";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((x) => x !== value)
    : [...list, value];
}

function PillToggleGroup({
  options,
  selected,
  onChange,
  columns = 2,
}: {
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  columns?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
      )}
    >
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(toggleValue(selected, opt.value))}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-150",
              active
                ? "border-[var(--action-accent)] bg-[var(--action-accent)]/10 font-medium text-[var(--text-primary)] shadow-sm"
                : "border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:border-[var(--action-accent)]/35 hover:text-[var(--text-primary)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function BasicsPanel({
  draft,
  patch,
}: {
  draft: PropertyUrlFilterState;
  patch: (partial: Partial<PropertyUrlFilterState>) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <div className="space-y-4">
        <FilterAccordion
          title="Typ a dispozice"
          description="Nejčastější parametry nabídky"
          defaultOpen
        >
          <div className="space-y-5">
            <div>
              <Label className="text-xs">Typ nemovitosti</Label>
              <PillToggleGroup
                selected={draft.typ}
                onChange={(typ) => patch({ typ })}
                options={TYP_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                columns={4}
              />
            </div>
            <div>
              <Label className="text-xs">Dispozice</Label>
              <PillToggleGroup
                selected={draft.dispozice}
                onChange={(dispozice) => patch({ dispozice })}
                options={DISPOZICE_OPTIONS.map((d) => ({ value: d, label: d }))}
                columns={3}
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="lokalita-text" className="text-xs">
                Město / lokalita (text)
              </Label>
              <input
                id="lokalita-text"
                value={draft.lokalita ?? ""}
                placeholder="např. Praha, Brno, Bratislava…"
                className={filterInputClassName}
                autoComplete="address-level2"
                onChange={(e) =>
                  patch({ lokalita: e.target.value.trim() || undefined })
                }
              />
            </div>
          </div>
        </FilterAccordion>

        <PriceFilter
          cenaOd={draft.cenaOd}
          cenaDo={draft.cenaDo}
          onChange={(next) => patch(next)}
        />

        <InvestmentFilter
          roiOd={draft.roiOd}
          cashflowOd={draft.cashflowOd}
          rekonstrukceOd={draft.rekonstrukceOd}
          rekonstrukceDo={draft.rekonstrukceDo}
          onChange={(next) => patch(next)}
        />
      </div>

      <div className="space-y-4">
        <MapFilter
          selected={draft.kraje}
          onChange={(kraje) => patch({ kraje })}
        />

        <FilterAccordion
          title="Další parametry"
          description="Stav, vlastnictví, PENB, strategie"
          defaultOpen={false}
        >
          <div className="space-y-5">
            <div className="min-w-0">
              <Label htmlFor="razeni" className="text-xs">
                Řazení
              </Label>
              <Select
                id="razeni"
                value={
                  RAZENI_OPTIONS.find((o) => o.sort === draft.razeni)?.value ??
                  "nejnovejsi"
                }
                aria-label="Řazení"
                onChange={(e) => {
                  const opt = RAZENI_OPTIONS.find(
                    (o) => o.value === e.target.value,
                  );
                  patch({ razeni: opt?.sort });
                }}
              >
                {RAZENI_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label className="text-xs">Užitná plocha (m²)</Label>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input
                  inputMode="numeric"
                  value={draft.plochaOd ?? ""}
                  placeholder="Od"
                  aria-label="Užitná plocha od"
                  className={filterInputClassName}
                  onChange={(e) =>
                    patch({
                      plochaOd:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value) || undefined,
                    })
                  }
                />
                <span className="text-sm text-[var(--text-muted)]" aria-hidden>
                  –
                </span>
                <input
                  inputMode="numeric"
                  value={draft.plochaDo ?? ""}
                  placeholder="Do"
                  aria-label="Užitná plocha do"
                  className={filterInputClassName}
                  onChange={(e) =>
                    patch({
                      plochaDo:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value) || undefined,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Stav nemovitosti</Label>
              <PillToggleGroup
                selected={draft.stav}
                onChange={(stav) => patch({ stav })}
                options={STAV_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
              />
            </div>

            <div>
              <Label className="text-xs">Vlastnictví</Label>
              <PillToggleGroup
                selected={draft.vlastnictvi}
                onChange={(vlastnictvi) => patch({ vlastnictvi })}
                options={VLASTNICTVI_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
              />
            </div>

            <div>
              <Label className="text-xs">Energetická náročnost (PENB)</Label>
              <PillToggleGroup
                selected={draft.energie}
                onChange={(energie) => patch({ energie })}
                options={ENERGIE_OPTIONS.map((e) => ({ value: e, label: e }))}
                columns={4}
              />
            </div>

            <div>
              <Label className="text-xs">Investiční strategie</Label>
              <PillToggleGroup
                selected={draft.strategie}
                onChange={(strategie) => patch({ strategie })}
                options={STRATEGIE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                columns={2}
              />
            </div>

            <div>
              <Label className="text-xs">Kvalita dat</Label>
              <PillToggleGroup
                selected={draft.kvalita}
                onChange={(kvalita) => patch({ kvalita })}
                options={KVALITA_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
              />
            </div>
          </div>
        </FilterAccordion>
      </div>
    </div>
  );
}

export function PropertySearchFilters({
  state,
  resultCount,
}: {
  state: PropertyUrlFilterState;
  resultCount: number;
}) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<PropertyUrlFilterState>(() => ({
    ...state,
    kraje: state.kraje ?? [],
  }));
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const activeCount = countActiveFilters(draft);

  React.useEffect(() => {
    setDraft({ ...state, kraje: state.kraje ?? [] });
  }, [state]);

  React.useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSheetOpen(false);
        return;
      }
      if (e.key !== "Tab" || !sheetRef.current) return;
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    sheetRef.current
      ?.querySelector<HTMLElement>("[data-sheet-close]")
      ?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [sheetOpen]);

  function patch(partial: Partial<PropertyUrlFilterState>) {
    setDraft((prev) => ({ ...prev, ...partial, stranka: 1 }));
  }

  function commit(next: PropertyUrlFilterState = draft) {
    const payload = { ...next, stranka: 1 };
    const agg = aggregateSearchFilters(payload);
    track({
      name: "filter_applied",
      props: {
        filter_count: agg.filter_count,
        price_max_bucket: agg.price_max_bucket,
        price_min_bucket: agg.price_min_bucket,
        property_types: agg.property_types,
        layout_count: agg.layout_count,
        sort: agg.sort,
        location_token: agg.location_token,
      },
    });
    if (agg.has_query || agg.location_token) {
      track({
        name: "search_query_submitted",
        props: {
          has_query: agg.has_query,
          location_token: agg.location_token,
          filter_count: agg.filter_count,
          sort: agg.sort,
        },
      });
    }
    if (payload.razeni && payload.razeni !== state.razeni) {
      track({ name: "sort_changed", props: { sort: payload.razeni } });
    }
    router.push(buildPropertySearchHref(payload));
    setSheetOpen(false);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    commit();
  }

  const resultLabel =
    resultCount === 1
      ? "výsledek"
      : resultCount >= 2 && resultCount <= 4
        ? "výsledky"
        : "výsledků";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Top search bar */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <PropertySearchInput
              defaultValue={draft.q ?? ""}
              onChangeValue={(q) => patch({ q: q.trim() || undefined })}
            />
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="secondary"
              className="lg:hidden"
              aria-label={
                activeCount > 0
                  ? `Otevřít filtry, aktivních ${activeCount}`
                  : "Otevřít filtry"
              }
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              onClick={() => setSheetOpen(true)}
            >
              <SlidersHorizontal className="size-4" />
              Filtry
              {activeCount > 0 ? (
                <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-[var(--action-primary)] text-[0.65rem] text-[var(--text-inverse)]">
                  {activeCount}
                </span>
              ) : null}
            </Button>
            <Button type="submit" className="min-w-[7.5rem]">
              Hledat
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop filter dashboard — wide accordion cards, page scroll (no cramped sidebar) */}
      <div className="hidden lg:block">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-[var(--text-primary)]">
              Filtry
            </h2>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              Přehledný dashboard — mapa krajů, cena a investiční metriky
            </p>
          </div>
          <Button type="submit" variant="secondary">
            Použít filtry
          </Button>
        </div>
        <div className="w-full">
          <BasicsPanel draft={draft} patch={patch} />
        </div>
      </div>

      {/* Mobile drawer */}
      {sheetOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[color-mix(in_srgb,var(--brand-ink-950)_45%,transparent)]"
            aria-label="Zavřít filtry"
            onClick={() => setSheetOpen(false)}
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filters-title"
            className="relative z-10 flex max-h-[92vh] min-w-0 flex-col overflow-hidden rounded-t-3xl border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-modal)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-4">
              <h2
                id="mobile-filters-title"
                className="font-display text-lg text-[var(--text-primary)]"
              >
                Filtry
                {activeCount > 0 ? (
                  <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
                    ({activeCount})
                  </span>
                ) : null}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                data-sheet-close
                aria-label="Zavřít filtry"
                onClick={() => setSheetOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
              <BasicsPanel draft={draft} patch={patch} />
            </div>
            <div className="border-t border-[var(--border-default)] px-4 py-3">
              <Button type="submit" fullWidth>
                Zobrazit {resultCount} {resultLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ActiveFilterChips state={state} />
    </form>
  );
}
