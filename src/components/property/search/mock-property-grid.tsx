import { CatalogBudgetList } from "@/components/property/search/catalog-budget-list";
import { PropertySearchEmptyState } from "@/components/property/search/property-search-empty";
import { PropertySearchResultsHeader } from "@/components/property/search/property-search-results";
import type { PropertyUrlFilterState } from "@/domains/properties/search/url-state";
import { type Property } from "@/lib/mock-properties";

export function MockPropertyGrid({
  properties,
  state,
  sortLabel,
}: {
  properties: Property[];
  state: PropertyUrlFilterState;
  sortLabel: string;
}) {
  return (
    <div className="mt-4 space-y-4">
      <PropertySearchResultsHeader count={properties.length} sortLabel={sortLabel} />
      <p className="text-sm text-[var(--text-muted)]">Ukázkový katalog, ne živé nabídky z trhu.</p>
      {state.cashflowOd != null || state.roiOd != null ? (
        <p className="text-sm text-[var(--text-secondary)]">
          Ukázky nemají doložené nájemné, proto je finanční filtr nevybere.
        </p>
      ) : null}
      {properties.length === 0 ? (
        <PropertySearchEmptyState state={state} />
      ) : (
        <CatalogBudgetList properties={properties} />
      )}
    </div>
  );
}
