/**
 * UI-only financial overlays for property detail (Prompt 9 Part 3).
 * DEMO / placeholder data — not a valuation engine. Never invent zeros in UI;
 * omit a slug (or leave fields null) when analysis is unavailable.
 */

export type ValuationConfidence = "high" | "medium" | "low";

export type PropertyValuationDemo = {
  lowCzk: number;
  midCzk: number;
  highCzk: number;
  confidence: ValuationConfidence;
  confidenceReason: string;
};

export type CashFlowWaterfallDemo = {
  rentMonthlyCzk: number;
  operatingCostsMonthlyCzk: number;
  mortgageMonthlyCzk: number | null;
  /** Explicit CF — do not recompute as source of truth in UI if set */
  cashFlowMonthlyCzk: number;
  inputsNote: string;
};

export type InvestmentOverviewDemo = {
  estimatedRentMonthlyCzk: number | null;
  grossYieldPct: number | null;
  netYieldPct: number | null;
  cashFlowMonthlyCzk: number | null;
  waterfall: CashFlowWaterfallDemo | null;
};

export type ScenarioId =
  | "own_home"
  | "long_term_rent"
  | "flip"
  | "renovation"
  | "custom";

export type PropertyScenarioDemo = {
  id: ScenarioId;
  label: string;
  relevant: boolean;
  benefit: string;
  risk: string;
  capitalRequiredCzk: number | null;
  capitalLabel: string;
  metrics: { label: string; value: string }[];
  /** Defaults for custom scenario editor (client-only) */
  assumptionDefaults?: {
    rentMonthlyCzk: number | null;
    costsMonthlyCzk: number | null;
    equityCzk: number | null;
  };
};

export type RenovationDemo = {
  /** @deprecated Prefer costBaseCzk — kept as alias for older callers. */
  costCzk: number | null;
  costLowCzk?: number | null;
  costBaseCzk?: number | null;
  costHighCzk?: number | null;
  /** Expected renovation duration in days. */
  durationDays?: number | null;
  reserveCzk: number | null;
  valueAfterCzk: number | null;
  maxOfferCzk: number | null;
  note: string;
  risks?: Array<{
    title: string;
    severity: "critical" | "high" | "medium" | "low";
  }>;
  locationScore?: number | null;
  locationConfidence?: ValuationConfidence | null;
  /** Demo IRR % — omit when unknown (never invent 0). */
  irrPct?: number | null;
  irrAssumptionsCs?: string;
};

export type PropertyFinancialDemo = {
  slug: string;
  isDemo: true;
  valuation: PropertyValuationDemo | null;
  investment: InvestmentOverviewDemo | null;
  scenarios: PropertyScenarioDemo[];
  renovation: RenovationDemo | null;
};

