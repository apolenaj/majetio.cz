/**
 * Czech labels for property identity fields (Prompt 9 Part 1).
 */

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Byt",
  HOUSE: "Dům",
  LAND: "Pozemek",
  COMMERCIAL: "Komerční",
  OTHER: "Jiné",
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: "Novostavba",
  EXCELLENT: "Výborný",
  GOOD: "Dobrý",
  AVERAGE: "Průměrný",
  NEEDS_RENOVATION: "K rekonstrukci",
  SHELL: "Holostav",
  UNKNOWN: "Neuvedeno",
};

const OWNERSHIP_LABELS: Record<string, string> = {
  PERSONAL: "Osobní",
  COOPERATIVE: "Družstevní",
  MUNICIPAL: "Obecní",
  COMPANY: "Firemní",
  OTHER: "Jiné",
  UNKNOWN: "Neuvedeno",
};

export function propertyTypeLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return PROPERTY_TYPE_LABELS[value] ?? value;
}

export function conditionLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return CONDITION_LABELS[value] ?? value;
}

export function ownershipLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return OWNERSHIP_LABELS[value] ?? value;
}

export function energyLabel(value: string | null | undefined): string {
  if (!value || value === "UNKNOWN") return "—";
  return value;
}

export function floorLabel(
  floor: number | null | undefined,
  floorsTotal: number | null | undefined,
): string {
  if (floor == null && floorsTotal == null) return "—";
  if (floor != null && floorsTotal != null) return `${floor}. / ${floorsTotal}`;
  if (floor != null) return `${floor}.`;
  return `z ${floorsTotal}`;
}

export function elevatorLabel(hasElevator: boolean | null | undefined): string {
  if (hasElevator == null) return "—";
  return hasElevator ? "Ano" : "Ne";
}

export function areaLabel(
  usableArea: number | null | undefined,
  usableAreaDisplay: string | null | undefined,
): string {
  if (usableAreaDisplay) return usableAreaDisplay;
  if (usableArea != null) return `${usableArea} m²`;
  return "—";
}
