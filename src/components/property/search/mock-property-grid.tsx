"use client";

import { CatalogBudgetList } from "@/components/property/search/catalog-budget-list";
import { PropertyBudgetPanel } from "@/components/property/search/property-budget-panel";
import { PropertyResultsToolbar } from "@/components/property/search/property-results-toolbar";
import { PropertySearchEmptyState } from "@/components/property/search/property-search-empty";
import type { PropertyUrlFilterState } from "@/domains/properties/search/url-state";
import { type Property } from "@/lib/mock-properties";
import * as React from "react";

export function MockPropertyGrid({
  properties,
  state,
  sortLabel,
}: {
  properties: Property[];
  state: PropertyUrlFilterState;
  sortLabel: string;
}) {
  const [view, setView] = React.useState<"grid" | "list">("grid");
  void sortLabel;

  return (
    <div className="space-y-5">
      <PropertyBudgetPanel />
      <PropertyResultsToolbar
        count={properties.length}
        state={state}
        view={view}
        onViewChange={setView}
      />
      <p className="text-sm text-[var(--prop-muted,#667A86)]">
        Ukázkový katalog, ne živé nabídky z trhu.
      </p>
      {state.cashflowOd != null || state.roiOd != null ? (
        <p className="text-sm text-[var(--text-secondary)]">
          Ukázky nemají doložené nájemné, proto je finanční filtr nevybere.
        </p>
      ) : null}
      {properties.length === 0 ? (
        <PropertySearchEmptyState state={state} />
      ) : (
        <CatalogBudgetList
          properties={properties}
          hideBudgetForm
          listLayout={view === "list"}
        />
      )}
    </div>
  );
}
