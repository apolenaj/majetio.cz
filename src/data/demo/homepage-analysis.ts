/**
 * DEMO DATA ONLY — not a real listing, valuation, or financial result.
 * Used exclusively for homepage hero demonstration UI.
 * Never treat as live market data or investment advice.
 */

export const homepageDemoAnalysis = {
  isDemo: true as const,
  label: "Ukázková analýza — ilustrativní údaje",
  propertyTitle: "Ukázkový byt 3+kk",
  locationLabel: "Demonstrační lokalita",
  disposition: "3+kk",
  areaSqm: 78,
  askingPriceCzk: 6_500_000,
  estimatedValueRangeCzk: {
    low: 6_100_000,
    mid: 6_400_000,
    high: 6_700_000,
  },
  grossYieldPct: 4.8,
  monthlyCashFlowCzk: 2_400,
  majetioScore: 72,
  strategy: "Dlouhodobý pronájem",
  riskLabel: "Střední riziko (demo)",
  dimensions: [
    { id: "price", label: "Cena" },
    { id: "yield", label: "Výnos" },
    { id: "financing", label: "Financování" },
    { id: "renovation", label: "Rekonstrukce" },
    { id: "risks", label: "Rizika" },
  ],
} as const;

export type HomepageDemoAnalysis = typeof homepageDemoAnalysis;
