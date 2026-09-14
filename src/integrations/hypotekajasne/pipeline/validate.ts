import { externalMortgageOfferSchema } from "../schemas";
import type { ExternalMortgageOffer } from "../schemas";
import type { RateAnomaly } from "./types";

export type ValidateResult = {
  valid: ExternalMortgageOffer[];
  invalid: Array<{ raw: unknown; error: string }>;
  anomalies: RateAnomaly[];
};

export function validateExternalOffers(
  offers: unknown[],
): ValidateResult {
  const valid: ExternalMortgageOffer[] = [];
  const invalid: ValidateResult["invalid"] = [];
  const anomalies: RateAnomaly[] = [];

  for (const raw of offers) {
    const parsed = externalMortgageOfferSchema.safeParse(raw);
    if (!parsed.success) {
      invalid.push({
        raw,
        error: parsed.error.message,
      });
      continue;
    }

    const offer = parsed.data;
    valid.push(offer);

    if (
      offer.rates.aprFromPct != null &&
      offer.rates.aprFromPct < offer.rates.interestFromPct
    ) {
      anomalies.push({
        code: "apr_below_interest",
        severity: "critical",
        message: "RPSN je nižší než úroková sazba — vyžaduje kontrolu.",
        offerKey: offer.externalId,
      });
    }

    if (offer.rates.fixationYears == null) {
      anomalies.push({
        code: "missing_fixation",
        severity: "warning",
        message: "Chybí délka fixace.",
        offerKey: offer.externalId,
      });
    }

    if (offer.ltv?.maxPct != null && offer.ltv.maxPct > 100) {
      anomalies.push({
        code: "invalid_ltv",
        severity: "critical",
        message: "LTV limit přesahuje 100 %.",
        offerKey: offer.externalId,
      });
    }
  }

  return { valid, invalid, anomalies };
}
