/**
 * HypotekaJasne outbound URL builder — aligned with HJ mortgage-journey params.
 * No PII. Calculator: /kalkulacky/hypotecni · Compare rates: /sazby
 */

import { FINANCING_ASSUMPTIONS } from "@/config/financing-assumptions";
import { sanitizeUtmValue } from "@/lib/analytics/utm";

export const HYPOTEKAJASNE_BASE_URL = "https://www.hypotekajasne.cz";

/** Deep-link targets on HypotekaJasne (must match live routes). */
export const HYPOTEKAJASNE_PATHS = {
  calculator: "/kalkulacky/hypotecni",
  compare: "/sazby",
} as const;

export type HypotekaJasneLinkContext =
  | "property_detail"
  | "calculator"
  | "foreign_property"
  | "tools"
  | "homepage";

export type HypotekaJasneDestination = "calculator" | "compare";

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
  /** calculator = hypoteční kalkulačka; compare = porovnání sazeb */
  destination?: HypotekaJasneDestination;
};

function asInt(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null;
  return String(Math.round(value));
}

function asRate(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null;
  return String(Number(value.toFixed(2)));
}

/**
 * Build HypotekaJasne deep-link using the partner mortgage-journey URL contract:
 * property, loan, equity, termYears, modelRate (+ UTM).
 */
export function buildHypotekaJasneFinancingUrl(
  input: BuildHypotekaJasneFinancingUrlInput = {},
): string {
  const destination = input.destination ?? "compare";
  const path =
    destination === "calculator"
      ? HYPOTEKAJASNE_PATHS.calculator
      : HYPOTEKAJASNE_PATHS.compare;
  const url = new URL(path, HYPOTEKAJASNE_BASE_URL);
  const context = input.sourceContext ?? "property_detail";

  const price = asInt(input.propertyPriceCzk);
  const ownFunds = asInt(input.ownFundsCzk);
  const loan = asInt(input.loanAmountCzk);
  const term = asInt(input.termYears);
  const rate =
    asRate(input.ratePp) ??
    asRate(FINANCING_ASSUMPTIONS.referenceMortgageRatePp);

  // Canonical HJ journey keys (parsed by parseMortgageJourneyParams).
  const pairs: Array<[string, string | null]> = [
    ["purpose", "purchase"],
    ["property", price],
    ["equity", ownFunds],
    ["loan", loan],
    ["termYears", term],
    ["modelRate", rate],
    ["source", "majetio"],
    ["utm_source", "majetio"],
    ["utm_medium", "referral"],
    ["utm_campaign", "property_financing"],
    ["utm_content", context],
  ];

  // Friendly aliases for documentation / older Majetio links.
  if (price) {
    pairs.push(["price", price], ["cena", price]);
  }
  if (ownFunds) {
    pairs.push(["ownFunds", ownFunds], ["vlastniZdroje", ownFunds]);
  }
  if (loan) {
    pairs.push(["uver", loan]);
  }
  if (term) {
    pairs.push(["term", term], ["splatnost", term]);
  }
  if (rate) {
    pairs.push(["rate", rate], ["sazba", rate]);
  }

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
    return `${parsed.origin}${parsed.pathname}`.slice(0, 300);
  } catch {
    return null;
  }
}
