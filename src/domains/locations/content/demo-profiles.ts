import type { LocationPageProfile } from "@/domains/locations/types/location-page";

const PERIOD = "Posledních 12 měsíců (měsíční agregace)";
const METHODOLOGY = "/metodika#lokality";
const SOURCE = "Interní agregace Majetio + partnerské feedy (demo)";
const VERSION = "location-metrics.v2026.07";

const SEGMENTS = [
  {
    key: "pt:APARTMENT|age:secondary|lay:2+kk",
    label: "Byt 2+kk (secondary)",
    propertyType: "APARTMENT" as const,
  },
  {
    key: "pt:APARTMENT|age:secondary|lay:3+kk",
    label: "Byt 3+kk (secondary)",
    propertyType: "APARTMENT" as const,
  },
  {
    key: "pt:HOUSE|age:secondary|lay:ALL",
    label: "Dům (secondary)",
    propertyType: "HOUSE" as const,
  },
];

function months(labels: string[], askingBase: number, txDiscount = 0.92): {
  asking: { label: string; value: number }[];
  transaction: { label: string; value: number }[];
} {
  return {
    asking: labels.map((label, i) => ({
      label,
      value: Math.round(askingBase * (1 + i * 0.008)),
    })),
    transaction: labels.map((label, i) => ({
      label,
      value: Math.round(askingBase * txDiscount * (1 + i * 0.006)),
    })),
  };
}

const MONTH_LABELS = [
  "8/25",
  "9/25",
  "10/25",
  "11/25",
  "12/25",
  "1/26",
  "2/26",
  "3/26",
  "4/26",
  "5/26",
  "6/26",
  "7/26",
];

function metric(
  key: string,
  label: string,
  value: number | null,
  unit: string,
  formattedValue: string,
  extra?: Partial<LocationPageProfile["summary"][0]>,
) {
  return {
    key,
    label,
    value,
    unit,
    formattedValue,
    period: PERIOD,
    quality: "estimated" as const,
    ...extra,
  };
}

function buildPriceHistory(
  askingBase: number,
  rentBase: number,
): Pick<
  LocationPageProfile,
  "priceHistoryBySegment" | "rentHistoryBySegment"
> {
  const priceHistoryBySegment: LocationPageProfile["priceHistoryBySegment"] =
    {};
  const rentHistoryBySegment: LocationPageProfile["rentHistoryBySegment"] = {};

  for (const seg of SEGMENTS) {
    const mult = seg.propertyType === "HOUSE" ? 0.72 : seg.key.includes("3+kk") ? 0.92 : 1;
    const series = months(MONTH_LABELS, askingBase * mult);
    priceHistoryBySegment[seg.key] = {
      asking: {
        points: series.asking,
        period: PERIOD,
        source: SOURCE,
        sampleCount: seg.propertyType === "HOUSE" ? 28 : 142,
      },
      transaction: {
        points: series.transaction,
        period: PERIOD,
        source: SOURCE,
        sampleCount: seg.propertyType === "HOUSE" ? 18 : 86,
      },
    };
    rentHistoryBySegment[seg.key] = {
      points: MONTH_LABELS.map((label, i) => ({
        label,
        value: Math.round(rentBase * mult * (1 + i * 0.004)),
      })),
      period: PERIOD,
      source: SOURCE,
      sampleCount: 96,
    };
  }

  return { priceHistoryBySegment, rentHistoryBySegment };
}

