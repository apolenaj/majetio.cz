/**
 * Versioned International Risk Model packs.
 * Production packs must be reviewed; demo packs are isDemo=true only.
 */

import type { InternationalRiskModel } from "@/domains/risk/international/types";
import { assertNoAggregateRiskScore } from "@/domains/risk/international/types";

/** CZ production-orientational pack — facts only, no score. */
export const CZ_INTERNATIONAL_RISK_V2026_07: InternationalRiskModel = {
  marketCode: "CZ",
  version: "cz-risk.v2026.07",
  reviewedAt: "2026-07-01T00:00:00.000Z",
  reviewedBy: "ops-seed",
  isDemo: false,
  aggregateScore: null,
  disclaimerEn:
    "Multi-dimensional risk facts for orientation only — not a credit, legal, or investment score.",
  facts: [
    {
      code: "cz.legal.foreign_ownership.restricted_structures",
      dimension: "LEGAL",
      severity: "watch",
      titleEn: "Foreign ownership — structure-dependent",
      statementEn:
        "Some ownership forms (e.g. cooperative / agricultural) can restrict foreign buyers; verify title type with counsel.",
      evidence: {
        regulatoryRuleCodes: ["cz.foreign_ownership.default"],
        notesEn: "See RegulatoryRule FOREIGN_OWNERSHIP pack.",
      },
      reviewedAt: "2026-07-01T00:00:00.000Z",
      isDemo: false,
    },
    {
      code: "cz.currency.czk_local",
      dimension: "CURRENCY",
      severity: "info",
      titleEn: "Local currency CZK",
      statementEn:
        "Listings and mortgages are typically CZK-denominated; FX risk appears when buyer equity is in another currency.",
      evidence: {},
      reviewedAt: "2026-07-01T00:00:00.000Z",
      isDemo: false,
    },
    {
      code: "cz.financing.hypotekajasne_available",
      dimension: "FINANCING",
      severity: "info",
      titleEn: "Integrated mortgage partner (CZ)",
      statementEn:
        "HypotekaJasne handoff is available for CZ only after explicit named consent.",
      evidence: { notesEn: "FinancingProviderRegistry: hypotekajasne" },
      reviewedAt: "2026-07-01T00:00:00.000Z",
      isDemo: false,
    },
    {
      code: "cz.tax.vat_and_income_orientational",
      dimension: "TAX",
      severity: "watch",
      titleEn: "Tax treatment is case-specific",
      statementEn:
        "VAT on new-build and income tax on rental CF require adviser verification — Majetio estimates are not tax advice.",
      evidence: {},
      reviewedAt: "2026-07-01T00:00:00.000Z",
      isDemo: false,
    },
  ],
};

/**
 * AE research pack — isDemo where not counsel-verified.
 * Never invent production LTV/ownership as certain.
 */
export const AE_INTERNATIONAL_RISK_DEMO_V2026_07: InternationalRiskModel = {
  marketCode: "AE",
  version: "ae-risk.demo.v2026.07",
  reviewedAt: null,
  reviewedBy: null,
  isDemo: true,
  aggregateScore: null,
  disclaimerEn:
    "DEMO / research risk facts for UAE — not production legal guidance. Do not present as verified counsel opinion.",
  facts: [
    {
      code: "ae.legal.foreign_ownership.freehold_zones",
      dimension: "LEGAL",
      severity: "elevated",
      titleEn: "Foreign ownership restricted to designated areas",
      statementEn:
        "Non-GCC buyers are typically limited to designated freehold zones; leasehold and company structures differ by emirate.",
      evidence: {
        regulatoryRuleCodes: ["ae.foreign_ownership.freehold_zones"],
      },
      reviewedAt: null,
      isDemo: true,
    },
    {
      code: "ae.currency.aed_peg",
      dimension: "CURRENCY",
      severity: "info",
      titleEn: "AED listing currency",
      statementEn:
        "Property prices are AED-denominated; convert to home currency only via frozen FX snapshots for orientation.",
      evidence: {},
      reviewedAt: null,
      isDemo: true,
    },
    {
      code: "ae.financing.partner_unavailable",
      dimension: "FINANCING",
      severity: "elevated",
      titleEn: "No integrated Majetio mortgage partner",
      statementEn:
        "HypotekaJasne must not be used for AE. Financing status is unavailable / partner pending.",
      evidence: { notesEn: "FinancingProviderRegistry AE isolation" },
      reviewedAt: null,
      isDemo: true,
    },
    {
      code: "ae.market.offplan_prevalence",
      dimension: "MARKET",
      severity: "watch",
      titleEn: "Off-plan / payment-plan exposure",
      statementEn:
        "Primary new-build often uses developer payment plans — completion and escrow rules need local due diligence.",
      evidence: {},
      reviewedAt: null,
      isDemo: true,
    },
  ],
};

const PACKS: readonly InternationalRiskModel[] = [
  CZ_INTERNATIONAL_RISK_V2026_07,
  AE_INTERNATIONAL_RISK_DEMO_V2026_07,
];

export function listInternationalRiskModels(marketCode?: string): InternationalRiskModel[] {
  const code = marketCode?.toUpperCase();
  return PACKS.filter((p) => !code || p.marketCode === code);
}

export function resolveInternationalRiskModel(input: {
  marketCode: string;
  /** When false, demo packs are excluded. */
  allowDemo?: boolean;
  version?: string;
}): InternationalRiskModel | null {
  const market = input.marketCode.toUpperCase();
  const allowDemo = input.allowDemo ?? false;
  const candidates = PACKS.filter((p) => {
    if (p.marketCode !== market) return false;
    if (!allowDemo && p.isDemo) return false;
    if (input.version && p.version !== input.version) return false;
    return true;
  });
  const pack = candidates.find((p) => !p.isDemo) ?? candidates[0] ?? null;
  if (pack) assertNoAggregateRiskScore(pack);
  return pack;
}

/**
 * Build a presentation bundle — facts only.
 * Throws if caller tries to attach a numeric aggregate score.
 */
export function buildInternationalRiskPresentation(input: {
  marketCode: string;
  allowDemo?: boolean;
  /** Forbidden — kept to catch misuse at compile/runtime. */
  aggregateScore?: null;
}): InternationalRiskModel | null {
  if (input.aggregateScore != null) {
    throw new Error("aggregateScore must be null");
  }
  return resolveInternationalRiskModel({
    marketCode: input.marketCode,
    allowDemo: input.allowDemo,
  });
}