const VINOHRADY: PropertyFinancialDemo = {
  slug: "demo-byt-3kk-vinohrady",
  isDemo: true,
  valuation: {
    lowCzk: 6_050_000,
    midCzk: 6_280_000,
    highCzk: 6_520_000,
    confidence: "medium",
    confidenceReason:
      "Odhad vychází z demonstračních comparables a lokality. Chybí ověřený výpis a stavební stav — spolehlivost je střední.",
  },
  investment: {
    estimatedRentMonthlyCzk: 29_500,
    grossYieldPct: 5.4,
    netYieldPct: 3.1,
    cashFlowMonthlyCzk: 2_400,
    waterfall: {
      rentMonthlyCzk: 29_500,
      operatingCostsMonthlyCzk: 8_200,
      mortgageMonthlyCzk: 18_900,
      cashFlowMonthlyCzk: 2_400,
      inputsNote:
        "Nájem a náklady jsou demonstrační vstupy. Splátka je orientační mock HypotekaJasne — ne závazná nabídka.",
    },
  },
  scenarios: [
    {
      id: "own_home",
      label: "Vlastní bydlení",
      relevant: true,
      benefit: "Stabilní bydlení v atraktivní lokalitě s dobrou dostupností.",
      risk: "Nabídková cena nad středem odhadu — riziko přeplacení.",
      capitalRequiredCzk: 1_300_000,
      capitalLabel: "Orientační vlastní zdroje (20 %)",
      metrics: [
        { label: "Cena vs. odhad", value: "Nad středem" },
        { label: "Splátka (orientačně)", value: "cca 18 900 Kč/měs." },
      ],
    },
    {
      id: "long_term_rent",
      label: "Dlouhodobý pronájem",
      relevant: true,
      benefit: "Kladné demonstrační cash flow po nákladech a splátce.",
      risk: "Neobsazenost a růst provozních nákladů mohou CF snížit.",
      capitalRequiredCzk: 1_300_000,
      capitalLabel: "Vstupní kapitál (orientačně)",
      metrics: [
        { label: "Hrubý výnos", value: "5,4 %" },
        { label: "Čistý výnos", value: "3,1 %" },
        { label: "Cash flow", value: "+2 400 Kč/měs." },
      ],
      assumptionDefaults: {
        rentMonthlyCzk: 29_500,
        costsMonthlyCzk: 8_200,
        equityCzk: 1_300_000,
      },
    },
    {
      id: "flip",
      label: "Flip",
      relevant: false,
      benefit: "",
      risk: "",
      capitalRequiredCzk: null,
      capitalLabel: "",
      metrics: [],
    },
    {
      id: "custom",
      label: "Vlastní scénář",
      relevant: true,
      benefit: "Dočasné úpravy vstupů jen pro vás — neukládají se do databáze.",
      risk: "Výsledek je citlivý na vaše předpoklady; nejde o doporučení.",
      capitalRequiredCzk: null,
      capitalLabel: "Podle vašich vstupů",
      metrics: [],
      assumptionDefaults: {
        rentMonthlyCzk: 29_500,
        costsMonthlyCzk: 8_200,
        equityCzk: 1_300_000,
      },
    },
  ],
  renovation: {
    costCzk: 450_000,
    costLowCzk: 320_000,
    costBaseCzk: 450_000,
    costHighCzk: 620_000,
    durationDays: 75,
    reserveCzk: 90_000,
    valueAfterCzk: 6_900_000,
    maxOfferCzk: 6_200_000,
    note: "Lehká modernizace kuchyně a koupelny (demo). Nejde o stavební rozpočet.",
    risks: [
      { title: "Cena nad odhadem", severity: "medium" },
      { title: "SVJ omezení rekonstrukce", severity: "low" },
    ],
    locationScore: 78,
    locationConfidence: "medium",
    irrPct: 6.2,
    irrAssumptionsCs:
      "IRR demo: hold 7 let, nájem +2 %/rok, exit na ARV, CapEx = base pásmo. Citlivé na exit yield.",
  },
};

const BRNO: PropertyFinancialDemo = {
  slug: "demo-byt-2kk-brno",
  isDemo: true,
  valuation: {
    lowCzk: 3_950_000,
    midCzk: 4_150_000,
    highCzk: 4_350_000,
    confidence: "high",
    confidenceReason:
      "Demonstrační comparables v lokalitě jsou hustší a nabídková cena je blízko středu pásma.",
  },
  investment: {
    estimatedRentMonthlyCzk: 18_200,
    grossYieldPct: 5.2,
    netYieldPct: 3.4,
    cashFlowMonthlyCzk: 3_100,
    waterfall: {
      rentMonthlyCzk: 18_200,
      operatingCostsMonthlyCzk: 4_500,
      mortgageMonthlyCzk: 10_600,
      cashFlowMonthlyCzk: 3_100,
      inputsNote: "Demonstrační nájem, fond oprav a orientační splátka (mock).",
    },
  },
  scenarios: [
    {
      id: "own_home",
      label: "Vlastní bydlení",
      relevant: true,
      benefit: "Rozumný poměr ceny a lokality pro vlastní bydlení (demo).",
      risk: "Menší dispozice — omezení pro větší domácnost.",
      capitalRequiredCzk: 840_000,
      capitalLabel: "Orientační vlastní zdroje",
      metrics: [
        { label: "Cena vs. odhad", value: "Blízko středu" },
        { label: "Splátka (orientačně)", value: "cca 10 600 Kč/měs." },
      ],
    },
    {
      id: "long_term_rent",
      label: "Dlouhodobý pronájem",
      relevant: true,
      benefit: "Stabilnější cash flow v demonstračním modelu.",
      risk: "Konkurence nájmů v lokalitě.",
      capitalRequiredCzk: 840_000,
      capitalLabel: "Vstupní kapitál (orientačně)",
      metrics: [
        { label: "Hrubý výnos", value: "5,2 %" },
        { label: "Cash flow", value: "+3 100 Kč/měs." },
      ],
      assumptionDefaults: {
        rentMonthlyCzk: 18_200,
        costsMonthlyCzk: 4_500,
        equityCzk: 840_000,
      },
    },
    {
      id: "custom",
      label: "Vlastní scénář",
      relevant: true,
      benefit: "Upravte vstupy dočasně — bez zápisu do databáze.",
      risk: "Model je citlivý na vaše předpoklady.",
      capitalRequiredCzk: null,
      capitalLabel: "Podle vašich vstupů",
      metrics: [],
      assumptionDefaults: {
        rentMonthlyCzk: 18_200,
        costsMonthlyCzk: 4_500,
        equityCzk: 840_000,
      },
    },
  ],
  renovation: null,
};

