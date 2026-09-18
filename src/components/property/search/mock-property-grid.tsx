import { PropertySearchEmptyState } from "@/components/property/search/property-search-empty";
import { PropertySearchResultsHeader } from "@/components/property/search/property-search-results";
import { PropertyCard } from "@/components/property/search/catalog-property-card";
import type { Property } from "@/lib/mock-properties";
import type { PropertyUrlFilterState } from "@/domains/properties/search/url-state";

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
    <div className="mt-6 space-y-6">
      <PropertySearchResultsHeader count={properties.length} sortLabel={sortLabel} />
      <p className="text-sm text-[var(--text-muted)]">
        Ukázkový katalog, ne živé nabídky z trhu. Štítek vybere jen inzeráty, které ho mají v poli
        štítků.
      </p>
      {properties.length === 0 ? (
        <PropertySearchEmptyState state={state} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
