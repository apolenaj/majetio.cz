import type { CompareResult, NormalizedOfferDraft, RateAnomaly } from "./types";

/** Default threshold — rate jump in percentage points triggers review. */
export const RATE_JUMP_THRESHOLD_PP = 2;

export function detectRateAnomalies(input: {
  offers: NormalizedOfferDraft[];
  comparisons: CompareResult[];
  thresholdPp?: number;
}): RateAnomaly[] {
  const threshold = input.thresholdPp ?? RATE_JUMP_THRESHOLD_PP;
  const anomalies: RateAnomaly[] = [];

  for (const comparison of input.comparisons) {
    if (
      comparison.deltaPp != null &&
      Math.abs(comparison.deltaPp) >= threshold
    ) {
      anomalies.push({
        code: "rate_jump",
        severity: "critical",
        message: `Sazba se změnila o ${comparison.deltaPp} p.b. — vyžaduje kontrolu.`,
        offerKey: comparison.offerKey,
      });
    }
  }

  for (const offer of input.offers) {
    anomalies.push(...offer.anomalies);

    if (offer.aprFrom == null) {
      anomalies.push({
        code: "missing_apr",
        severity: "warning",
        message: "Chybí RPSN / APR.",
        offerKey: offer.dedupeKey,
      });
    }
  }

  const unique = new Map<string, RateAnomaly>();
  for (const a of anomalies) {
    unique.set(`${a.offerKey}:${a.code}`, a);
  }

  return [...unique.values()];
}

export function applyAnomalyStatus(
  offers: NormalizedOfferDraft[],
  anomalies: RateAnomaly[],
): NormalizedOfferDraft[] {
  const criticalKeys = new Set(
    anomalies
      .filter(
        (a) =>
          a.severity === "critical" ||
          a.code === "apr_below_interest" ||
          a.code === "missing_fixation" ||
          a.code === "rate_jump",
      )
      .map((a) => a.offerKey),
  );

  return offers.map((offer) => {
    const flagged =
      criticalKeys.has(offer.dedupeKey) ||
      criticalKeys.has(offer.externalId ?? "");
    if (!flagged) {
      return offer;
    }
    return {
      ...offer,
      status: "review_required" as const,
    };
  });
}
