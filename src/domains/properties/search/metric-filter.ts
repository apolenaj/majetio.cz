/**
 * A missing value is not a match when a bound is set.
 * Pass includeUnknown only for the explicit „Zahrnout i nabídky bez údajů“ choice.
 */
export function metricInRange(
  value: number | null | undefined,
  min: number | undefined,
  max: number | undefined,
  includeUnknown: boolean | undefined,
): boolean {
  const constrained = min != null || max != null;
  if (!constrained) return true;
  if (value == null || !Number.isFinite(value)) return includeUnknown === true;
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
