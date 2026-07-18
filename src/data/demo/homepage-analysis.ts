/**
 * DEMO DATA ONLY — not a real listing, valuation, or financial result.
 * Used exclusively for homepage demonstration UI.
 * Never treat as live market data or investment advice.
 */

export const homepageDemoAnalysis = {
  isDemo: true as const,
  label: "Ukázková analýza — ilustrativní údaje",
  propertyTitle: "Ukázkový byt 3+kk",
  locationLabel: "Demonstrační lokalita",
  disposition: "3+kk",
  areaSqm: 78,
  askingPriceCzk: 6_490_000,
  estimatedValueRangeCzk: {
    low: 6_050_000,
    mid: 6_280_000,
    high: 6_520_000,
  },
  estimatedRentMonthlyCzk: 29_500,
  grossYieldPct: 5.4,
  netYieldPct: 3.1,
  monthlyCashFlowCzk: -800,
  majetioScore: 64,
  strategy: "Dlouhodobý pronájem",
  risk: "medium" as const,
  riskLabel: "Střední riziko (demo)",
  dataQuality: "estimated" as const,
  dimensions: [
    { id: "price", label: "Cena" },
    { id: "yield", label: "Výnos" },
    { id: "financing", label: "Financování" },
    { id: "renovation", label: "Rekonstrukce" },
    { id: "risks", label: "Rizika" },
  ],
  scoreCategories: [
    { label: "Cena vs. odhad", value: 58 },
    { label: "Lokalita", value: 76 },
    { label: "Výnos", value: 70 },
    { label: "Rizika", value: 55 },
  ],
  positives: [
    "Stabilní poptávka po nájmu v demonstrační lokalitě",
    "Dispozice 3+kk odpovídá cílové skupině nájemců",
  ],
  risks: [
    "Nabídková cena nad středem odhadu hodnoty",
    "Cash flow po financování vychází záporně",
  ],
  uncertainties: [
    "Nájemné je odhad — skutečná obsazenost se může lišit",
    "Provozní náklady nejsou ověřené z výpisu",
  ],
  renovation: {
    valueAfterCzk: 8_200_000,
    costCzk: 1_100_000,
    reserveCzk: 220_000,
    maxOfferCzk: 6_880_000,
  },
  location: {
    rentIndexPct: 4.2,
    priceTrendPct: 3.8,
    commuteMinutes: 22,
    vacancyNote: "Orientační neobsazenost (demo): nízká",
  },
  financing: {
    propertyPriceCzk: 6_490_000,
    availableEquityCzk: 1_300_000,
    termYears: 30,
  },
  riskItems: [
    {
      id: "price",
      title: "Vysoká nabídková cena",
      level: "medium" as const,
      text: "Inzerovaná cena je nad středem odhadu. Bez slevy klesá prostor pro výnos.",
    },
    {
      id: "renovation",
      title: "Drahá rekonstrukce",
      level: "high" as const,
      text: "Odhad nákladů má široké pásmo. Rezerva 20 % je nutná — ne volitelná.",
    },
    {
      id: "rate",
      title: "Citlivost na úrok",
      level: "medium" as const,
      text: "Růst sazby o 1 p. b. může cash flow posunout hlouběji do záporu.",
    },
  ],
} as const;

/** Demo set for comparison preview — cheapest is not the strongest overall. */
export const homepageComparisonProperties = [
  {
    href: "/nemovitosti/demo-byt-2kk-nizka-cena",
    title: "Ukázkový byt 2+kk — nízká cena (demo)",
    location: "Demonstrační lokalita",
    disposition: "2+kk",
    areaSqm: 48,
    priceCzk: 3_890_000,
    pricePerSqmCzk: 81_042,
    grossYieldPct: 6.8,
    cashFlowMonthlyCzk: -2_200,
    majetioScore: 49,
    dataQuality: "incomplete" as const,
    risk: "high" as const,
    isDemo: true as const,
  },
  {
    href: "/nemovitosti/demo-byt-3kk-vinohrady",
    title: "Ukázkový byt 3+kk (demo)",
    location: "Demonstrační lokalita — Vinohrady",
    disposition: "3+kk",
    areaSqm: 78,
    priceCzk: 6_490_000,
    pricePerSqmCzk: 83_205,
    grossYieldPct: 5.4,
    cashFlowMonthlyCzk: 2_400,
    majetioScore: 72,
    dataQuality: "estimated" as const,
    risk: "medium" as const,
    isDemo: true as const,
  },
  {
    href: "/nemovitosti/demo-byt-2kk-brno",
    title: "Ukázkový byt 2+kk (demo)",
    location: "Demonstrační lokalita — Brno",
    disposition: "2+kk",
    areaSqm: 52,
    priceCzk: 4_200_000,
    pricePerSqmCzk: 80_769,
    grossYieldPct: 5.2,
    cashFlowMonthlyCzk: 3_100,
    majetioScore: 76,
    dataQuality: "estimated" as const,
    risk: "low" as const,
    isDemo: true as const,
  },
] as const;

export type HomepageDemoAnalysis = typeof homepageDemoAnalysis;
