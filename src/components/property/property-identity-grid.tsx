import type { PublicPropertyDto } from "@/domains/properties/service/dto";
import {
  areaLabel,
  conditionLabel,
  elevatorLabel,
  energyLabel,
  floorLabel,
  ownershipLabel,
  propertyTypeLabel,
} from "@/domains/properties/service/identity-labels";

function IdentityCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3">
      <dt className="text-[var(--text-caption)] text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-[var(--text-primary)]">
        {value}
      </dd>
    </div>
  );
}

export function PropertyIdentityGrid({
  property,
}: {
  property: PublicPropertyDto;
}) {
  const locationBits = [
    property.location.addressLine,
    property.location.district,
    property.location.city,
  ].filter(Boolean);

  const locationValue =
    property.location.precision === "HIDDEN"
      ? property.location.city
        ? `${property.location.city} (přesná adresa skrytá)`
        : "Lokalita skrytá"
      : locationBits.join(", ") || property.location.label || "—";

  const cells = [
    { label: "Typ", value: propertyTypeLabel(property.propertyType) },
    { label: "Dispozice", value: property.layout ?? "—" },
    { label: "Lokalita", value: locationValue },
    {
      label: "Plocha",
      value: areaLabel(property.usableArea, property.usableAreaDisplay),
    },
    { label: "Stav", value: conditionLabel(property.condition) },
    { label: "Vlastnictví", value: ownershipLabel(property.ownershipType) },
    {
      label: "Patro",
      value: floorLabel(property.floor, property.floorsTotal),
    },
    { label: "Výtah", value: elevatorLabel(property.hasElevator) },
    { label: "PENB", value: energyLabel(property.energyRating) },
  ];

  return (
    <section aria-labelledby="property-identity-heading">
      <h2
        id="property-identity-heading"
        className="font-display text-xl text-[var(--text-primary)]"
      >
        Základní údaje
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cells.map((cell) => (
          <IdentityCell key={cell.label} label={cell.label} value={cell.value} />
        ))}
      </dl>
    </section>
  );
}
