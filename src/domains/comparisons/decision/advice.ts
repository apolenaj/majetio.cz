/**
 * nextAction + decision advice (BOD 108–110).
 * Advises what is missing — never decides for the user ("Kupte tuto").
 */

import type {
  DecisionAdvice,
  PropertyNextAction,
  RiskDecisionSummary,
  RenovationDecisionMetrics,
  FinancingDecisionMetrics,
} from "./types";
import type { CompletenessGap } from "./completeness";

export function buildPropertyNextAction(input: {
  propertyId: string;
  slug: string;
  risks: RiskDecisionSummary;
  renovation: RenovationDecisionMetrics;
  financing: FinancingDecisionMetrics | null;
  gaps: CompletenessGap[];
  favouriteStatus?: string | null;
}): PropertyNextAction {
  const gapIds = new Set(input.gaps.map((g) => g.id));

  if (input.risks.counts.critical > 0 || gapIds.has("risk_detail")) {
    return {
      id: "verify_condition",
      labelCs: "Ověřit technický stav",
      href: `/nemovitosti/${input.slug}#rizika`,
      reasonCs:
        "Doporučený krok: ověřit technický stav — u nabídky jsou kritická nebo nedoložená rizika.",
    };
  }

  if (gapIds.has("financing") || (input.financing?.financingGapCzk ?? 0) > 0) {
    return {
      id: "resolve_mortgage",
      labelCs: "Řešit hypotéku / equity",
      href: `/analyza?property=${input.slug}`,
      reasonCs:
        "Doporučený krok: doplnit financování — chybí equity, splátka nebo je financing gap.",
    };
  }

  if (gapIds.has("renovation") || (input.renovation.costHighCzk ?? 0) > 1_000_000) {
    return {
      id: "renovation_scope",
      labelCs: "Upřesnit rekonstrukci",
      href: `/kalkulacky/rekonstrukce`,
      reasonCs:
        "Doporučený krok: spočítat rozsah rekonstrukce (low/base/high) před rozhodnutím o nabídce.",
    };
  }

  if (input.favouriteStatus === "CONSIDERING" || input.favouriteStatus === "VIEWING") {
    return {
      id: "book_viewing",
      labelCs: "Objednat prohlídku",
      href: `/nemovitosti/${input.slug}`,
      reasonCs: "Doporučený krok: domluvit prohlídku a ověřit realitu inzerátu.",
    };
  }

  if (gapIds.has("valuation")) {
    return {
      id: "run_valuation",
      labelCs: "Spočítat odhad hodnoty",
      href: `/nemovitosti/${input.slug}`,
      reasonCs: "Doporučený krok: doplnit valuaci pro vyjednávací prostor.",
    };
  }

  return {
    id: "review_comparison",
    labelCs: "Porovnat detaily v tabulce",
    href: null,
    reasonCs:
      "Doporučený krok: projít rozdíly metrik — systém neradí, kterou nemovitost koupit.",
  };
}

/**
 * Advisory copy — always framed as missing inputs, never a purchase verdict.
 */
export function buildDecisionAdvice(input: {
  gaps: CompletenessGap[];
  nextAction: PropertyNextAction | null;
}): DecisionAdvice {
  const missingCs = input.gaps.map((g) => g.labelCs);
  const headlineCs =
    missingCs.length === 0
      ? "K rozhodnutí máte většinu podkladů — finální volba zůstává na vás."
      : `K rozhodnutí vám chybí: ${missingCs.slice(0, 3).join(", ")}${
          missingCs.length > 3 ? "…" : ""
        }.`;

  return {
    headlineCs,
    missingCs,
    recommendedStepCs: input.nextAction?.reasonCs ?? null,
  };
}

export function buildOverallAdvice(input: {
  propertyAdvices: DecisionAdvice[];
}): DecisionAdvice {
  const missing = new Set<string>();
  for (const a of input.propertyAdvices) {
    for (const m of a.missingCs) missing.add(m);
  }
  const missingCs = [...missing];
  const headlineCs =
    missingCs.length === 0
      ? "K rozhodnutí máte podklady u porovnávaných nabídek — Majetio nerozhoduje za vás."
      : `K rozhodnutí vám chybí: ${missingCs.slice(0, 4).join(", ")}${
          missingCs.length > 4 ? "…" : ""
        }.`;

  const recommendedStepCs =
    input.propertyAdvices.find((a) => a.recommendedStepCs)?.recommendedStepCs ??
    null;

  return { headlineCs, missingCs, recommendedStepCs };
}
