/**
 * B2C entitlement product config — Majetio Free, Deep Analysis, Buyer Pass, Investor Pro.
 * Free tier must deliver real value (score + risks) — never a fake empty paywall.
 */

export const ENTITLEMENT_FEATURES = [
  /** Always free — majetio score band / headline. */
  "BASIC_SCORE",
  /** Always free — top risk titles (not full DD pack). */
  "BASIC_RISKS",
  /** Paid / pass — full deep analysis for a property. */
  "DEEP_ANALYSIS",
  /** Paid / pass — advanced comparison matrix & overlays. */
  "ADVANCED_COMPARISON",
  /** Full investment scenarios beyond free teaser. */
  "FULL_SCENARIOS",
  /** Investor Pro toolkit (portfolio-oriented). */
  "INVESTOR_TOOLS",
] as const;

export type EntitlementFeature = (typeof ENTITLEMENT_FEATURES)[number];

export function isEntitlementFeature(value: string): value is EntitlementFeature {
  return (ENTITLEMENT_FEATURES as readonly string[]).includes(value);
}

/** Majetio Free — genuine value, no fake paywall. */
export const majetioFreeConfig = {
  productKey: "majetio_free",
  features: ["BASIC_SCORE", "BASIC_RISKS"] as const satisfies readonly EntitlementFeature[],
  limits: {
    /** Side-by-side compare without ADVANCED_COMPARISON. */
    simpleComparisonsMax: 2,
    /** Soft discovery quota (anti-scrape), still usable for humans. */
    propertyDetailViewsPerDay: 60,
    exportsPerDay: 0,
  },
  copy: {
    valuePromiseCs:
      "Zdarma vidíte základní Majetio skóre a hlavní rizika — bez falešného paywallu.",
  },
} as const;

/** One-time Deep Analysis — property + content version, not lifetime. */
export const deepAnalysisConfig = {
  productKey: "deep_analysis",
  features: [
    "DEEP_ANALYSIS",
    "BASIC_SCORE",
    "BASIC_RISKS",
    "FULL_SCENARIOS",
  ] as const satisfies readonly EntitlementFeature[],
  /** Access window from grant (days). */
  accessDays: 90,
  /**
   * After refreshAfter (= grantedAt + refreshDays) a new purchase is required
   * for a newer contentVersionKey.
   */
  refreshDays: 90,
} as const;

/** Buyer Pass — time-boxed toolkit, NOT auto-subscription. */
export const buyerPassConfig = {
  productKey: "buyer_pass",
  features: [
    "DEEP_ANALYSIS",
    "ADVANCED_COMPARISON",
    "BASIC_SCORE",
    "BASIC_RISKS",
    "FULL_SCENARIOS",
  ] as const satisfies readonly EntitlementFeature[],
  durationDays: 30,
  /** Included deep analyses while pass is active (metered). */
  deepAnalysesIncluded: 2,
  antiScrape: {
    propertyViewsPerDay: 40,
    exportsPerDay: 5,
    advancedComparisonsPerDay: 20,
  },
} as const;

/** Investor Pro — membership lifecycle with grace + annual option. */
export const investorProConfig = {
  productKey: "investor_pro",
  planKeys: {
    monthly: "investor_pro_monthly",
    annual: "investor_pro_annual",
  },
  features: [
    "DEEP_ANALYSIS",
    "ADVANCED_COMPARISON",
    "INVESTOR_TOOLS",
    "BASIC_SCORE",
    "BASIC_RISKS",
    "FULL_SCENARIOS",
  ] as const satisfies readonly EntitlementFeature[],
  monthly: {
    periodDays: 30,
    trialDays: 7,
    graceDays: 3,
  },
  annual: {
    periodDays: 365,
    trialDays: 14,
    graceDays: 7,
  },
  antiScrape: {
    propertyViewsPerDay: 200,
    exportsPerDay: 30,
    advancedComparisonsPerDay: 100,
  },
} as const;

export const entitlementsB2cConfig = {
  free: majetioFreeConfig,
  deepAnalysis: deepAnalysisConfig,
  buyerPass: buyerPassConfig,
  investorPro: investorProConfig,
} as const;

export type EntitlementsB2cConfig = typeof entitlementsB2cConfig;
