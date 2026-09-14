/**
 * Internal lead value metrics — business reporting only (Prompt 13/9, Prompt 16 prep).
 * NEVER expose via user-facing DTOs or account UI.
 */

/** Basis points for internal commission estimate — configurable, not shown to users. */
export const INTERNAL_MORTGAGE_COMMISSION_BPS = 50;

export type InternalLeadValueMetrics = {
  estimatedLoanAmountCzk: number | null;
  estimatedCommissionCzk: number | null;
};

export function computeInternalLeadValueMetrics(input: {
  purchasePriceCzk?: number | null;
  availableEquityCzk?: number | null;
  explicitLoanAmountCzk?: number | null;
}): InternalLeadValueMetrics {
  let estimatedLoanAmountCzk: number | null = null;

  if (input.explicitLoanAmountCzk != null && input.explicitLoanAmountCzk > 0) {
    estimatedLoanAmountCzk = input.explicitLoanAmountCzk;
  } else if (
    input.purchasePriceCzk != null &&
    input.purchasePriceCzk > 0 &&
    input.availableEquityCzk != null &&
    input.availableEquityCzk >= 0
  ) {
    estimatedLoanAmountCzk = Math.max(
      0,
      input.purchasePriceCzk - input.availableEquityCzk,
    );
  }

  const estimatedCommissionCzk =
    estimatedLoanAmountCzk != null && estimatedLoanAmountCzk > 0
      ? Math.round(
          (estimatedLoanAmountCzk * INTERNAL_MORTGAGE_COMMISSION_BPS) / 10_000,
        )
      : null;

  return { estimatedLoanAmountCzk, estimatedCommissionCzk };
}

/**
 * Guard: strip internal CRM/value fields from objects before user API responses.
 */
export function stripInternalLeadFields<T extends Record<string, unknown>>(
  record: T,
): Omit<
  T,
  | "estimatedLoanAmountCzk"
  | "estimatedCommissionCzk"
  | "internalEstimatedLoanCzk"
  | "internalEstimatedCommissionCzk"
  | "valueMetricsUpdatedAt"
> {
  const {
    estimatedLoanAmountCzk: _a,
    estimatedCommissionCzk: _b,
    internalEstimatedLoanCzk: _c,
    internalEstimatedCommissionCzk: _d,
    valueMetricsUpdatedAt: _e,
    ...safe
  } = record;
  return safe;
}
