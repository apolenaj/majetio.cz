"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { PropertySearchInput } from "@/components/property/search/property-search-input";
import { ActiveFilterChips } from "@/components/property/search/active-filter-chips";
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

function readStateFromRoot(root: ParentNode): PropertyUrlFilterState {
  const get = (name: string) => {
    const el = root.querySelector(`[name="${name}"]`) as
      | HTMLInputElement
      | HTMLSelectElement
      | null;
    return el?.value ?? "";
  };
  const multi = (name: string) =>
    Array.from(root.querySelectorAll(`[name="${name}"]:checked`)).map(
      (el) => (el as HTMLInputElement).value,
    );

  const num = (name: string) => {
    const raw = get(name).replace(/\s/g, "");
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  };

  const razeniUrl = get("razeni");
  const razeniOpt = RAZENI_OPTIONS.find((o) => o.value === razeniUrl);

  return {
    q: get("q").trim() || undefined,
    lokalita: get("lokalita").trim() || undefined,
    cenaOd: num("cena-od"),
    cenaDo: num("cena-do"),
    typ: multi("typ"),
    dispozice: multi("dispozice"),
    plochaOd: num("plocha-od"),
    plochaDo: num("plocha-do"),
    pozemekOd: num("pozemek-od"),
    pozemekDo: num("pozemek-do"),
    stav: multi("stav"),
    vlastnictvi: multi("vlastnictvi"),
    razeni: razeniOpt?.sort,
    energie: multi("energie"),
    strategie: multi("strategie"),
    kvalita: multi("kvalita"),
    stranka: 1,
  };
}