const PRAHA: LocationPageProfile = {
  location: {
    id: "demo-praha",
    slug: "praha",
    name: "Praha",
    publicLabel: "Praha",
    type: "CITY",
    hierarchyLabel: "Hlavní město · Středočeský kraj",
    searchLokalita: "Praha",
    canonicalPath: "/lokality/praha",
    pathSegments: ["praha"],
  },
  heroSummary:
    "Největší rezidenční trh v ČR — vysoká likvidita bytů, prémiové ceny v centru a silný nájemní segment pro dlouhodobý pronájem.",
  periodLabel: PERIOD,
  methodologyVersion: VERSION,
  methodologyHref: METHODOLOGY,
  source: SOURCE,
  updatedAt: "2026-07-01",
  isDemo: true,
  segments: SEGMENTS,
  defaultSegmentKey: SEGMENTS[0]!.key,
  summary: [
    metric(
      "property_market.median_asking_price_sqm",
      "Medián nabídky",
      142_000,
      "Kč/m²",
      "142 000 Kč/m²",
      { trend: "up", changeLabel: "+4,2 % YoY", sampleCount: 142, confidence: 0.88 },
    ),
    metric(
      "property_market.median_transaction_price_sqm",
      "Medián transakcí",
      128_500,
      "Kč/m²",
      "128 500 Kč/m²",
      { trend: "up", changeLabel: "+3,1 % YoY", sampleCount: 86, confidence: 0.82 },
    ),
    metric(
      "rental_market.median_asking_rent_sqm",
      "Medián nájmu",
      420,
      "Kč/m²/měs.",
      "420 Kč/m²/měs.",
      { trend: "up", changeLabel: "+2,8 % YoY", sampleCount: 96, confidence: 0.85 },
    ),
    metric(
      "investment.gross_rental_yield",
      "Hrubý výnos",
      3.55,
      "% p.a.",
      "3,55 %",
      { trend: "flat", changeLabel: "±0,1 p.b. YoY", sampleCount: 96, confidence: 0.78 },
    ),
  ],
  ...buildPriceHistory(142_000, 420),
  supplyDemand: {
    activeListings: metric(
      "property_market.active_listings_count",
      "Aktivní inzeráty",
      1840,
      "ks",
      "1 840",
      { sampleCount: 1840 },
    ),
    medianDom: metric(
      "property_market.median_days_on_market",
      "Medián DOM",
      38,
      "dní",
      "38 dní",
      { sampleCount: 620, explanation: "Medián s oříznutím extrémních outlierů (5.–95. percentil)." },
    ),
    priceReductionRate: metric(
      "property_market.price_reduction_rate",
      "Podíl se slevou",
      0.22,
      "podíl",
      "22 %",
      { sampleCount: 1840 },
    ),
    rentTurnover: metric(
      "rental_market.rent_listings_turnover",
      "Obrat pronájmů",
      0.31,
      "podíl",
      "31 %",
      { sampleCount: 410 },
    ),
  },
  investment: {
    grossYield: metric(
      "investment.gross_rental_yield",
      "Hrubý nájemní výnos",
      3.55,
      "%",
      "3,55 %",
      { sampleCount: 96 },
    ),
    highlights: [
      "Stabilní poptávka po nájmu v blízkosti metra a VŠ kampusů.",
      "Vyšší vstupní cena — citlivost na úrokové sazby nadprůměrná.",
    ],
  },
  transport: {
    transitScore: metric(
      "infrastructure.transit_score",
      "Dopravní dostupnost",
      82,
      "index",
      "82 / 100",
      { quality: "estimated" },
    ),
    amenities: [
      { label: "Metro / tram", value: "Vysoká hustota linek", note: "Centrum + vnitřní obvody" },
      { label: "Obchody", value: "Výborná", note: "5 min pěšky ve většině částí" },
      { label: "Školy", value: "Dobrá", note: "Kapacitní tlak v centrech" },
      { label: "Zeleň", value: "Proměnlivá", note: "Parky vs. hustá zástavba" },
    ],
  },
  development: {
    unitsUnderConstruction: metric(
      "development.units_under_construction",
      "Jednotky ve výstavbě",
      4200,
      "ks",
      "4 200",
    ),
    pipelineNote: "Vysoký objem novostaveb na periferiích — sledujte dopad na nabídku ve starším fondu.",
    highlights: [
      "Brownfield projekty na Rohanském nábřeží a Smíchově.",
      "Nové projekty v Praze 9 a 10 — mix bytů a komerce.",
    ],
  },
  risks: [
    {
      title: "Regulace krátkodobých pronájmů",
      description: "Municipální pravidla mohou ovlivnit yield u turistických lokalit.",
      level: "medium",
    },
    {
      title: "Úrokové sazby",
      description: "Financování je dražší — kupní síla kupujících klesá oproti boom let 2021–2022.",
      level: "high",
    },
    {
      title: "Likvidita prémiového segmentu",
      description: "Luxusní byty v centru mají delší DOM než mainstream 2+kk.",
      level: "medium",
    },
  ],
  neighbors: [
    { slug: "brno", name: "Brno", publicLabel: "Brno", relation: "nearby", medianPriceSqm: 98_000, medianRentSqm: 310 },
    { slug: "praha-vinohrady", name: "Vinohrady", publicLabel: "Praha — Vinohrady", relation: "sibling", medianPriceSqm: 168_000, medianRentSqm: 480 },
    { slug: "praha-smichov", name: "Smíchov", publicLabel: "Praha — Smíchov", relation: "sibling", medianPriceSqm: 155_000, medianRentSqm: 445 },
  ],
  strategySlugs: ["dlouhodoby-pronajem", "vlastni-bydleni", "flip"],
  guideSlugs: ["co-je-majetio-skore", "odhad-hodnoty-vs-nabidkova-cena"],
  segmentDistributions: {
    "pt:APARTMENT|age:secondary|lay:2+kk": {
      askingPriceSqm: {
        p25: 128_000,
        p50: 142_000,
        p75: 158_000,
        sampleCount: 142,
        confidence: 0.88,
      },
      rentSqm: {
        p25: 380,
        p50: 420,
        p75: 465,
        sampleCount: 96,
        confidence: 0.85,
      },
    },
    "pt:APARTMENT|age:secondary|lay:3+kk": {
      askingPriceSqm: {
        p25: 118_000,
        p50: 130_000,
        p75: 145_000,
        sampleCount: 88,
        confidence: 0.84,
      },
      rentSqm: {
        p25: 350,
        p50: 390,
        p75: 430,
        sampleCount: 64,
        confidence: 0.8,
      },
    },
    "pt:HOUSE|age:secondary|lay:ALL": {
      askingPriceSqm: {
        p25: 95_000,
        p50: 102_000,
        p75: 118_000,
        sampleCount: 28,
        confidence: 0.62,
      },
    },
  },
  seasonalityContext: {
    available: true,
    drivers: ["tourism", "students"],
    note: "Sezónní výkyvy short-term a studentského nájmu — tagy ze zdroje lokality, ne stereotyp města.",
  },
  shortTermRentalContext: {
    available: true,
    tourismDemandIndex: 72,
    estimatedOccupancyPct: 58,
    period: PERIOD,
    source: "Partnerský STR feed (demo agregát)",
    sampleCount: 410,
  },
  regulatoryContext: {
    available: true,
    shortTermRentalLevel: "limited",
    summary:
      "Municipální pravidla omezují krátkodobé pronájmy v části Prahy — ověřte aktuální vyhlášku před STR strategií.",
    source: "Demo regulatory digest · MHMP",
    effectiveFrom: "2024-01-01",
  },
};

