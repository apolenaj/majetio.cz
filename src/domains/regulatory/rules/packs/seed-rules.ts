import type { RegulatoryRule } from "@/domains/regulatory/rules/types";

/** CZ regulatory seed pack — orientational only, not legal advice. */
export const CZ_REGULATORY_RULES_V2026_07: readonly RegulatoryRule[] = [
  {
    code: "cz.foreign_ownership.default",
    marketCode: "CZ",
    kind: "FOREIGN_OWNERSHIP",
    version: "cz-reg.v2026.07",
    status: "ACTIVE",
    validFrom: "2026-07-01",
    validTo: null,
    verifiedAt: "2026-07-01T00:00:00.000Z",
    verifiedBy: "ops-seed",
    titleEn: "Foreign ownership (Czech Republic)",
    summaryEn:
      "EU/EEA and many non-EU buyers may acquire residential property; specific structures (agricultural land, cooperatives) can differ. Orientational only.",
    payload: {
      foreignersMayOwn: "RESTRICTED",
      notesEn: "Verify title form (osobní vs družstevní) and buyer residency with counsel.",
      certainty: "ORIENTATIONAL",
    },
    requiresLegalVerificationNotice: true,
    isDemo: false,
  },
  {
    code: "cz.ltv.reference",
    marketCode: "CZ",
    kind: "LTV_LIMIT",
    version: "cz-reg.v2026.07",
    status: "ACTIVE",
    validFrom: "2026-07-01",
    validTo: null,
    verifiedAt: "2026-07-01T00:00:00.000Z",
    verifiedBy: "ops-seed",
    titleEn: "Reference LTV limits (CZ)",
    summaryEn: "Market reference LTV ceilings — not a credit decision.",
    payload: {
      maxLtvPctPrimaryResidence: 90,
      maxLtvPctInvestment: 80,
      notesEn: "Aligns with CZ mortgage regulatory catalog — bank-specific.",
    },
    requiresLegalVerificationNotice: true,
    isDemo: false,
  },
  {
    code: "cz.str.default",
    marketCode: "CZ",
    kind: "SHORT_TERM_RENTAL",
    version: "cz-reg.v2026.07",
    status: "ACTIVE",
    validFrom: "2026-07-01",
    validTo: null,
    verifiedAt: "2026-07-01T00:00:00.000Z",
    verifiedBy: "ops-seed",
    titleEn: "Short-term rental (CZ)",
    summaryEn: "Municipal and SVJ rules often restrict STR — verify locally.",
    payload: {
      permitted: "RESTRICTED",
      licenseRequired: null,
      notesEn: "City ordinances + building HOA (SVJ) may ban or limit STR.",
    },
    requiresLegalVerificationNotice: true,
    isDemo: false,
  },
  {
    code: "cz.disclaimer.purchase",
    marketCode: "CZ",
    kind: "DISCLAIMER",
    version: "cz-reg.v2026.07",
    status: "ACTIVE",
    validFrom: "2026-07-01",
    validTo: null,
    verifiedAt: "2026-07-01T00:00:00.000Z",
    verifiedBy: "ops-seed",
    titleEn: "Purchase eligibility disclaimer",
    summaryEn: "Majetio never asserts certain purchase eligibility.",
    payload: {
      forbidsCertainPurchaseClaim: true,
    },
    requiresLegalVerificationNotice: true,
    isDemo: false,
  },
] as const;

/**
 * AE research pack — isDemo until counsel verifies.
 * Never promote unverified rules to production (isDemo=false) without review.
 */
export const AE_REGULATORY_RULES_V2026_07: readonly RegulatoryRule[] = [
  {
    code: "ae.foreign_ownership.freehold_zones",
    marketCode: "AE",
    kind: "FOREIGN_OWNERSHIP",
    version: "ae-reg.demo.v2026.07",
    status: "ACTIVE",
    validFrom: "2026-07-01",
    validTo: null,
    verifiedAt: null,
    verifiedBy: null,
    titleEn: "Foreign ownership (UAE / emirate-dependent)",
    summaryEn:
      "Non-GCC ownership is typically limited to designated freehold areas; leasehold and company structures differ by emirate. Research pack — not verified counsel opinion.",
    payload: {
      foreignersMayOwn: "RESTRICTED",
      notesEn: "Dubai vs Abu Dhabi packs differ. Never claim 'you can buy'.",
      certainty: "ORIENTATIONAL",
    },
    requiresLegalVerificationNotice: true,
    isDemo: true,
  },
  {
    code: "ae.ltv.reference",
    marketCode: "AE",
    kind: "LTV_LIMIT",
    version: "ae-reg.demo.v2026.07",
    status: "ACTIVE",
    validFrom: "2026-07-01",
    validTo: null,
    verifiedAt: null,
    verifiedBy: null,
    titleEn: "Reference LTV (UAE)",
    summaryEn: "Illustrative bank LTV ranges — not a product offer.",
    payload: {
      maxLtvPctPrimaryResidence: 80,
      maxLtvPctInvestment: 65,
      notesEn: "Resident vs non-resident LTV differs — verify with lender.",
    },
    requiresLegalVerificationNotice: true,
    isDemo: true,
  },
  {
    code: "ae.str.default",
    marketCode: "AE",
    kind: "SHORT_TERM_RENTAL",
    version: "ae-reg.demo.v2026.07",
    status: "ACTIVE",
    validFrom: "2026-07-01",
    validTo: null,
    verifiedAt: null,
    verifiedBy: null,
    titleEn: "Short-term rental (UAE)",
    summaryEn: "DTCM / emirate licensing often required.",
    payload: {
      permitted: "RESTRICTED",
      licenseRequired: true,
      notesEn: "Holiday-home permits and building rules apply.",
    },
    requiresLegalVerificationNotice: true,
    isDemo: true,
  },
] as const;

/**
 * Isolated hallucinated fixture for tests only — must never load in production paths
 * without allowDemo=true.
 */
export const DEMO_HALLUCINATED_REGULATORY_RULES: readonly RegulatoryRule[] = [
  {
    code: "demo.fantasy.foreign_ownership.always_ok",
    marketCode: "AE",
    kind: "FOREIGN_OWNERSHIP",
    version: "demo-hallucinated.v0",
    status: "ACTIVE",
    validFrom: "2026-01-01",
    validTo: null,
    verifiedAt: null,
    verifiedBy: null,
    titleEn: "DEMO ONLY — fictional always-allowed ownership",
    summaryEn:
      "Intentionally false rule for test isolation. Never ship as production config.",
    payload: {
      foreignersMayOwn: "YES",
      notesEn: "HALLUCINATED — tests only",
      certainty: "ORIENTATIONAL",
    },
    requiresLegalVerificationNotice: true,
    isDemo: true,
  },
] as const;
