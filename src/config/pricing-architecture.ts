/**
 * Canonical Pricing Architecture (Phase 1 / checklist 221).
 * Single source of truth for list prices — UI and checkout must never hardcode Kč.
 * Runtime checkout still resolves via PricingPlan DB row; this config seeds + documents.
 */

/** Czech standard VAT 21 % in basis points — keep in sync with `DEFAULT_VAT_RATE_BP`. */
const CATALOG_VAT_RATE_BP = 2100;


export const PRICING_VERSION_KEY = "v2026.07" as const;

export type PricingSegmentId =
  | "buyers"
  | "investors"
  | "sellers"
  | "agents"
  | "developers"
  | "professional_services";

export type PricingBillingKind = "ONE_TIME" | "SUBSCRIPTION" | "USAGE" | "CONTACT";

export type CatalogProductDef = {
  key: string;
  segment: PricingSegmentId;
  nameCs: string;
  taglineCs: string;
  /** Gross list price in haléře (VAT inclusive). Null = contact / individual. */
  priceGrossMinor: number | null;
  billingType: PricingBillingKind;
  /** Subscription products require explicit renew consent — never silent auto-renew. */
  requiresRenewConsent: boolean;
  autoRenewDefault: false;
  entitlesProductKey: string;
  features: string[];
  limits: Record<string, number | string | boolean | null>;
  /** Feature flag key that must be on to show checkout CTA (optional). */
  featureFlag?: string;
  sortOrder: number;
  comparisonHighlight?: boolean;
};

/**
 * Bod 221 — B2C, Seller, B2B, Developers, Professional Services.
 * Amounts match seeded PricingPlan rows where they exist.
 */