function CheckboxGroup({
  name,
  options,
  selected,
  columns = 1,
}: {
  name: string;
  options: readonly { value: string; label: string }[];
  selected: string[];
  columns?: 1 | 2;
}) {
  return (
    <div className={cn("grid gap-2", columns === 2 && "grid-cols-2")}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]"
        >
          <input
            type="checkbox"
            name={name}
            value={opt.value}
            defaultChecked={selected.includes(opt.value)}
            className="size-4 rounded border-[var(--border-default)]"
          />
          <span className="min-w-0 truncate">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function QuickFilters({ state }: { state: PropertyUrlFilterState }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="min-w-0">
        <Label htmlFor="cena-do">Cena do</Label>
        <Select
          id="cena-do"
          name="cena-do"
          defaultValue={state.cenaDo != null ? String(state.cenaDo) : ""}
          aria-label="Cena do"
        >
          <option value="">Bez limitu</option>
          <option value="3000000">3 mil. Kč</option>
          <option value="5000000">5 mil. Kč</option>
          <option value="8000000">8 mil. Kč</option>
          <option value="12000000">12 mil. Kč</option>
        </Select>
      </div>
      <div className="min-w-0">
        <Label>Typ</Label>
        <CheckboxGroup
          name="typ"
          selected={state.typ}
          options={TYP_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          columns={2}
        />
      </div>
      <div className="min-w-0">
        <Label>Dispozice</Label>
        <CheckboxGroup
          name="dispozice"
          selected={state.dispozice}
          options={DISPOZICE_OPTIONS.slice(0, 6).map((d) => ({
            value: d,
            label: d,
          }))}
          columns={2}
        />
      </div>
      <div className="min-w-0">
        <Label htmlFor="razeni">Řazení</Label>
        <Select
          id="razeni"
          name="razeni"
          defaultValue={
            RAZENI_OPTIONS.find((o) => o.sort === state.razeni)?.value ??
            "nejnovejsi"
          }
          aria-label="Řazení"
        >
          {RAZENI_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

function AdvancedFiltersFields({ state }: { state: PropertyUrlFilterState }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <Label htmlFor="cena-od">Cena od</Label>
          <input
            id="cena-od"
            name="cena-od"
            inputMode="numeric"
            defaultValue={state.cenaOd ?? ""}
            placeholder="např. 2000000"
            className="h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 text-sm"
          />
        </div>
        <div className="min-w-0">
          <Label>Užitná plocha od–do (m²)</Label>
          <div className="flex min-w-0 gap-2">
            <input
              name="plocha-od"
              inputMode="numeric"
              defaultValue={state.plochaOd ?? ""}
              placeholder="Od"
              className="h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 text-sm"
            />
            <input
              name="plocha-do"
              inputMode="numeric"
              defaultValue={state.plochaDo ?? ""}
              placeholder="Do"
              className="h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <Label>Stav nemovitosti</Label>
        <CheckboxGroup
          name="stav"
          selected={state.stav}
          options={STAV_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          columns={2}
        />
      </div>

      <div>
        <Label>Vlastnictví</Label>
        <CheckboxGroup
          name="vlastnictvi"
          selected={state.vlastnictvi}
          options={VLASTNICTVI_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          columns={2}
        />
      </div>

      <div>
        <Label>Energetická náročnost (PENB)</Label>
        <CheckboxGroup
          name="energie"
          selected={state.energie}
          options={ENERGIE_OPTIONS.map((e) => ({ value: e, label: e }))}
          columns={2}
        />
      </div>

      <div>
        <Label>Investiční strategie</Label>
        <CheckboxGroup
          name="strategie"
          selected={state.strategie}
          options={STRATEGIE_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
        />
      </div>

      <div>
        <Label>Kvalita dat</Label>
        <CheckboxGroup
          name="kvalita"
          selected={state.kvalita}
          options={KVALITA_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
        />
      </div>

      <div className="min-w-0">
        <Label htmlFor="lokalita-adv">Lokalita (přesněji)</Label>
        <input
          id="lokalita-adv"
          name="lokalita"
          defaultValue={state.lokalita ?? ""}
          placeholder="např. Praha"
          className="h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 text-sm"
        />
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
  const activeCount = countActiveFilters(state);
  const formRef = React.useRef<HTMLFormElement>(null);
  const sheetRef = React.useRef<HTMLDivElement>(null);

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
    const closeBtn = sheetRef.current?.querySelector<HTMLElement>(
      "[data-sheet-close]",
    );
    closeBtn?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [sheetOpen]);

  function commitFromVisibleRoot() {
    const form = formRef.current;
    if (!form) return;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    const root =
      form.querySelector(
        desktop ? "[data-filters-root='desktop']" : "[data-filters-root='mobile']",
      ) ?? form;
    const next = readStateFromRoot(root);
    const agg = aggregateSearchFilters(next);
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
    if (next.razeni && next.razeni !== state.razeni) {
      track({ name: "sort_changed", props: { sort: next.razeni } });
    }
    router.push(buildPropertySearchHref(next));
    setSheetOpen(false);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    commitFromVisibleRoot();
  }

  const resultLabel =
    resultCount === 1
      ? "výsledek"
      : resultCount >= 2 && resultCount <= 4
        ? "výsledky"
        : "výsledků";

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      {/* Desktop */}
      <div
        data-filters-root="desktop"
        className="hidden gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem]"
      >
        <div className="min-w-0 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_auto]">
            <PropertySearchInput defaultValue={state.q ?? ""} />
            <div className="flex items-end">
              <Button type="submit" className="min-w-[8rem]">
                Hledat
              </Button>
            </div>
          </div>
          <div className="mt-4 border-t border-[var(--border-default)] pt-4">
            <QuickFilters state={state} />
          </div>
        </div>

        <aside className="min-w-0 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-4">
          <h2 className="font-display text-lg text-[var(--text-primary)]">
            Pokročilé filtry
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            PENB, strategie a kvalita dat — v postranním panelu, ne všech 30 naráz nahoře.
          </p>
          <div className="mt-4 max-h-[32rem] overflow-y-auto overflow-x-hidden pr-1">
            <AdvancedFiltersFields state={state} />
          </div>
          <Button type="submit" variant="secondary" className="mt-4" fullWidth>
            Použít filtry
          </Button>
        </aside>
      </div>

      {/* Mobile */}
      <div data-filters-root="mobile" className="min-w-0 lg:hidden">
        <div className="sticky top-16 z-30 -mx-4 border-b border-[var(--border-default)] bg-[color-mix(in_srgb,var(--background-primary)_92%,transparent)] px-4 py-3 backdrop-blur-md">
          <div className="flex min-w-0 items-end gap-2 overflow-hidden">
            <div className="min-w-0 flex-1">
              <PropertySearchInput
                defaultValue={state.q ?? ""}
                label=""
                className="[&_label]:sr-only [&_p]:hidden"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="shrink-0"
              aria-label={
                activeCount > 0
                  ? `Otevřít filtry, aktivních ${activeCount}`
                  : "Otevřít filtry"
              }
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              onClick={() => setSheetOpen(true)}
            >
              <span className="relative inline-flex">
                <SlidersHorizontal className="size-5" />
                {activeCount > 0 ? (
                  <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-[var(--action-primary)] text-[0.6rem] text-[var(--text-inverse)]">
                    {activeCount}
                  </span>
                ) : null}
              </span>
            </Button>
            <Button type="submit" size="sm" className="shrink-0">
              Hledat
            </Button>
          </div>
        </div>

        {sheetOpen ? (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
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
              className="relative z-10 flex max-h-[88vh] min-w-0 flex-col overflow-hidden rounded-t-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-modal)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
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
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-4 py-4">
                <QuickFilters state={state} />
                <AdvancedFiltersFields state={state} />
              </div>
              <div className="border-t border-[var(--border-default)] px-4 py-3">
                <Button type="submit" fullWidth>
                  Zobrazit {resultCount} {resultLabel}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <ActiveFilterChips state={state} />
    </form>
  );
}