const REKO: PropertyFinancialDemo = {
  slug: "demo-dum-rekonstrukce",
  isDemo: true,
  valuation: {
    lowCzk: 10_800_000,
    midCzk: 11_600_000,
    highCzk: 12_500_000,
    confidence: "low",
    confidenceReason:
      "Široké pásmo kvůli nejistotě stavebního stavu a rozsahu rekonstrukce (demo).",
  },
  investment: {
    estimatedRentMonthlyCzk: 28_000,
    grossYieldPct: 2.1,
    netYieldPct: null,
    cashFlowMonthlyCzk: -1_800,
    waterfall: {
      rentMonthlyCzk: 28_000,
      operatingCostsMonthlyCzk: 9_500,
      mortgageMonthlyCzk: 20_300,
      cashFlowMonthlyCzk: -1_800,
      inputsNote: "Před rekonstrukcí — záporné CF v demonstračním modelu.",
    },
  },
  scenarios: [
    {
      id: "renovation",
      label: "Koupě a rekonstrukce",
      relevant: true,
      benefit: "Potenciál zvýšit hodnotu po úpravách (demo).",
      risk: "Překročení rozpočtu a zpoždění stavby.",
      capitalRequiredCzk: 3_500_000,
      capitalLabel: "Kupní kapitál + rekonstrukce + rezerva",
      metrics: [
        { label: "Náklady rekonstrukce", value: "1 800 000 Kč" },
        { label: "Hodnota po", value: "14 200 000 Kč" },
      ],
    },
    {
      id: "flip",
      label: "Flip",
      relevant: true,
      benefit: "Krátký horizont při úspěšném exitu (demo, bez záruky).",
      risk: "Likvidita a tržní pokles během držby.",
      capitalRequiredCzk: 4_200_000,
      capitalLabel: "Vyšší vlastní kapitál / krátkodobé financování",
      metrics: [
        { label: "Exit (orientačně)", value: "14 200 000 Kč" },
        { label: "Horizont", value: "12–24 měsíců" },
      ],
    },
    {
      id: "long_term_rent",
      label: "Dlouhodobý pronájem",
      relevant: true,
      benefit: "Po rekonstrukci možný nájemní scénář.",
      risk: "Do dokončení úprav je CF záporné.",
      capitalRequiredCzk: 3_500_000,
      capitalLabel: "Vstup včetně rekonstrukce",
      metrics: [
        { label: "Hrubý výnos (nyní)", value: "2,1 %" },
        { label: "Cash flow", value: "−1 800 Kč/měs." },
      ],
      assumptionDefaults: {
        rentMonthlyCzk: 28_000,
        costsMonthlyCzk: 9_500,
        equityCzk: 2_500_000,
      },
    },
    {
      id: "custom",
      label: "Vlastní scénář",
      relevant: true,
      benefit: "Dočasné vstupy jen v prohlížeči.",
      risk: "Nejde o investiční doporučení.",
      capitalRequiredCzk: null,
      capitalLabel: "Podle vašich vstupů",
      metrics: [],
      assumptionDefaults: {
        rentMonthlyCzk: 28_000,
        costsMonthlyCzk: 9_500,
        equityCzk: 2_500_000,
      },
    },
  ],
  renovation: {
    costCzk: 1_800_000,
    costLowCzk: 1_200_000,
    costBaseCzk: 1_800_000,
    costHighCzk: 2_600_000,
    durationDays: 180,
    reserveCzk: 360_000,
    valueAfterCzk: 14_200_000,
    maxOfferCzk: 10_900_000,
    note: "Demonstrační odhad rozsahu rekonstrukce domu — ne stavební výkaz.",
    risks: [
      { title: "Statika / skryté vady", severity: "critical" },
      { title: "Překročení rozpočtu", severity: "high" },
      { title: "Doba výstavby", severity: "medium" },
    ],
    locationScore: 61,
    locationConfidence: "low",
    irrPct: 4.1,
    irrAssumptionsCs:
      "IRR demo: CapEx high pásmo, hold 5 let, exit na ARV −10 %. Citlivé na delay.",
  },
};