export const pricingCatalog: readonly CatalogProductDef[] = [
  // ── Kupující (B2C) ───────────────────────────────────────────────────────
  {
    key: "majetio_free",
    segment: "buyers",
    nameCs: "Majetio Free",
    taglineCs: "Základní skóre a rizika — skutečná hodnota, ne prázdný paywall.",
    priceGrossMinor: 0,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "majetio_free",
    features: ["BASIC_SCORE", "BASIC_RISKS", "Jednoduché porovnání (max 2)"],
    limits: { simpleComparisonsMax: 2, propertyDetailViewsPerDay: 60 },
    sortOrder: 10,
  },
  {
    key: "basic_analysis",
    segment: "buyers",
    nameCs: "Základní analýza",
    taglineCs: "Rychlá orientace před rozhodnutím.",
    priceGrossMinor: 0,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "basic_analysis",
    features: ["Základní metriky", "Orientační výnos"],
    limits: { analysesPerMonth: 20, comparisonsMax: 4 },
    sortOrder: 15,
  },
  {
    key: "deep_analysis",
    segment: "buyers",
    nameCs: "Deep Analysis",
    taglineCs: "Jednorázová hluboká analýza konkrétní nemovitosti (90 dní refresh).",
    priceGrossMinor: 499_000,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "deep_analysis",
    features: ["DEEP_ANALYSIS", "FULL_SCENARIOS", "BASIC_SCORE", "BASIC_RISKS"],
    limits: { refreshDays: 90, propertiesPerPurchase: 1 },
    comparisonHighlight: true,
    sortOrder: 20,
  },
  {
    key: "full_analysis",
    segment: "buyers",
    nameCs: "Kompletní analýza",
    taglineCs: "Podložené rozhodnutí před koupí.",
    priceGrossMinor: 499_000,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "full_analysis",
    features: ["valuation", "scenarios", "financing", "risks"],
    limits: { analysesPerMonth: 50, comparisonsMax: 4 },
    sortOrder: 25,
  },
  {
    key: "buyer_pass",
    segment: "buyers",
    nameCs: "Buyer Pass",
    taglineCs: "30 dní toolkit pro kupující — není automatické předplatné.",
    priceGrossMinor: 149_900,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "buyer_pass",
    features: [
      "DEEP_ANALYSIS (2× v passu)",
      "ADVANCED_COMPARISON",
      "FULL_SCENARIOS",
    ],
    limits: {
      durationDays: 30,
      deepAnalysesIncluded: 2,
      propertyViewsPerDay: 40,
    },
    sortOrder: 30,
  },

  // ── Investoři ────────────────────────────────────────────────────────────
  {
    key: "investor_pro_monthly",
    segment: "investors",
    nameCs: "Investor Pro (měsíční)",
    taglineCs: "Členství s trial — obnova jen po výslovném souhlasu.",
    priceGrossMinor: 99_900,
    billingType: "SUBSCRIPTION",
    requiresRenewConsent: true,
    autoRenewDefault: false,
    entitlesProductKey: "investor_pro",
    features: [
      "DEEP_ANALYSIS",
      "ADVANCED_COMPARISON",
      "INVESTOR_TOOLS",
      "FULL_SCENARIOS",
    ],
    limits: { billingInterval: "MONTHLY", trialDays: 7, graceDays: 3 },
    featureFlag: "INVESTOR_PRO_ENABLED",
    comparisonHighlight: true,
    sortOrder: 40,
  },
  {
    key: "investor_pro_annual",
    segment: "investors",
    nameCs: "Investor Pro (roční)",
    taglineCs: "Roční plán — žádné tiché auto-obnovení.",
    priceGrossMinor: 999_000,
    billingType: "SUBSCRIPTION",
    requiresRenewConsent: true,
    autoRenewDefault: false,
    entitlesProductKey: "investor_pro",
    features: [
      "DEEP_ANALYSIS",
      "ADVANCED_COMPARISON",
      "INVESTOR_TOOLS",
      "FULL_SCENARIOS",
    ],
    limits: { billingInterval: "ANNUAL", trialDays: 14, graceDays: 7 },
    featureFlag: "INVESTOR_PRO_ENABLED",
    sortOrder: 45,
  },

  // ── Prodávající ──────────────────────────────────────────────────────────
  {
    key: "boost_7_days",
    segment: "sellers",
    nameCs: "Boost 7 dní",
    taglineCs: "Sponzorované umístění — neovlivní Majetio Score ani organiku.",
    priceGrossMinor: 49_900,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "boost_7_days",
    features: ["SPONSORED_PLACEMENT", "Label Sponzorováno"],
    limits: { durationDays: 7, affectsOrganicRanking: false },
    featureFlag: "LISTING_BOOST_ENABLED",
    sortOrder: 50,
  },
  {
    key: "boost_30_days",
    segment: "sellers",
    nameCs: "Boost 30 dní",
    taglineCs: "Delší sponzorovaná propagace inzerátu.",
    priceGrossMinor: 149_900,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "boost_30_days",
    features: ["SPONSORED_PLACEMENT", "Label Sponzorováno"],
    limits: { durationDays: 30, affectsOrganicRanking: false },
    featureFlag: "LISTING_BOOST_ENABLED",
    sortOrder: 55,
  },

  // ── Makléři (B2B) ────────────────────────────────────────────────────────
  {
    key: "agent_free",
    segment: "agents",
    nameCs: "Agent Free",
    taglineCs: "Až 5 aktivních nabídek — skutečný free tier.",
    priceGrossMinor: 0,
    billingType: "SUBSCRIPTION",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "agent_free",
    features: ["LISTING_BASIC", "LEAD_INBOX"],
    limits: { maxActiveListings: 5, seats: 1 },
    featureFlag: "B2B_AGENT_PLANS_ENABLED",
    sortOrder: 60,
  },
  {
    key: "agent_pro",
    segment: "agents",
    nameCs: "Agent Pro",
    taglineCs: "Více nabídek a identity badge.",
    priceGrossMinor: 149_900,
    billingType: "SUBSCRIPTION",
    requiresRenewConsent: true,
    autoRenewDefault: false,
    entitlesProductKey: "agent_pro",
    features: ["LISTING_BASIC", "LISTING_PROMO", "LEAD_INBOX", "IDENTITY_BADGE"],
    limits: { maxActiveListings: 40, seats: 1 },
    featureFlag: "B2B_AGENT_PLANS_ENABLED",
    comparisonHighlight: true,
    sortOrder: 65,
  },
  {
    key: "agency_growth",
    segment: "agents",
    nameCs: "Agency Growth",
    taglineCs: "Růstový tarif pro realitní kanceláře.",
    priceGrossMinor: 499_900,
    billingType: "SUBSCRIPTION",
    requiresRenewConsent: true,
    autoRenewDefault: false,
    entitlesProductKey: "agency_growth",
    features: ["TEAM_ROLES", "ORG_BADGE", "LISTING_PROMO", "LEAD_INBOX"],
    limits: { maxActiveListings: 200, seats: 15 },
    featureFlag: "B2B_AGENCY_PLANS_ENABLED",
    sortOrder: 70,
  },

  // ── Developeři ───────────────────────────────────────────────────────────
  {
    key: "developer_standard",
    segment: "developers",
    nameCs: "Developer Standard",
    taglineCs: "Projekty a jednotky pod jednou organizací.",
    priceGrossMinor: 999_900,
    billingType: "SUBSCRIPTION",
    requiresRenewConsent: true,
    autoRenewDefault: false,
    entitlesProductKey: "developer_standard",
    features: ["PROJECT_UNITS", "ORG_BADGE", "LISTING_PROMO", "LEAD_INBOX"],
    limits: { maxActiveListings: 500, seats: 25, projectsMax: 20 },
    featureFlag: "B2B_DEVELOPER_PLANS_ENABLED",
    sortOrder: 80,
  },

  // ── Professional Services ────────────────────────────────────────────────
  {
    key: "expert_review",
    segment: "professional_services",
    nameCs: "Expert Review",
    taglineCs: "Human-in-the-loop review — ne automatická analýza.",
    priceGrossMinor: 299_000,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "expert_review",
    features: ["WAITING_FOR_INPUTS → ASSIGNED → IN_REVIEW → DELIVERED"],
    limits: { humanInTheLoop: true },
    featureFlag: "EXPERT_REVIEW_ENABLED",
    sortOrder: 90,
  },
  {
    key: "investment_audit",
    segment: "professional_services",
    nameCs: "Investment Audit",
    taglineCs:
      "Hloubkový audit scénáře (human-in-the-loop). Na webu neuvádíme jména expertů — review provádí přiřazený specialista po objednávce.",
    priceGrossMinor: 799_000,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "investment_audit",
    features: ["Human-in-the-loop", "Delší review cyklus"],
    limits: { humanInTheLoop: true },
    featureFlag: "INVESTMENT_AUDIT_ENABLED",
    sortOrder: 95,
  },
  {
    key: "purchase_concierge",
    segment: "professional_services",
    nameCs: "Purchase Concierge",
    taglineCs: "Zastoupení při koupi — spuštěno až po právním rámci.",
    priceGrossMinor: null,
    billingType: "CONTACT",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "purchase_concierge",
    features: ["Individuální dohoda"],
    limits: {},
    featureFlag: "TRANSACTION_SUCCESS_FEE_ENABLED",
    sortOrder: 100,
  },
] as const;

