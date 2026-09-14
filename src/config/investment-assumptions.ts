/**
 * Central investment assumption defaults — no magic numbers in UI/hooks.
 * Historical analyses freeze `assumptionConfigVersion` and must not pick up new defaults.
 */

export const ASSUMPTION_CONFIG_VERSION = "assumptions.v2026.07" as const;

export type AssumptionDefaults = {
  vacancyRatePp: number;
  interestRatePp: number;
  termYears: number;
  annualOpexShareOfRent: number;
  repairFundAnnualShareOfRent: number;
  acquisitionCostsShareOfPrice: number;
  feesShareOfPrice: number;
  appreciationPp: number;
  rentGrowthPp: number;
  expenseInflationPp: number;
  sellingCostPp: number;
  holdYears: number;
  /** Equity share of purchase when financing (0–1). */
  defaultEquityShare: number;
};

export type CanonicalSpreadsConfig = {
  interestRatePp: { conservative: number; optimistic: number };
  egiFactor: { conservative: number; optimistic: number };
  opexFactor: { conservative: number; optimistic: number };
  appreciationPp: { conservative: number; optimistic: number };
  rentGrowthPp: { conservative: number; optimistic: number };
};

export type AssumptionConfigDocument = {
  versionKey: typeof ASSUMPTION_CONFIG_VERSION | string;
  label: string;
  effectiveFrom: string;
  defaults: AssumptionDefaults;
  byPropertyType: Partial<
    Record<"APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL" | "OTHER", Partial<AssumptionDefaults>>
  >;
  byStrategy: Partial<
    Record<
      "long_term_rental" | "owner_occupier" | "flip" | "short_term_rental" | "cash_purchase",
      Partial<AssumptionDefaults>
    >
  >;
  /** Location slug → overrides (e.g. praha, brno). */
  byLocation: Record<string, Partial<AssumptionDefaults>>;
  spreads: CanonicalSpreadsConfig;
  meta: {
    currency: "CZK";
    publicNeutralDisclaimer: string;
    preTaxDisclaimer: string;
    legalDisclaimer: string;
  };
};

/** Current code-backed config (DB AssumptionConfigVersion may override at runtime later). */
export const ASSUMPTION_CONFIG_V2026_07: AssumptionConfigDocument = {
  versionKey: ASSUMPTION_CONFIG_VERSION,
  label: "Výchozí předpoklady Majetio — červenec 2026",
  effectiveFrom: "2026-07-01T00:00:00.000Z",
  defaults: {
    vacancyRatePp: 5,
    interestRatePp: 5.25,
    termYears: 30,
    annualOpexShareOfRent: 0.2,
    repairFundAnnualShareOfRent: 0.04,
    acquisitionCostsShareOfPrice: 0.0128,
    feesShareOfPrice: 0.004,
    appreciationPp: 3,
    rentGrowthPp: 2,
    expenseInflationPp: 2.5,
    sellingCostPp: 3,
    holdYears: 10,
    defaultEquityShare: 0.4,
  },
  byPropertyType: {
    APARTMENT: {},
    HOUSE: {
      vacancyRatePp: 4,
      annualOpexShareOfRent: 0.22,
      appreciationPp: 2.5,
    },
    COMMERCIAL: {
      vacancyRatePp: 8,
      annualOpexShareOfRent: 0.25,
      interestRatePp: 5.5,
    },
    LAND: {
      vacancyRatePp: 0,
      annualOpexShareOfRent: 0.05,
      appreciationPp: 2,
    },
    OTHER: {},
  },
  byStrategy: {
    long_term_rental: {},
    owner_occupier: {
      vacancyRatePp: 0,
      holdYears: 15,
    },
    flip: {
      holdYears: 2,
      appreciationPp: 0,
      rentGrowthPp: 0,
      sellingCostPp: 4,
    },
    short_term_rental: {
      vacancyRatePp: 25,
      annualOpexShareOfRent: 0.35,
    },
    cash_purchase: {
      defaultEquityShare: 1,
      interestRatePp: 0,
    },
  },
  byLocation: {
    praha: { appreciationPp: 3.5, vacancyRatePp: 4 },
    brno: { appreciationPp: 3, vacancyRatePp: 5 },
  },
  spreads: {
    interestRatePp: { conservative: 1.0, optimistic: -0.5 },
    egiFactor: { conservative: 0.9, optimistic: 1.1 },
    opexFactor: { conservative: 1.1, optimistic: 0.95 },
    appreciationPp: { conservative: -1.0, optimistic: 1.0 },
    rentGrowthPp: { conservative: -1.0, optimistic: 0.5 },
  },
  meta: {
    currency: "CZK",
    publicNeutralDisclaimer:
      "Orientační scénář s výchozími předpoklady Majetio — nejde o personalizovanou analýzu.",
    preTaxDisclaimer: "Výpočty jsou před zdaněním.",
    legalDisclaimer:
      "Výstupy nejsou daňovou radou, investičním doporučením ani garantovaným výnosem. Rozhodnutí vždy ověřte s odborníky.",
  },
};

/** Registry of known versions — historical analyses pin a key. */
export const ASSUMPTION_CONFIG_REGISTRY: Record<
  string,
  AssumptionConfigDocument
> = {
  [ASSUMPTION_CONFIG_VERSION]: ASSUMPTION_CONFIG_V2026_07,
  /** Alias used by older rows before Part 2/B. */
  "assumptions.v1": ASSUMPTION_CONFIG_V2026_07,
};

export function getAssumptionConfig(
  versionKey: string = ASSUMPTION_CONFIG_VERSION,
): AssumptionConfigDocument {
  return (
    ASSUMPTION_CONFIG_REGISTRY[versionKey] ?? ASSUMPTION_CONFIG_V2026_07
  );
}

export type ResolveAssumptionContext = {
  propertyType?: string | null;
  strategy?: string | null;
  locationSlug?: string | null;
  asOf?: Date;
  versionKey?: string;
};

export function resolveAssumptionDefaults(
  ctx: ResolveAssumptionContext = {},
): {
  versionKey: string;
  defaults: AssumptionDefaults;
  spreads: CanonicalSpreadsConfig;
  meta: AssumptionConfigDocument["meta"];
} {
  const config = getAssumptionConfig(ctx.versionKey);
  const merged: AssumptionDefaults = { ...config.defaults };

  const pt = ctx.propertyType as keyof typeof config.byPropertyType | undefined;
  if (pt && config.byPropertyType[pt]) {
    Object.assign(merged, config.byPropertyType[pt]);
  }
  const st = ctx.strategy as keyof typeof config.byStrategy | undefined;
  if (st && config.byStrategy[st]) {
    Object.assign(merged, config.byStrategy[st]);
  }
  if (ctx.locationSlug && config.byLocation[ctx.locationSlug]) {
    Object.assign(merged, config.byLocation[ctx.locationSlug]);
  }

  return {
    versionKey: config.versionKey,
    defaults: merged,
    spreads: config.spreads,
    meta: config.meta,
  };
}
