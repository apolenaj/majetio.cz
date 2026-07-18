import { formatCzk } from "@/lib/format";
import type {
  PassportRecommendation,
  PassportState,
} from "@/lib/financial-passport/types";

/** Typical bank LTV assumption for illustrative gap only — never a hard decision. */
const ILLUSTRATIVE_LTV = 0.8;

export function buildPassportRecommendations(
  state: PassportState,
): PassportRecommendation[] {
  const tips: PassportRecommendation[] = [];

  if (
    state.maxPriceCzk != null &&
    state.maxPriceCzk > 0 &&
    (state.financingMode === "MORTGAGE" || state.financingMode === "MIXED")
  ) {
    const neededEquity = Math.round(state.maxPriceCzk * (1 - ILLUSTRATIVE_LTV));
    const available =
      state.availableEquityCzk ??
      (state.equityPercent != null
        ? Math.round((state.equityPercent / 100) * state.maxPriceCzk)
        : null);

    if (available == null) {
      tips.push({
        id: "equity-missing",
        tone: "info",
        title: "Orientační: vlastní zdroje pro 80% LTV",
        body: `Pro orientační 80% LTV při rozpočtu ${formatCzk(state.maxPriceCzk)} by typicky připadalo asi ${formatCzk(neededEquity)} vlastních zdrojů. Nejde o posouzení úvěruschopnosti ani zamítnutí.`,
        indicative: true,
      });
    } else if (available < neededEquity) {
      const gap = neededEquity - available;
      tips.push({
        id: "equity-gap",
        tone: "warning",
        title: "Orientační: chybějící vlastní zdroje",
        body: `Pro 80% LTV na ${formatCzk(state.maxPriceCzk)} vám podle zadaných údajů chybí asi ${formatCzk(gap)} vlastních zdrojů. Jde o orientační výpočet, nikoli o rozhodnutí banky ani zamítnutí.`,
        indicative: true,
      });
    } else {
      tips.push({
        id: "equity-ok",
        tone: "info",
        title: "Orientační: vlastní zdroje a 80% LTV",
        body: `Při rozpočtu ${formatCzk(state.maxPriceCzk)} a zadaných vlastních zdrojích (${formatCzk(available)}) vychází orientačně pokrytí pro ilustrativní 80% LTV. Skutečné podmínky se liší podle banky a situace.`,
        indicative: true,
      });
    }
  }

  if (
    state.monthlyIncomeCzk != null &&
    state.monthlyIncomeCzk > 0 &&
    state.monthlyLiabilitiesCzk != null &&
    state.monthlyLiabilitiesCzk > 0
  ) {
    const ratio = state.monthlyLiabilitiesCzk / state.monthlyIncomeCzk;
    if (ratio >= 0.4) {
      tips.push({
        id: "dti-high",
        tone: "warning",
        title: "Orientační: podíl závazků k příjmu",
        body: `Závazky představují asi ${Math.round(ratio * 100)} % zadaného měsíčního příjmu. Jde o orientační upozornění — neposuzujeme úvěruschopnost a nejde o zamítnutí.`,
        indicative: true,
      });
    }
  }

  if (state.goal === "INVESTMENT" && state.strategies.length === 0) {
    tips.push({
      id: "strategy-missing",
      tone: "info",
      title: "Orientační: investiční strategie",
      body: "U cíle Investice pomáhá zvolit alespoň jednu strategii (např. dlouhodobý pronájem). Bez ní zůstávají doporučení obecnější.",
      indicative: true,
    });
  }

  if (!state.riskTolerance) {
    tips.push({
      id: "risk-missing",
      tone: "info",
      title: "Tolerance rizika",
      body: "Doplňte konzervativní / vyvážený / dynamický profil — pomůže to při řazení tipů. Nejde o investiční doporučení ve smyslu zákona.",
      indicative: true,
    });
  }

  return tips.slice(0, 4);
}