const BRNO: LocationPageProfile = {
  ...PRAHA,
  location: {
    id: "demo-brno",
    slug: "brno",
    name: "Brno",
    publicLabel: "Brno",
    type: "CITY",
    hierarchyLabel: "Statutární město · Jihomoravský kraj",
    searchLokalita: "Brno",
    canonicalPath: "/lokality/brno",
    pathSegments: ["brno"],
  },
  heroSummary:
    "Druhý největší rezidenční trh — nižší vstupní cena než Praha, silný studentský nájem a rozvíjející se novostavby.",
  summary: [
    metric(
      "property_market.median_asking_price_sqm",
      "Medián nabídky",
      98_000,
      "Kč/m²",
      "98 000 Kč/m²",
      { trend: "up", changeLabel: "+5,1 % YoY", sampleCount: 88, confidence: 0.84 },
    ),
    metric(
      "property_market.median_transaction_price_sqm",
      "Medián transakcí",
      89_000,
      "Kč/m²",
      "89 000 Kč/m²",
      { trend: "up", changeLabel: "+4,4 % YoY", sampleCount: 52, confidence: 0.79 },
    ),
    metric(
      "rental_market.median_asking_rent_sqm",
      "Medián nájmu",
      310,
      "Kč/m²/měs.",
      "310 Kč/m²/měs.",
      { trend: "up", changeLabel: "+3,6 % YoY", sampleCount: 74, confidence: 0.81 },
    ),
    metric(
      "investment.gross_rental_yield",
      "Hrubý výnos",
      3.95,
      "% p.a.",
      "3,95 %",
      { trend: "up", changeLabel: "+0,3 p.b. YoY", sampleCount: 74, confidence: 0.76 },
    ),
  ],
  ...buildPriceHistory(98_000, 310),
  supplyDemand: {
    ...PRAHA.supplyDemand,
    activeListings: metric(
      "property_market.active_listings_count",
      "Aktivní inzeráty",
      620,
      "ks",
      "620",
      { sampleCount: 620 },
    ),
    medianDom: metric(
      "property_market.median_days_on_market",
      "Medián DOM",
      45,
      "dní",
      "45 dní",
      { sampleCount: 210 },
    ),
    priceReductionRate: metric(
      "property_market.price_reduction_rate",
      "Podíl se slevou",
      0.26,
      "podíl",
      "26 %",
      { sampleCount: 620 },
    ),
  },
  investment: {
    grossYield: metric(
      "investment.gross_rental_yield",
      "Hrubý nájemní výnos",
      3.95,
      "%",
      "3,95 %",
      { sampleCount: 74 },
    ),
    highlights: [
      "Studentská poptávka v blízkosti VUT a MU.",
      "Nižší absolutní cena — lepší cash-flow při správném segmentu.",
    ],
  },
  transport: {
    transitScore: metric(
      "infrastructure.transit_score",
      "Dopravní dostupnost",
      71,
      "index",
      "71 / 100",
    ),
    amenities: [
      { label: "Tram / bus", value: "Dobrá", note: "Centrum + Líšeň, Bystrc" },
      { label: "Obchody", value: "Dobrá" },
      { label: "Školy", value: "Výborná", note: "Univerzitní město" },
      { label: "Zeleň", value: "Dobrá", note: "Přírodní parky na okraji" },
    ],
  },
  development: {
    unitsUnderConstruction: metric(
      "development.units_under_construction",
      "Jednotky ve výstavbě",
      980,
      "ks",
      "980",
    ),
    pipelineNote: "Rostoucí aktivita developerů v okolí centra a u Dopravního uzlu.",
    highlights: ["Nové rezidence na Ponavě.", "Projekty u hlavního nádraží."],
  },
  risks: [
    {
      title: "Koncentrace studentského nájmu",
      description: "Sezónní fluktuace obsazenosti mimo akademický rok.",
      level: "medium",
    },
    {
      title: "Nová výstavba",
      description: "Nárůst nabídky může tlumit růst nájmů v periferních lokalitách.",
      level: "medium",
    },
  ],
  neighbors: [
    { slug: "praha", name: "Praha", publicLabel: "Praha", relation: "nearby", medianPriceSqm: 142_000, medianRentSqm: 420 },
    { slug: "ostrava", name: "Ostrava", publicLabel: "Ostrava", relation: "nearby", medianPriceSqm: 52_000, medianRentSqm: 195 },
  ],
  strategySlugs: ["dlouhodoby-pronajem", "rekonstrukce"],
  guideSlugs: ["financovani-a-hypotekajasne"],
  segmentDistributions: {
    "pt:APARTMENT|age:secondary|lay:2+kk": {
      askingPriceSqm: {
        p25: 88_000,
        p50: 98_000,
        p75: 108_000,
        sampleCount: 88,
        confidence: 0.84,
      },
      rentSqm: {
        p25: 280,
        p50: 310,
        p75: 345,
        sampleCount: 74,
        confidence: 0.81,
      },
    },
    "pt:APARTMENT|age:secondary|lay:3+kk": {
      askingPriceSqm: {
        p25: 82_000,
        p50: 90_000,
        p75: 99_000,
        sampleCount: 52,
        confidence: 0.78,
      },
      rentSqm: {
        p25: 260,
        p50: 290,
        p75: 320,
        sampleCount: 48,
        confidence: 0.76,
      },
    },
  },
  seasonalityContext: {
    available: true,
    drivers: ["students"],
    note: "Studentská poptávka u VŠ kampusů — tag ze zdroje lokality.",
  },
  shortTermRentalContext: {
    available: false,
    tourismDemandIndex: null,
    estimatedOccupancyPct: null,
    source: null,
    sampleCount: null,
  },
  regulatoryContext: {
    available: false,
    shortTermRentalLevel: "unknown",
    summary: null,
    source: null,
    effectiveFrom: null,
  },
};

