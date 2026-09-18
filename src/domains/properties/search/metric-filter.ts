/**
 * Investment metric bounds.
 * A missing value does not fail the filter unless the user asked for computed data only.
 */

export function metricInRange(
  value: number | null | undefined,
  min: number | undefined,
  max: number | undefined,
  onlyComputed: boolean | undefined,
): boolean {
  const constrained = min != null || max != null;
  if (!constrained) return true;
  if (value == null || !Number.isFinite(value)) return onlyComputed !== true;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

export function hasComputedInvestmentData(input: {
  grossYieldPct?: number | null;
  netYieldPct?: number | null;
  cashFlowMonthlyCzk?: number | null;
  majetioScore?: number | null;
  estimatedRentMonthlyCzk?: number | null;
  hasInvestmentSnapshot?: boolean | null;
}): boolean {
  return (
    input.hasInvestmentSnapshot === true ||
    input.grossYieldPct != null ||
    input.netYieldPct != null ||
    input.cashFlowMonthlyCzk != null ||
    input.estimatedRentMonthlyCzk != null ||
    input.majetioScore != null
  );
}
