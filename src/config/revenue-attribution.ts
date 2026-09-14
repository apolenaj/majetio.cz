/**
 * B2B lead monetization + revenue attribution config.
 * MODE A = Pay Per Lead; MODE B = Success fee from broker commission.
 */

export const DEFAULT_ATTRIBUTION_WINDOW_DAYS = 30;

/** Default MODE A price: 499 Kč gross (haléře). */
export const DEFAULT_PAY_PER_LEAD_PRICE_MINOR = 49_900;

/** Default MODE B: 10% of broker commission. */
export const DEFAULT_SUCCESS_FEE_BPS = 1_000;

export const revenueAttributionConfig = {
  defaultAttributionWindowDays: DEFAULT_ATTRIBUTION_WINDOW_DAYS,
  defaultPayPerLeadPriceMinor: DEFAULT_PAY_PER_LEAD_PRICE_MINOR,
  defaultSuccessFeeBps: DEFAULT_SUCCESS_FEE_BPS,
  /**
   * Competing sources with distinct sourceKey inside the window
   * force MULTI_SOURCE_REVIEW (no auto primary pick).
   */
  multiSourceRequiresManualReview: true,
  /**
   * Opening a dispute without evidence keeps the lead billable
   * and moves dispute to EVIDENCE_REQUIRED.
   */
  disputeRequiresEvidenceToInvalidate: true,
} as const;

export function computeSuccessFeeAmountMinor(
  brokerCommissionGrossMinor: number,
  feeBps: number,
): number {
  if (brokerCommissionGrossMinor <= 0 || feeBps <= 0) return 0;
  return Math.round((brokerCommissionGrossMinor * feeBps) / 10_000);
}

export function revenueIdempotencyKey(
  sourceType: string,
  sourceEntityId: string,
): string {
  return `${sourceType.toLowerCase()}:${sourceEntityId}`;
}
