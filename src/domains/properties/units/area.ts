/**
 * Centralized area unit conversion (Prompt 17.3 + Rules 155–157).
 * Canonical storage unit: square metres (m²).
 * Never convert ad-hoc in React components — call these helpers.
 */

export type AreaUnit = "sqm" | "sqft";

/** Exact factor: 1 m² = 10.76391041671 sq ft (international). */
export const SQM_TO_SQFT = 10.76391041671;

export class AreaConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AreaConversionError";
  }
}

function assertFiniteNonNegative(amount: number, label: string): void {
  if (!Number.isFinite(amount)) {
    throw new AreaConversionError(`${label} must be a finite number.`);
  }
  if (amount < 0) {
    throw new AreaConversionError(`${label} must not be negative.`);
  }
}

export function sqmToSqft(sqm: number): number {
  assertFiniteNonNegative(sqm, "sqm");
  return sqm * SQM_TO_SQFT;
}

export function sqftToSqm(sqft: number): number {
  assertFiniteNonNegative(sqft, "sqft");
  return sqft / SQM_TO_SQFT;
}

/**
 * Normalize any display/input amount into canonical sqm for persistence / analytics.
 */
export function toCanonicalSqm(amount: number, unit: AreaUnit): number {
  assertFiniteNonNegative(amount, "area amount");
  if (unit !== "sqm" && unit !== "sqft") {
    throw new AreaConversionError(`Unsupported area unit: ${String(unit)}`);
  }
  return unit === "sqm" ? amount : sqftToSqm(amount);
}

/**
 * Convert canonical sqm into the unit preferred by a market for display/input.
 */
export function fromCanonicalSqm(sqm: number, unit: AreaUnit): number {
  assertFiniteNonNegative(sqm, "canonical sqm");
  if (unit !== "sqm" && unit !== "sqft") {
    throw new AreaConversionError(`Unsupported area unit: ${String(unit)}`);
  }
  return unit === "sqm" ? sqm : sqmToSqft(sqm);
}

/**
 * Round-trip safe conversion with explicit precision (avoids UI float noise).
 * Returns canonical sqm after converting through display unit.
 */
export function roundTripCanonicalSqm(
  amount: number,
  unit: AreaUnit,
  digits = 4,
): number {
  const canonical = toCanonicalSqm(amount, unit);
  const display = fromCanonicalSqm(canonical, unit);
  const factor = 10 ** digits;
  const roundedDisplay = Math.round(display * factor) / factor;
  return toCanonicalSqm(roundedDisplay, unit);
}

export function formatAreaValue(
  sqm: number,
  unit: AreaUnit,
  options?: { maximumFractionDigits?: number },
): { value: number; unit: AreaUnit; label: string } {
  const digits = options?.maximumFractionDigits ?? (unit === "sqft" ? 0 : 0);
  const value =
    Math.round(fromCanonicalSqm(sqm, unit) * 10 ** digits) / 10 ** digits;
  const label = unit === "sqm" ? `${value} m²` : `${value} sq ft`;
  return { value, unit, label };
}

/** Price per area — amountMajor / area in the *display* unit. */
export function pricePerDisplayArea(input: {
  priceMajor: number;
  areaSqm: number;
  displayUnit: AreaUnit;
}): number {
  const area = fromCanonicalSqm(input.areaSqm, input.displayUnit);
  if (area <= 0) return 0;
  return input.priceMajor / area;
}
