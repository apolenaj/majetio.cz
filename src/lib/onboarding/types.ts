import { PropertyType } from "@prisma/client";

export const ONBOARDING_GOALS = [
  {
    id: "OWN_HOME",
    label: "Vlastní bydlení",
    description: "Hledám nemovitost pro sebe nebo rodinu.",
  },
  {
    id: "INVESTMENT",
    label: "Investice",
    description: "Zajímá mě výnos, cash flow a dlouhodobý pronájem.",
  },
  {
    id: "RENOVATION",
    label: "Rekonstrukce",
    description: "Počítám s úpravami a zhodnocením nemovitosti.",
  },
  {
    id: "FLIP",
    label: "Flip",
    description: "Nákup, úprava a rychlejší prodej.",
  },
  {
    id: "EXPLORING",
    label: "Rozhlížím se",
    description: "Zatím si ujasňuji možnosti — bez závazku.",
  },
] as const;

export type OnboardingGoalId = (typeof ONBOARDING_GOALS)[number]["id"];

export const PROPERTY_TYPE_OPTIONS = [
  { id: PropertyType.APARTMENT, label: "Byt" },
  { id: PropertyType.HOUSE, label: "Dům" },
  { id: PropertyType.LAND, label: "Pozemek" },
  { id: PropertyType.COMMERCIAL, label: "Komerční" },
  { id: PropertyType.OTHER, label: "Jiné" },
] as const;

export const CZECH_REGIONS = [
  "Hlavní město Praha",
  "Středočeský kraj",
  "Jihočeský kraj",
  "Plzeňský kraj",
  "Karlovarský kraj",
  "Ústecký kraj",
  "Liberecký kraj",
  "Královéhradecký kraj",
  "Pardubický kraj",
  "Kraj Vysočina",
  "Jihomoravský kraj",
  "Olomoucký kraj",
  "Zlínský kraj",
  "Moravskoslezský kraj",
] as const;

export const FINANCING_OPTIONS = [
  {
    id: "MORTGAGE",
    label: "Hypotéka",
    description: "Většinu kupní ceny plánuji financovat úvěrem.",
  },
  {
    id: "MIXED",
    label: "Kombinace",
    description: "Část vlastních zdrojů a část hypotéky.",
  },
  {
    id: "CASH",
    label: "Hotovost",
    description: "Počítám s koupí bez hypotečního úvěru.",
  },
] as const;

export type FinancingModeId = (typeof FINANCING_OPTIONS)[number]["id"];

export const INVESTMENT_STRATEGY_OPTIONS = [
  { id: "dlouhodoby-pronajem", label: "Dlouhodobý pronájem" },
  { id: "kratkodoby-pronajem", label: "Krátkodobý pronájem" },
  { id: "flip", label: "Flip" },
  { id: "rekonstrukce", label: "Rekonstrukce + výnos" },
] as const;

export type OnboardingStepId =
  | "goal"
  | "propertyType"
  | "location"
  | "budget"
  | "equity"
  | "financing"
  | "strategy"
  | "investmentPrefs"
  | "complete";

export type OnboardingState = {
  goal: OnboardingGoalId | null;
  propertyTypes: PropertyType[];
  preferredCity: string;
  regions: string[];
  maxPriceCzk: number | null;
  availableEquityCzk: number | null;
  equityPercent: number | null;
  financingMode: FinancingModeId | null;
  strategies: string[];
  targetGrossYieldPct: number | null;
  targetCashFlowMonthlyCzk: number | null;
  step: OnboardingStepId;
  completed: boolean;
  skipped: boolean;
};

export function needsInvestmentSteps(goal: OnboardingGoalId | null): boolean {
  return goal === "INVESTMENT";
}

export function getVisibleSteps(goal: OnboardingGoalId | null): OnboardingStepId[] {
  const base: OnboardingStepId[] = [
    "goal",
    "propertyType",
    "location",
    "budget",
    "equity",
    "financing",
  ];
  if (needsInvestmentSteps(goal)) {
    base.push("strategy", "investmentPrefs");
  }
  base.push("complete");
  return base;
}

export function stepTitle(step: OnboardingStepId): string {
  switch (step) {
    case "goal":
      return "Jaký je váš cíl?";
    case "propertyType":
      return "Jaký typ nemovitosti hledáte?";
    case "location":
      return "Kde hledáte?";
    case "budget":
      return "Jaký je váš maximální rozpočet?";
    case "equity":
      return "Kolik máte vlastních zdrojů?";
    case "financing":
      return "Jak plánujete financovat?";
    case "strategy":
      return "Jaká investiční strategie?";
    case "investmentPrefs":
      return "Jaké výnosy očekáváte?";
    case "complete":
      return "Hotovo — máme základní obrázek";
  }
}

export function stepDescription(step: OnboardingStepId): string {
  switch (step) {
    case "goal":
      return "Stačí jedna volba. Podle ní upravíme další otázky.";
    case "propertyType":
      return "Můžete vybrat i více typů.";
    case "location":
      return "Město a kraj stačí — přesnou adresu nepotřebujeme.";
    case "budget":
      return "Orientační horní hranice kupní ceny.";
    case "equity":
      return "Volitelné. Můžete zadat částku, procento, nebo přeskočit.";
    case "financing":
      return "Později to můžete změnit ve finančním profilu.";
    case "strategy":
      return "Jen pro investiční cíl — u vlastního bydlení se na to neptáme.";
    case "investmentPrefs":
      return "Orientační hodnoty. Nejde o závazek ani doporučení.";
    case "complete":
      return "Údaje jsme uložili. Můžete pokračovat k nemovitostem nebo analýze.";
  }
}

export function emptyOnboardingState(): OnboardingState {
  return {
    goal: null,
    propertyTypes: [],
    preferredCity: "",
    regions: [],
    maxPriceCzk: null,
    availableEquityCzk: null,
    equityPercent: null,
    financingMode: null,
    strategies: [],
    targetGrossYieldPct: null,
    targetCashFlowMonthlyCzk: null,
    step: "goal",
    completed: false,
    skipped: false,
  };
}

export function goalLabel(goal: OnboardingGoalId | null): string {
  return ONBOARDING_GOALS.find((g) => g.id === goal)?.label ?? "—";
}
