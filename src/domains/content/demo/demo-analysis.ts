/**
 * DEMO DATA ONLY — not a real listing, valuation, or financial result.
 * Used exclusively for homepage demonstration UI.
 */
export const DEMO_ANALYSIS_PLACEHOLDER = {
  isDemo: true as const,
  label: "Demonstrační ukázka — nejedná se o reálnou nabídku",
  propertyTitle: "Ukázkový byt 3+kk (demo)",
  locationLabel: "Demonstrační lokalita",
  askingPriceCzk: 6_500_000,
  estimatedValueRangeCzk: {
    low: 6_100_000,
    mid: 6_400_000,
    high: 6_700_000,
  },
  grossYieldPct: 4.8,
  monthlyCashFlowCzk: 2_400,
  majetioScore: 72,
  strategy: "Dlouhodobý pronájem (demo)",
  risks: ["Demo riziko: údaje jsou ilustrativní", "Demo riziko: bez ověřených dat"],
} as const;
