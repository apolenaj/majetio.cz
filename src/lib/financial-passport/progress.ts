import type { PassportProgress, PassportState } from "@/lib/financial-passport/types";

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function hasNumber(value: number | null | undefined): boolean {
  return value != null && Number.isFinite(value);
}

export function evaluatePassportSections(state: PassportState) {
  return [
    {
      id: "goal",
      letter: "A",
      title: "Cíl",
      filled: state.goal != null,
    },
    {
      id: "budget",
      letter: "B",
      title: "Rozpočet",
      filled: hasNumber(state.maxPriceCzk),
    },
    {
      id: "equity",
      letter: "C",
      title: "Vlastní kapitál",
      filled: hasNumber(state.availableEquityCzk) || hasNumber(state.equityPercent),
    },
    {
      id: "financing",
      letter: "D",
      title: "Financování",
      filled: state.financingMode != null,
    },
    {
      id: "income",
      letter: "E",
      title: "Příjem",
      filled: hasNumber(state.monthlyIncomeCzk),
      optional: true as const,
    },
    {
      id: "liabilities",
      letter: "F",
      title: "Závazky",
      filled: hasNumber(state.monthlyLiabilitiesCzk),
      optional: true as const,
    },
    {
      id: "investment",
      letter: "G",
      title: "Investiční preference",
      filled:
        state.riskTolerance != null ||
        state.strategies.length > 0 ||
        hasNumber(state.targetGrossYieldPct) ||
        hasNumber(state.targetCashFlowMonthlyCzk),
    },
    {
      id: "locations",
      letter: "H",
      title: "Lokality",
      filled: hasText(state.preferredCity) || state.regions.length > 0,
    },
    {
      id: "property",
      letter: "I",
      title: "Preference nemovitosti",
      filled:
        state.propertyTypes.length > 0 ||
        state.dispositions.length > 0 ||
        hasNumber(state.minAreaSqm) ||
        hasNumber(state.maxAreaSqm),
    },
  ] as const;
}

/**
 * Základní → Rozšířený → Připravený k personalizaci
 * Optional income/liabilities never block progress.
 */
export function computePassportProgress(state: PassportState): PassportProgress {
  const sections = evaluatePassportSections(state).map(({ id, letter, title, filled }) => ({
    id,
    letter,
    title,
    filled,
  }));

  const required = sections.filter((s) => s.id !== "income" && s.id !== "liabilities");
  const filledRequired = required.filter((s) => s.filled).length;
  const totalRequired = required.length;
  const percent = Math.round((filledRequired / totalRequired) * 100);

  const a = sections.find((s) => s.id === "goal")!.filled;
  const b = sections.find((s) => s.id === "budget")!.filled;
  const c = sections.find((s) => s.id === "equity")!.filled;
  const d = sections.find((s) => s.id === "financing")!.filled;
  const g = sections.find((s) => s.id === "investment")!.filled;
  const h = sections.find((s) => s.id === "locations")!.filled;
  const i = sections.find((s) => s.id === "property")!.filled;

  const basicCore = [a, b, c, d].filter(Boolean).length >= 3 && a && d;
  const extended = basicCore && h && i;
  const ready =
    extended &&
    g &&
    (state.goal !== "INVESTMENT" ||
      state.strategies.length > 0 ||
      state.riskTolerance != null);

  let level: PassportProgress["level"] = "empty";
  let label = "Nezačato";
  let description = "Doplňte základní údaje, abychom mohli přizpůsobit doporučení.";

  if (ready) {
    level = "ready";
    label = "Připravený k personalizaci";
    description =
      "Máme dostatek údajů pro orientační doporučení. Můžete je kdykoli upravit.";
  } else if (extended) {
    level = "extended";
    label = "Rozšířený";
    description =
      "Lokality a typ nemovitosti jsou vyplněné. Doplňte investiční preference pro personalizaci.";
  } else if (basicCore) {
    level = "basic";
    label = "Základní";
    description = "Základ pasu je hotový. Doplňte lokality a preference nemovitosti.";
  } else if (filledRequired > 0) {
    level = "empty";
    label = "Rozpracovaný";
    description = "Pokračujte v doplňování — stačí krátké sekce, nic není povinné naráz.";
  }

  return {
    level,
    label,
    description,
    percent,
    filledSections: sections.filter((s) => s.filled).length,
    totalSections: sections.length,
    sections,
  };
}
