/**
 * HypotekaJasne outbound URL builder — no PII, consistent UTM + financing context.
 */

import { FINANCING_ASSUMPTIONS } from "@/config/financing-assumptions";
import { sanitizeUtmValue } from "@/lib/analytics/utm";

export const HYPOTEKAJASNE_BASE_URL = "https://www.hypotekajasne.cz";

export type HypotekaJasneLinkContext =
  | "property_detail"
  | "calculator"
  | "foreign_property"
  | "tools"
  | "homepage";

export type BuildHypotekaJasneFinancingUrlInput = {
  propertyPriceCzk?: number | null;
  ownFundsCzk?: number | null;
  loanAmountCzk?: number | null;
  termYears?: number | null;
  ratePp?: number | null;
  propertyUrl?: string | null;
  country?: string | null;
  currency?: string | null;
  sourceContext?: HypotekaJasneLinkContext;
};

function asInt(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null;
  return String(Math.round(value));
}

/**
 * Deep-link target: HypotekaJasne root with safe financing context.
 * Partner product pages live under /produkty/{slug} for offer terms;
 * generic financing CTA uses the homepage until a richer public path exists.
 */
export function buildHypotekaJasneFinancingUrl(
  input: BuildHypotekaJasneFinancingUrlInput = {},
): string {
  const url = new URL(HYPOTEKAJASNE_BASE_URL);
  const context = input.sourceContext ?? "property_detail";

  const pairs: Array<[string, string | null]> = [
    ["cena", asInt(input.propertyPriceCzk)],
    ["vlastniZdroje", asInt(input.ownFundsCzk)],
    ["uver", asInt(input.loanAmountCzk)],
    ["splatnost", asInt(input.termYears)],
    [
      "sazba",
      input.ratePp != null && Number.isFinite(input.ratePp)
        ? String(Number(input.ratePp.toFixed(2)))
        : String(FINANCING_ASSUMPTIONS.referenceMortgageRatePp),
    ],
    ["source", "majetio"],
    ["utm_source", "majetio"],
    ["utm_medium", "referral"],
    ["utm_campaign", "property_financing"],
    ["utm_content", context],
  ];

  if (input.country) {
    pairs.push(["country", sanitizeUtmValue(input.country)]);
  }
  if (input.currency) {
    pairs.push(["currency", sanitizeUtmValue(input.currency)]);
  }
  if (input.propertyUrl) {
    const clean = sanitizePropertyUrl(input.propertyUrl);
    if (clean) pairs.push(["propertyUrl", clean]);
  }

  for (const [key, value] of pairs) {
    if (value) url.searchParams.set(key, value);
  }

  return url.toString();
}

function sanitizePropertyUrl(raw: string): string | null {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    // Strip hash/query that might hold PII; keep path only for attribution.
    return `${parsed.origin}${parsed.pathname}`.slice(0, 300);
  } catch {
    return null;
  }
}