const LOW_PRICE: PropertyFinancialDemo = {
  slug: "demo-byt-2kk-nizka-cena",
  isDemo: true,
  valuation: {
    lowCzk: 3_600_000,
    midCzk: 3_950_000,
    highCzk: 4_200_000,
    confidence: "low",
    confidenceReason:
      "Nízká cena může signalizovat skrytá rizika; demonstrační data jsou neúplná.",
  },
  investment: {
    estimatedRentMonthlyCzk: 22_000,
    grossYieldPct: 6.8,
    netYieldPct: 2.0,
    cashFlowMonthlyCzk: -2_200,
    waterfall: {
      rentMonthlyCzk: 22_000,
      operatingCostsMonthlyCzk: 7_800,
      mortgageMonthlyCzk: 16_400,
      cashFlowMonthlyCzk: -2_200,
      inputsNote: "Vysoký hrubý výnos, ale záporné CF po nákladech a splátce (demo).",
    },
  },
  scenarios: [
    {
      id: "long_term_rent",
      label: "Dlouhodobý pronájem",
      relevant: true,
      benefit: "Lákavý hrubý výnos v číselníku.",
      risk: "Záporné cash flow a vysoké riziko kvality dat.",
      capitalRequiredCzk: 780_000,
      capitalLabel: "Vstupní kapitál (orientačně)",
      metrics: [
        { label: "Hrubý výnos", value: "6,8 %" },
        { label: "Cash flow", value: "−2 200 Kč/měs." },
      ],
      assumptionDefaults: {
        rentMonthlyCzk: 22_000,
        costsMonthlyCzk: 7_800,
        equityCzk: 780_000,
      },
    },
    {
      id: "own_home",
      label: "Vlastní bydlení",
      relevant: true,
      benefit: "Nižší vstupní cena.",
      risk: "Neúplná data a možné skryté vady.",
      capitalRequiredCzk: 780_000,
      capitalLabel: "Orientační vlastní zdroje",
      metrics: [{ label: "Spolehlivost odhadu", value: "Nízká" }],
    },
    {
      id: "custom",
      label: "Vlastní scénář",
      relevant: true,
      benefit: "Otestujte citlivost na nájem a náklady.",
      risk: "Model není ověřený výpočtem enginu.",
      capitalRequiredCzk: null,
      capitalLabel: "Podle vašich vstupů",
      metrics: [],
      assumptionDefaults: {
        rentMonthlyCzk: 22_000,
        costsMonthlyCzk: 7_800,
        equityCzk: 780_000,
      },
    },
  ],
  renovation: {
    costCzk: 650_000,
    costLowCzk: 480_000,
    costBaseCzk: 650_000,
    costHighCzk: 890_000,
    durationDays: 90,
    reserveCzk: 130_000,
    valueAfterCzk: 4_550_000,
    maxOfferCzk: 3_400_000,
    note: "Orientační modernizace (demo) — ověřte stav na místě.",
    risks: [{ title: "Lokalita méně likvidní", severity: "medium" }],
    locationScore: 55,
    locationConfidence: "medium",
  },
};

const BY_SLUG: Record<string, PropertyFinancialDemo> = {
  [VINOHRADY.slug]: VINOHRADY,
  [BRNO.slug]: BRNO,
  [REKO.slug]: REKO,
  [LOW_PRICE.slug]: LOW_PRICE,
};

export function getPropertyFinancialDemo(
  slug: string,
): PropertyFinancialDemo | null {
  return BY_SLUG[slug] ?? null;
}

export function confidenceLabel(c: ValuationConfidence): string {
  if (c === "high") return "Vysoká";
  if (c === "low") return "Nízká";
  return "Střední";
}