const VINOHRADY: LocationPageProfile = {
  ...PRAHA,
  location: {
    id: "demo-praha-vinohrady",
    slug: "praha-vinohrady",
    name: "Vinohrady",
    publicLabel: "Praha — Vinohrady",
    type: "NEIGHBORHOOD",
    hierarchyLabel: "Čtvrť · Praha 2 / Praha 3",
    searchLokalita: "Vinohrady",
    canonicalPath: "/lokality/praha/vinohrady",
    pathSegments: ["praha", "vinohrady"],
  },
  heroSummary:
    "Prefabrikovaná i prvorepubliková zástavba s vysokou poptávkou po nájmu a prémiovým mediánem cen vůči pražskému průměru.",
  summary: [
    metric(
      "property_market.median_asking_price_sqm",
      "Medián nabídky",
      168_000,
      "Kč/m²",
      "168 000 Kč/m²",
      { trend: "up", changeLabel: "+3,8 % YoY", sampleCount: 64, confidence: 0.86 },
    ),
    metric(
      "property_market.median_transaction_price_sqm",
      "Medián transakcí",
      152_000,
      "Kč/m²",
      "152 000 Kč/m²",
      { trend: "up", changeLabel: "+2,9 % YoY", sampleCount: 38, confidence: 0.8 },
    ),
    metric(
      "rental_market.median_asking_rent_sqm",
      "Medián nájmu",
      480,
      "Kč/m²/měs.",
      "480 Kč/m²/měs.",
      { trend: "up", changeLabel: "+2,4 % YoY", sampleCount: 52, confidence: 0.83 },
    ),
    metric(
      "investment.gross_rental_yield",
      "Hrubý výnos",
      3.35,
      "% p.a.",
      "3,35 %",
      { trend: "flat", changeLabel: "±0,1 p.b. YoY", sampleCount: 52, confidence: 0.77 },
    ),
  ],
  ...buildPriceHistory(168_000, 480),
  supplyDemand: {
    activeListings: metric(
      "property_market.active_listings_count",
      "Aktivní inzeráty",
      210,
      "ks",
      "210",
      { sampleCount: 210 },
    ),
    medianDom: metric(
      "property_market.median_days_on_market",
      "Medián DOM",
      32,
      "dní",
      "32 dní",
      { sampleCount: 120 },
    ),
    priceReductionRate: metric(
      "property_market.price_reduction_rate",
      "Podíl se slevou",
      0.18,
      "podíl",
      "18 %",
      { sampleCount: 210 },
    ),
  },
  neighbors: [
    { slug: "praha", name: "Praha", publicLabel: "Praha", relation: "parent", medianPriceSqm: 142_000, medianRentSqm: 420 },
    { slug: "brno", name: "Brno", publicLabel: "Brno", relation: "nearby", medianPriceSqm: 98_000, medianRentSqm: 310 },
  ],
  strategySlugs: ["dlouhodoby-pronajem", "vlastni-bydleni"],
  guideSlugs: ["odhad-hodnoty-vs-nabidkova-cena"],
  segmentDistributions: {
    "pt:APARTMENT|age:secondary|lay:2+kk": {
      askingPriceSqm: {
        p25: 152_000,
        p50: 168_000,
        p75: 185_000,
        sampleCount: 64,
        confidence: 0.86,
      },
      rentSqm: {
        p25: 440,
        p50: 480,
        p75: 530,
        sampleCount: 52,
        confidence: 0.83,
      },
    },
    "pt:APARTMENT|age:secondary|lay:3+kk": {
      askingPriceSqm: {
        p25: 145_000,
        p50: 158_000,
        p75: 175_000,
        sampleCount: 48,
        confidence: 0.82,
      },
      rentSqm: {
        p25: 410,
        p50: 450,
        p75: 500,
        sampleCount: 40,
        confidence: 0.8,
      },
    },
  },
  regulatoryContext: {
    available: true,
    shortTermRentalLevel: "restricted",
    summary:
      "Vinohrady: přísnější lokální omezení krátkodobých pronájmů než pražský průměr (demo digest).",
    source: "Demo regulatory digest · MHMP / MČ",
    effectiveFrom: "2024-01-01",
  },
};

