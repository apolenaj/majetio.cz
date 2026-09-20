/**
 * Canonical Pricing Architecture (Phase 1 / checklist 221).
 * Single source of truth for list prices — UI and checkout must never hardcode Kč.
 * Runtime checkout still resolves via PricingPlan DB row; this config seeds + documents.
 */

/** Czech standard VAT 21 % in basis points — keep in sync with `DEFAULT_VAT_RATE_BP`. */
const CATALOG_VAT_RATE_BP = 2100;


export const PRICING_VERSION_KEY = "v2026.09" as const;

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
  /**
   * When true, product may appear on the public customer ceník.
   * Internal catalog rows stay available for entitlements / existing orders.
   */
  publicCustomerOffer?: boolean;
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
    nameCs: "Analýza nemovitosti před koupí",
    taglineCs:
      "Jednorázová analýza konkrétní nemovitosti — ekonomika, scénáře a rizika.",
    priceGrossMinor: 499_000,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "deep_analysis",
    features: [
      "Ekonomika koupě a náklady",
      "Scénáře a cash flow",
      "Rizika a chybějící podklady",
    ],
    limits: { refreshDays: 90, propertiesPerPurchase: 1 },
    comparisonHighlight: true,
    sortOrder: 20,
    publicCustomerOffer: true,
  },
  {
    key: "property_search_project",
    segment: "buyers",
    nameCs: "Hledání nemovitosti na zadání",
    taglineCs:
      "30denní projekt hledání — schválené zadání a posouzení až pěti kandidátů.",
    priceGrossMinor: 999_000,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "property_search_project",
    features: [
      "Schválené zadání",
      "Období 30 dní",
      "Posouzení až 5 kandidátů",
      "Průběžný výstup",
    ],
    limits: { durationDays: 30, candidatesMax: 5 },
    sortOrder: 22,
    publicCustomerOffer: true,
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
    key: "listing_basic_30",
    segment: "sellers",
    nameCs: "Základní inzerát",
    taglineCs: "Zveřejnění nabídky na 30 dní — pevná cena, ne procento z prodeje.",
    priceGrossMinor: 29_900,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "listing_basic_30",
    features: [
      "Zveřejnění v katalogu na 30 dní",
      "Fotografie a popis",
      "Kontakt od zájemců",
    ],
    limits: { durationDays: 30, sponsored: false },
    comparisonHighlight: true,
    sortOrder: 48,
    publicCustomerOffer: true,
  },
  {
    key: "listing_premium_30",
    segment: "sellers",
    nameCs: "Premium inzerát",
    taglineCs: "Zvýraznění v katalogu na 30 dní. Celková cena včetně zveřejnění.",
    priceGrossMinor: 79_900,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "listing_premium_30",
    features: [
      "Zveřejnění v katalogu na 30 dní",
      "Zvýraznění a označení Premium",
      "Neovlivňuje Majetio Score ani organické pořadí",
    ],
    limits: { durationDays: 30, sponsored: true, affectsOrganicRanking: false },
    sortOrder: 49,
    publicCustomerOffer: true,
  },
  {
    key: "listing_prep",
    segment: "sellers",
    nameCs: "Profesionální příprava inzerátu",
    taglineCs:
      "Text, struktura a pořadí fotografií. Zveřejnění se kupuje samostatně.",
    priceGrossMinor: 299_000,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "listing_prep",
    features: [
      "Profesionální text a krátký popis",
      "Struktura parametrů",
      "Pořadí dodaných fotografií",
      "Seznam chybějících podkladů",
      "Jedna revize",
    ],
    limits: {
      revisionsIncluded: 1,
      includesPhotography: false,
      includesPublication: false,
    },
    sortOrder: 50,
    publicCustomerOffer: true,
  },
  {
    key: "boost_7_days",
    segment: "sellers",
    nameCs: "Boost 7 dní",
    taglineCs: "Interní sponzorované umístění — neovlivní Majetio Score.",
    priceGrossMinor: 49_900,
    billingType: "ONE_TIME",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "boost_7_days",
    features: ["SPONSORED_PLACEMENT", "Label Sponzorováno"],
    limits: { durationDays: 7, affectsOrganicRanking: false },
    featureFlag: "LISTING_BOOST_ENABLED",
    sortOrder: 54,
  },
  {
    key: "boost_30_days",
    segment: "sellers",
    nameCs: "Boost 30 dní",
    taglineCs: "Interní sponzorovaná propagace — historický / doplňkový produkt.",
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

  // ── Makléři / firmy (B2B) ────────────────────────────────────────────────
  {
    key: "firm_starter_monthly",
    segment: "agents",
    nameCs: "Firemní Starter",
    taglineCs: "Do 10 aktivních inzerátů — nahrazuje základní poplatky za zveřejnění.",
    priceGrossMinor: 99_000,
    billingType: "SUBSCRIPTION",
    requiresRenewConsent: true,
    autoRenewDefault: false,
    entitlesProductKey: "firm_starter",
    features: ["LISTING_BASIC", "LEAD_INBOX", "Bez dvojího účtování základního inzerátu"],
    limits: {
      billingInterval: "MONTHLY",
      maxActiveListings: 10,
      seats: 3,
      replacesListingBasicFee: true,
    },
    sortOrder: 58,
    publicCustomerOffer: true,
  },
  {
    key: "firm_growth_monthly",
    segment: "agents",
    nameCs: "Firemní Growth",
    taglineCs: "Do 30 aktivních inzerátů v rámci měsíčního limitu.",
    priceGrossMinor: 199_000,
    billingType: "SUBSCRIPTION",
    requiresRenewConsent: true,
    autoRenewDefault: false,
    entitlesProductKey: "firm_growth",
    features: ["LISTING_BASIC", "LEAD_INBOX", "Bez dvojího účtování základního inzerátu"],
    limits: {
      billingInterval: "MONTHLY",
      maxActiveListings: 30,
      seats: 8,
      replacesListingBasicFee: true,
    },
    comparisonHighlight: true,
    sortOrder: 59,
    publicCustomerOffer: true,
  },
  {
    key: "firm_scale_monthly",
    segment: "agents",
    nameCs: "Firemní Scale",
    taglineCs: "Do 100 aktivních inzerátů pro větší týmy.",
    priceGrossMinor: 399_000,
    billingType: "SUBSCRIPTION",
    requiresRenewConsent: true,
    autoRenewDefault: false,
    entitlesProductKey: "firm_scale",
    features: ["LISTING_BASIC", "LEAD_INBOX", "TEAM_ROLES", "Bez dvojího účtování základního inzerátu"],
    limits: {
      billingInterval: "MONTHLY",
      maxActiveListings: 100,
      seats: 20,
      replacesListingBasicFee: true,
    },
    sortOrder: 60,
    publicCustomerOffer: true,
  },
  {
    key: "agent_free",
    segment: "agents",
    nameCs: "Agent Free",
    taglineCs: "Historický free tier — nové firmy volí Starter / Growth / Scale.",
    priceGrossMinor: 0,
    billingType: "SUBSCRIPTION",
    requiresRenewConsent: false,
    autoRenewDefault: false,
    entitlesProductKey: "agent_free",
    features: ["LISTING_BASIC", "LEAD_INBOX"],
    limits: { maxActiveListings: 5, seats: 1 },
    featureFlag: "B2B_AGENT_PLANS_ENABLED",
    sortOrder: 62,
  },
  {
    key: "agent_pro",
    segment: "agents",
    nameCs: "Agent Pro",
    taglineCs: "Historický tarif — zachován pro existující závazky.",
    priceGrossMinor: 149_900,
    billingType: "SUBSCRIPTION",
    requiresRenewConsent: true,
    autoRenewDefault: false,
    entitlesProductKey: "agent_pro",
    features: ["LISTING_BASIC", "LISTING_PROMO", "LEAD_INBOX", "IDENTITY_BADGE"],
    limits: { maxActiveListings: 40, seats: 1 },
    featureFlag: "B2B_AGENT_PLANS_ENABLED",
    sortOrder: 65,
  },
  {
    key: "agency_growth",
    segment: "agents",
    nameCs: "Agency Growth",
    taglineCs: "Historický tarif — zachován pro existující závazky.",
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
    titleCs: "Prodávající a inzerenti",
    introCs:
      "Pevná cena za zveřejnění. Běžná inzerce není podmíněná procentní provizí z prodeje. Premium je zvýraznění, ne lepší skóre.",
    audience: "b2c",
  },
  agents: {
    titleCs: "Firmy a makléři",
    introCs:
      "Měsíční předplatné podle limitu aktivních inzerátů. V rámci limitu nenahrazujeme Premium ani odborné služby — jen základní zveřejnění.",
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
