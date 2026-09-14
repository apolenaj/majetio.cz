/**
 * Tax Provider Config — market / tax-region VAT & sales tax (Rules 188–189).
 * Not hardcoded in checkout UI; resolved from versioned config.
 */

export type TaxProviderKind = "VAT" | "SALES_TAX" | "NONE" | "UNAVAILABLE";

export type TaxProviderConfig = {
  /** Stable id, e.g. cz-vat-standard.v2026.07 */
  id: string;
  version: string;
  /** Market registry code. */
  marketCode: string;
  /**
   * Tax region within market (e.g. CZ, AE-DXB, ES-MAD).
   * Plans and invoices pin this — not invent at display time.
   */
  taxRegion: string;
  kind: TaxProviderKind;
  /** Standard rate in basis points (2100 = 21%). Null when UNAVAILABLE. */
  standardRateBp: number | null;
  /** Reduced rate when applicable. */
  reducedRateBp: number | null;
  currency: string;
  /** Inclusive list pricing (common in B2C EU). */
  pricesIncludeTax: boolean;
  notesEn: string;
  validFrom: string;
  validTo: string | null;
};

export const TAX_PROVIDER_CONFIGS: readonly TaxProviderConfig[] = [
  {
    id: "cz-vat-standard.v2026.07",
    version: "2026.07",
    marketCode: "CZ",
    taxRegion: "CZ",
    kind: "VAT",
    standardRateBp: 2100,
    reducedRateBp: 1200,
    currency: "CZK",
    pricesIncludeTax: true,
    notesEn: "Czech standard VAT for digital/services B2C (orientational).",
    validFrom: "2026-07-01",
    validTo: null,
  },
  {
    id: "ae-vat-standard.v2026.07",
    version: "2026.07",
    marketCode: "AE",
    taxRegion: "AE",
    kind: "VAT",
    standardRateBp: 500,
    reducedRateBp: null,
    currency: "AED",
    pricesIncludeTax: true,
    notesEn: "UAE VAT 5% — confirm product taxability before charging.",
    validFrom: "2026-07-01",
    validTo: null,
  },
  {
    id: "es-vat-standard.v2026.07",
    version: "2026.07",
    marketCode: "ES",
    taxRegion: "ES",
    kind: "VAT",
    standardRateBp: 2100,
    reducedRateBp: 1000,
    currency: "EUR",
    pricesIncludeTax: true,
    notesEn: "Spain standard VAT — OSS rules may apply for cross-border B2C.",
    validFrom: "2026-07-01",
    validTo: null,
  },
  {
    id: "sk-vat-standard.v2026.07",
    version: "2026.07",
    marketCode: "SK",
    taxRegion: "SK",
    kind: "VAT",
    standardRateBp: 2300,
    reducedRateBp: 1000,
    currency: "EUR",
    pricesIncludeTax: true,
    notesEn: "Slovak VAT — local list prices in EUR, not FX of CZK plans.",
    validFrom: "2026-07-01",
    validTo: null,
  },
] as const;

export function resolveTaxProviderConfig(input: {
  marketCode: string;
  taxRegion?: string | null;
  asOf?: Date;
}): TaxProviderConfig | null {
  const market = input.marketCode.toUpperCase();
  const region = (input.taxRegion ?? market).toUpperCase();
  const asOf = input.asOf ?? new Date();
  const asOfMs = asOf.getTime();

  const matches = TAX_PROVIDER_CONFIGS.filter((c) => {
    if (c.marketCode !== market) return false;
    if (c.taxRegion.toUpperCase() !== region) return false;
    if (Date.parse(c.validFrom) > asOfMs) return false;
    if (c.validTo && Date.parse(c.validTo) <= asOfMs) return false;
    return true;
  });

  return matches[0] ?? null;
}

export function requireTaxProviderConfig(input: {
  marketCode: string;
  taxRegion?: string | null;
  asOf?: Date;
}): TaxProviderConfig {
  const cfg = resolveTaxProviderConfig(input);
  if (!cfg || cfg.kind === "UNAVAILABLE" || cfg.standardRateBp == null) {
    throw new Error(
      `Tax provider unavailable for market ${input.marketCode} / region ${input.taxRegion ?? input.marketCode}.`,
    );
  }
  return cfg;
}

/** VAT rate for a plan — from tax provider, never hardcoded in UI. */
export function vatRateBpForPlan(input: {
  marketCode: string;
  taxRegion?: string | null;
}): number {
  const cfg = resolveTaxProviderConfig(input);
  if (!cfg?.standardRateBp) {
    // Fail closed to market default CZ only when market is CZ
    if (input.marketCode.toUpperCase() === "CZ") return 2100;
    throw new Error(
      `No VAT rate configured for ${input.marketCode} — refuse silent FX/VAT guess.`,
    );
  }
  return cfg.standardRateBp;
}
