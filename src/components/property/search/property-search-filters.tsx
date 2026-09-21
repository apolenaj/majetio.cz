"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { DiscoveryFilterBar } from "@/components/property/search/discovery-filter-bar";
import { FilterTabs } from "@/components/property/search/filter-tabs";
import {
  buildPropertySearchHref,
  type PropertyUrlFilterState,
  type SearchContextTab,
} from "@/domains/properties/search/url-state";
import { aggregateSearchFilters } from "@/domains/properties/search/analytics-aggregates";
import { track } from "@/lib/analytics/events";

/**
 * Discovery filters stay in the URL.
 * layout=bar: sticky horizontal bar + drawer.
 * layout=sidebar: premium left panel wrapping main results via children.
 */
export function PropertySearchFilters({
  state,
  resultCount,
  layout = "bar",
  children,
}: {
  state: PropertyUrlFilterState;
  resultCount: number;
  layout?: "bar" | "sidebar";
  children?: React.ReactNode;
  /** @deprecated Counts removed from category cards — kept for API compat. */
  categoryCounts?: Partial<Record<string, number>>;
}) {
  const router = useRouter();
  const stateKey = JSON.stringify(state);
  const [draft, setDraft] = React.useState(state);
  const [syncedKey, setSyncedKey] = React.useState(stateKey);
  if (syncedKey !== stateKey) {
    setSyncedKey(stateKey);
    setDraft(state);
  }

  function patch(partial: Partial<PropertyUrlFilterState>) {
    setDraft((prev) => ({ ...prev, ...partial, stranka: 1 }));
  }

  function commit(next?: PropertyUrlFilterState) {
    const payload: PropertyUrlFilterState = {
      ...(next ?? draft),
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

  function onTabChange(tab: SearchContextTab) {
    const next: PropertyUrlFilterState = {
      ...draft,
      kontext: tab,
      razeni: tab === "doporucene" ? "recommended" : draft.razeni,
      stranka: 1,
    };
    setDraft(next);
    commit(next);
  }

  const filterBar = (
    <DiscoveryFilterBar
      draft={draft}
      applied={state}
      onChange={patch}
      onCommit={commit}
      resultCount={resultCount}
      layout={layout}
    />
  );

  if (layout === "sidebar") {
    return (
      <div className="properties-layout">
        {filterBar}
        <div className="properties-main">
          <FilterTabs
            value={draft.kontext ?? "doporucene"}
            onChange={onTabChange}
            className="border-[var(--prop-border,#DCE5E7)]"
          />
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filterBar}
      <FilterTabs value={draft.kontext ?? "doporucene"} onChange={onTabChange} />
      {children}
    </div>
  );
}
