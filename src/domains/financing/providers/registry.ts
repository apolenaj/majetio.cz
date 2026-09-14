/**
 * FinancingProviderRegistry (Prompt 17.4).
 * HypotekaJasne is CZ-only. Foreign markets must NOT inherit CZ mortgage rules.
 */

export const FINANCING_PROVIDER_KINDS = [
  "DIRECT_INTEGRATION",
  "PARTNER_HANDOFF",
  "MANUAL_ONLY",
  "UNAVAILABLE",
] as const;

export type FinancingProviderKind =
  (typeof FINANCING_PROVIDER_KINDS)[number];

export type FinancingProvider = {
  code: string;
  displayNameEn: string;
  /** Markets where this provider may be selected. */
  marketCodes: readonly string[];
  kind: FinancingProviderKind;
  /** True when Majetio can submit lead payloads. */
  leadHandoffEnabled: boolean;
  /** Mortgage calculator / rate pack id — null if unavailable. */
  ratePackId: string | null;
  /** Regulatory mortgage config version — CZ only today. */
  regulatoryConfigVersion: string | null;
  notesEn: string;
};

export const FINANCING_PROVIDERS: readonly FinancingProvider[] = [
  {
    code: "hypotekajasne",
    displayNameEn: "HypotekaJasne",
    marketCodes: ["CZ"],
    kind: "DIRECT_INTEGRATION",
    leadHandoffEnabled: true,
    ratePackId: "cz-mortgage-rates",
    regulatoryConfigVersion: "cz-mortgage-regulatory.v2026.07",
    notesEn: "Primary CZ mortgage partner — never route non-CZ leads here.",
  },
  {
    code: "ae_partner_tbd",
    displayNameEn: "UAE mortgage partner (TBD)",
    marketCodes: ["AE"],
    kind: "PARTNER_HANDOFF",
    leadHandoffEnabled: false,
    ratePackId: null,
    regulatoryConfigVersion: null,
    notesEn: "Placeholder — AE must not use HypotekaJasne or CZ LTV rules.",
  },
  {
    code: "manual_advisor",
    displayNameEn: "Manual advisor handoff",
    marketCodes: ["*"],
    kind: "MANUAL_ONLY",
    leadHandoffEnabled: false,
    ratePackId: null,
    regulatoryConfigVersion: null,
    notesEn: "Fallback when no integrated provider exists for the market.",
  },
] as const;

export type FinancingProviderResolution = {
  marketCode: string;
  provider: FinancingProvider | null;
  status: "READY" | "PARTNER_PENDING" | "UNAVAILABLE";
  reason: string;
  /** Explicit: CZ mortgage regulatory pack must not apply off-market. */
  inheritsCzMortgageRules: false;
};

export function listFinancingProvidersForMarket(
  marketCode: string,
): FinancingProvider[] {
  const code = marketCode.toUpperCase();
  return FINANCING_PROVIDERS.filter(
    (p) =>
      p.marketCodes.includes(code) ||
      (p.marketCodes.includes("*") &&
        !FINANCING_PROVIDERS.some(
          (x) =>
            x.code !== p.code &&
            x.marketCodes.includes(code) &&
            x.kind !== "MANUAL_ONLY",
        )),
  );
}

export function resolveFinancingProvider(
  marketCode: string,
): FinancingProviderResolution {
  const code = marketCode.toUpperCase();
  const specific = FINANCING_PROVIDERS.find(
    (p) => p.marketCodes.includes(code) && p.code !== "manual_advisor",
  );

  if (specific?.leadHandoffEnabled) {
    return {
      marketCode: code,
      provider: specific,
      status: "READY",
      reason: `${specific.displayNameEn} ready for ${code}.`,
      inheritsCzMortgageRules: false,
    };
  }

  if (specific && specific.kind === "PARTNER_HANDOFF") {
    return {
      marketCode: code,
      provider: specific,
      status: "PARTNER_PENDING",
      reason: specific.notesEn,
      inheritsCzMortgageRules: false,
    };
  }

  const manual = FINANCING_PROVIDERS.find((p) => p.code === "manual_advisor")!;
  return {
    marketCode: code,
    provider: code === "CZ" ? null : manual,
    status: "UNAVAILABLE",
    reason:
      code === "CZ"
        ? "No financing provider resolved for CZ (misconfiguration)."
        : `No integrated financing provider for ${code} — CZ HypotekaJasne must not be used.`,
    inheritsCzMortgageRules: false,
  };
}

/**
 * Lead routing decision shaped for existing mortgage lead pipeline.
 * Non-CZ markets never return hypotekajasne.
 */
export function resolveFinancingLeadRouting(input: {
  marketCode?: string;
  propertyType?: string | null;
  /** Major units in market currency (legacy: CZK major for CZ). */
  estimatedLoanAmountMajor?: number | null;
}): {
  marketCountry: string;
  partner: string;
  routingRuleKey: string;
  reason: string;
  handoffAllowed: boolean;
  /** Explicit unavailable when market has no financing integration. */
  status: "READY" | "PARTNER_PENDING" | "UNAVAILABLE";
} {
  const marketCode = (input.marketCode ?? "CZ").toUpperCase();
  const resolved = resolveFinancingProvider(marketCode);

  if (marketCode === "CZ" && resolved.provider?.code === "hypotekajasne") {
    if (
      input.estimatedLoanAmountMajor != null &&
      input.estimatedLoanAmountMajor >= 15_000_000
    ) {
      return {
        marketCountry: "CZ",
        partner: "hypotekajasne",
        routingRuleKey: "cz-high-loan-hypotekajasne",
        reason: "ČR — vyšší objem úvěru, HypotekaJasne.",
        handoffAllowed: true,
        status: "READY",
      };
    }
    if (input.propertyType === "COMMERCIAL") {
      return {
        marketCountry: "CZ",
        partner: "hypotekajasne",
        routingRuleKey: "cz-commercial-hypotekajasne",
        reason: "ČR — komerční nemovitost, HypotekaJasne.",
        handoffAllowed: true,
        status: "READY",
      };
    }
    return {
      marketCountry: "CZ",
      partner: "hypotekajasne",
      routingRuleKey: "cz-default-hypotekajasne",
      reason: "Výchozí směrování pro český trh (HypotekaJasne).",
      handoffAllowed: true,
      status: "READY",
    };
  }

  // Hard isolation: HypotekaJasne never appears for non-CZ.
  if (resolved.provider?.code === "hypotekajasne") {
    throw new Error("HypotekaJasne must not resolve outside CZ.");
  }

  return {
    marketCountry: marketCode,
    partner: resolved.provider?.code ?? "none",
    routingRuleKey: `no-handoff-${marketCode.toLowerCase()}`,
    reason: resolved.reason,
    handoffAllowed: false,
    status:
      resolved.status === "PARTNER_PENDING" ? "PARTNER_PENDING" : "UNAVAILABLE",
  };
}

/** Guard used by lead pipelines — throws if non-CZ tries HypotekaJasne. */
export function assertHypotekaJasneCzOnly(input: {
  marketCode: string;
  partnerCode: string;
}): void {
  if (
    input.partnerCode.toLowerCase() === "hypotekajasne" &&
    input.marketCode.toUpperCase() !== "CZ"
  ) {
    throw new Error(
      "HypotekaJasne is CZ-only — refusing cross-market financing leakage.",
    );
  }
}