/**
 * Smaller city — intentionally LOW confidence / thin samples.
 * Used to exercise noindex, suppressed percentiles, and fallback UX.
 * SYNTHETIC DEMO ONLY — not production market data.
 */
const LIBEREC: LocationPageProfile = {
  ...PRAHA,
  location: {
    id: "demo-liberec",
    slug: "liberec",
    name: "Liberec",
    publicLabel: "Liberec",
    type: "CITY",
    hierarchyLabel: "Statutární město · Liberecký kraj",
    searchLokalita: "Liberec",
    canonicalPath: "/lokality/liberec",
    pathSegments: ["liberec"],
  },
  heroSummary:
    "Menší trh s omezeným vzorkem — demonstrační profil s nízkou confidence pro ověření thin-page a suppress pravidel.",
  summary: [
    metric(
      "property_market.median_asking_price_sqm",
      "Medián nabídky",
      62_000,
      "Kč/m²",
      "62 000 Kč/m²",
      { trend: "flat", changeLabel: "n/a", sampleCount: 12, confidence: 0.28 },
    ),
    metric(
      "property_market.median_transaction_price_sqm",
      "Medián transakcí",
      null,
      "Kč/m²",
      "Nedostatek dat",
      { sampleCount: 4, confidence: 0.1 },
    ),
    metric(
      "rental_market.median_asking_rent_sqm",
      "Medián nájmu",
      210,
      "Kč/m²/měs.",
      "210 Kč/m²/měs.",
      { sampleCount: 9, confidence: 0.22 },
    ),
    metric(
      "investment.gross_rental_yield",
      "Hrubý výnos",
      null,
      "% p.a.",
      "Nedostatek dat",
      { sampleCount: 0, confidence: 0 },
    ),
  ],
  ...buildPriceHistory(62_000, 210),
  supplyDemand: {
    activeListings: metric(
      "property_market.active_listings_count",
      "Aktivní inzeráty",
      48,
      "ks",
      "48",
      { sampleCount: 48 },
    ),
    medianDom: metric(
      "property_market.median_days_on_market",
      "Medián DOM",
      72,
      "dní",
      "72 dní",
      { sampleCount: 18 },
    ),
    priceReductionRate: metric(
      "property_market.price_reduction_rate",
      "Podíl se slevou",
      null,
      "podíl",
      "Nedostatek dat",
      { sampleCount: 8 },
    ),
  },
  investment: {
    grossYield: metric(
      "investment.gross_rental_yield",
      "Hrubý nájemní výnos",
      null,
      "%",
      "Nedostatek dat",
      { sampleCount: 0 },
    ),
    highlights: [
      "Tenký vzorek — investiční metriky záměrně potlačeny.",
    ],
  },
  neighbors: [
    { slug: "praha", name: "Praha", publicLabel: "Praha", relation: "nearby", medianPriceSqm: 142_000, medianRentSqm: 420 },
    { slug: "brno", name: "Brno", publicLabel: "Brno", relation: "nearby", medianPriceSqm: 98_000, medianRentSqm: 310 },
  ],
  strategySlugs: ["dlouhodoby-pronajem"],
  guideSlugs: [],
  segmentDistributions: {
    "pt:APARTMENT|age:secondary|lay:2+kk": {
      askingPriceSqm: {
        p25: 55_000,
        p50: 62_000,
        p75: 70_000,
        sampleCount: 12,
        confidence: 0.28,
      },
    },
  },
  seasonalityContext: undefined,
  shortTermRentalContext: {
    available: false,
    tourismDemandIndex: null,
    estimatedOccupancyPct: null,
    source: null,
    sampleCount: null,
  },
  regulatoryContext: {
    available: false,
    shortTermRentalLevel: "unknown",
    summary: null,
    source: null,
    effectiveFrom: null,
  },
};

export const LOCATION_DEMO_PROFILES: Record<string, LocationPageProfile> = {
  praha: PRAHA,
  brno: BRNO,
  "praha-vinohrady": VINOHRADY,
  liberec: LIBEREC,
};

export type LocationDemoSlug = keyof typeof LOCATION_DEMO_PROFILES;

/** All synthetic demo slugs (not production). Prefer isLocationPageIndexable for SEO. */
export const INDEXABLE_LOCATION_SLUGS = Object.keys(LOCATION_DEMO_PROFILES);

/** Explicit confidence tiers for QA — never confuse with live feeds. */
export const DEMO_CONFIDENCE_TIERS = {
  praha: "high",
  brno: "medium-high",
  "praha-vinohrady": "high",
  liberec: "low",
} as const;