export const pricingSegments: Record<
  PricingSegmentId,
  { titleCs: string; introCs: string; audience: "b2c" | "b2b" | "services" }
> = {
  buyers: {
    titleCs: "Kupující",
    introCs:
      "Transparentní B2C nabídka — free tier s reálnou hodnotou, jednorázové analýzy a Buyer Pass bez tichého předplatného.",
    audience: "b2c",
  },
  investors: {
    titleCs: "Investoři",
    introCs:
      "Investor Pro s trial a grace — obnova jen po výslovném souhlasu (žádné skryté auto-renewal).",
    audience: "b2c",
  },
  sellers: {
    titleCs: "Prodávající",
    introCs:
      "Placená propagace je vždy Sponzorováno — neovlivní Majetio Score, valuaci ani organické doporučení.",
    audience: "b2c",
  },
  agents: {
    titleCs: "Makléři",
    introCs:
      "B2B tarify podle limitu nabídek a seatů. Downgrade nemaže inzeráty — označí OVER_LIMIT.",
    audience: "b2b",
  },
  developers: {
    titleCs: "Developeři",
    introCs: "SaaS model pro development pipeline a jednotky.",
    audience: "b2b",
  },
  professional_services: {
    titleCs: "Profesionální služby",
    introCs:
      "Expert Review a Investment Audit jsou human-in-the-loop. Purchase Concierge je vypnutý, dokud neexistuje právní rámec.",
    audience: "services",
  },
};

export const pricingArchitectureMeta = {
  versionKey: PRICING_VERSION_KEY,
  currency: "CZK" as const,
  vatRateBp: CATALOG_VAT_RATE_BP,
  /** Checklist 221 reference table. */
  checklistRef: "221",
} as const;

export function getCatalogProductByKey(key: string): CatalogProductDef | null {
  return pricingCatalog.find((p) => p.key === key) ?? null;
}

export function listCatalogBySegment(
  segment: PricingSegmentId,
): CatalogProductDef[] {
  return pricingCatalog
    .filter((p) => p.segment === segment)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Canonical gross amount for checkout — never trust client. */
export function resolveCanonicalCheckoutAmount(input: {
  planPriceGrossMinor: number;
  /** Ignored — client manipulation must not affect charge (171/172). */
  clientClaimedAmountMinor?: number | null;
}): number {
  void input.clientClaimedAmountMinor;
  return Math.max(0, Math.round(input.planPriceGrossMinor));
}
