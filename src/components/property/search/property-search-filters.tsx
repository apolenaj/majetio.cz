"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { ActiveFilterChips } from "@/components/property/search/active-filter-chips";
import { CategoryGrid } from "@/components/property/search/category-grid";
import { FilterTabs } from "@/components/property/search/filter-tabs";
import { InvestmentMetrics } from "@/components/property/search/investment-metrics";
import { MapFilter } from "@/components/property/search/map-filter";
import { PriceFilter } from "@/components/property/search/price-filter";
import { PropertySearchInput } from "@/components/property/search/property-search-input";
import { Button } from "@/components/ui/button";
import {
  buildPropertySearchHref,
  type PropertyUrlFilterState,
  type SearchContextTab,
} from "@/domains/properties/search/url-state";
import { aggregateSearchFilters } from "@/domains/properties/search/analytics-aggregates";
import { track } from "@/lib/analytics/events";

/**
 * Main discovery search hub:
 * 1) Nabídka + Poptávka category grids (separate state)
 * 2) context tabs
 * 3) locality / price / investment filters
 */
export function PropertySearchFilters({
  state,
  resultCount,
}: {
  state: PropertyUrlFilterState;
  resultCount: number;
  /** @deprecated Counts removed from category cards — kept for API compat. */
  categoryCounts?: Partial<Record<string, number>>;
}) {
  const router = useRouter();

  /** Separate state for offer vs demand category selection. */
  const [offerTyp, setOfferTyp] = React.useState<string[]>(() => [
    ...(state.typ ?? []),
  ]);
  const [demandTyp, setDemandTyp] = React.useState<string[]>(() => [
    ...(state.typPoptavka ?? []),
  ]);

  const [draft, setDraft] = React.useState<PropertyUrlFilterState>(() => ({
    ...state,
    typ: state.typ ?? [],
    typPoptavka: state.typPoptavka ?? [],
    kraje: state.kraje ?? [],
    kontext: state.kontext ?? "doporucene",
  }));

  React.useEffect(() => {
    setOfferTyp([...(state.typ ?? [])]);
    setDemandTyp([...(state.typPoptavka ?? [])]);
    setDraft({
      ...state,
      typ: state.typ ?? [],
      typPoptavka: state.typPoptavka ?? [],
      kraje: state.kraje ?? [],
      kontext: state.kontext ?? "doporucene",
    });
  }, [state]);

  function patch(partial: Partial<PropertyUrlFilterState>) {
    setDraft((prev) => ({ ...prev, ...partial, stranka: 1 }));
  }

  function commit(
    nextDraft: PropertyUrlFilterState = draft,
    nextOffer: string[] = offerTyp,
    nextDemand: string[] = demandTyp,
  ) {
    const payload: PropertyUrlFilterState = {
      ...nextDraft,
      typ: nextOffer,
      typPoptavka: nextDemand,
      kraje: nextDraft.kraje ?? [],
      kontext: nextDraft.kontext ?? "doporucene",
      stranka: 1,
    };
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
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    commit();
  }

  function onTabChange(tab: SearchContextTab) {
    const next = {
      ...draft,
      kontext: tab,
      razeni: tab === "doporucene" ? ("recommended" as const) : draft.razeni,
      stranka: 1,
    };
    setDraft(next);
    commit(next);
  }

  const resultLabel =
    resultCount === 1
      ? "výsledek"
      : resultCount >= 2 && resultCount <= 4
        ? "výsledky"
        : "výsledků";

  return (
    <form onSubmit={onSubmit} className="space-y-10 sm:space-y-12">
      {/* ——— Block 1: Nabídka / Poptávka ——— */}
      <div className="space-y-10">
        <CategoryGrid
          title="Nabídka"
          description="Co se aktuálně prodává nebo pronajímá"
          selected={offerTyp}
          onChange={setOfferTyp}
        />

        <div
          className="border-t border-[var(--border-default)] pt-10"
          aria-hidden={false}
        >
          <CategoryGrid
            title="Poptávka"
            description="Co klienti aktivně hledají"
            selected={demandTyp}
            onChange={setDemandTyp}
          />
        </div>
      </div>

      {/* ——— Block 2: Context tabs ——— */}
      <FilterTabs
        value={draft.kontext ?? "doporucene"}
        onChange={onTabChange}
      />

      {/* Search query + CTA */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <PropertySearchInput
              defaultValue={draft.q ?? ""}
              label="Hledaný výraz"
              placeholder="Město, čtvrť nebo název nabídky…"
              onChangeValue={(q) => patch({ q: q.trim() || undefined })}
            />
          </div>
          <Button type="submit" className="min-w-[10rem] shrink-0 sm:mb-0.5">
            Hledat
            {resultCount > 0 ? (
              <span className="opacity-80">
                · {resultCount} {resultLabel}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      {/* ——— Block 3: Advanced + investment filters ——— */}
      <div className="space-y-3">
        <div>
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            Pokročilé a investiční filtry
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Lokalita, cena a výnosové metriky — každý filtr ve vlastní kartě
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <div className="space-y-5 lg:col-span-2">
            <MapFilter
              selected={draft.kraje}
              onChange={(kraje) => patch({ kraje })}
              collapsible={false}
            />
          </div>

          <PriceFilter
            cenaOd={draft.cenaOd}
            cenaDo={draft.cenaDo}
            onChange={(next) => patch(next)}
            collapsible={false}
          />

          <InvestmentMetrics
            roiOd={draft.roiOd}
            cashflowOd={draft.cashflowOd}
            rekonstrukceOd={draft.rekonstrukceOd}
            rekonstrukceDo={draft.rekonstrukceDo}
            onChange={(next) => patch(next)}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="secondary">
            Použít filtry
          </Button>
        </div>
      </div>

      <ActiveFilterChips
        state={{
          ...state,
          typ: offerTyp,
          typPoptavka: demandTyp,
        }}
      />
    </form>
  );
}
