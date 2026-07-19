/**
 * Edge cases for automated valuation (Prompt 10 Part 3).
 * Unique / atypical subjects must not get a fake automated number.
 */

import type { ValuationSubject } from "./types";

export type EdgeCaseDecision = {
  /** Block automated estimate entirely. */
  blockAutomated: boolean;
  status: "OK" | "REQUIRES_INDIVIDUAL_APPRAISAL";
  reasons: string[];
};

const UNIQUE_LAYOUT = /^(6|7|8|9|\d{2})\+/;

/**
 * Detect atypical subjects where automated comps are unreliable.
 */
export function evaluateSubjectEdgeCases(
  subject: ValuationSubject,
): EdgeCaseDecision {
  const reasons: string[] = [];

  if (subject.propertyType.toUpperCase() === "LAND") {
    reasons.push("Pozemek nelze ocenit modelem pro byty — vyžaduje individuální ocenění.");
  }
  if (subject.propertyType.toUpperCase() === "COMMERCIAL") {
    reasons.push(
      "Komerční nemovitost — automatický residential model není vhodný.",
    );
  }

  if (subject.usableArea == null || subject.usableArea <= 0) {
    reasons.push("Chybí použitelná plocha — bez ní nelze spočítat odhad.");
  } else {
    if (subject.propertyType.toUpperCase() === "APARTMENT") {
      if (subject.usableArea < 18) {
        reasons.push(
          "Extrémně malá plocha bytu — atypický případ, automatický odhad je nespolehlivý.",
        );
      }
      if (subject.usableArea > 220) {
        reasons.push(
          "Velmi velký byt (>220 m²) — řídký trh, vyžaduje individuální ocenění.",
        );
      }
    }
  }

  if (subject.layout && UNIQUE_LAYOUT.test(subject.layout.replace(/\s/g, ""))) {
    reasons.push(
      `Atypická dispozice (${subject.layout}) — málo srovnatelných nabídek.`,
    );
  }

  if ((subject.condition ?? "").toUpperCase() === "SHELL") {
    reasons.push(
      "Stav SHELL (hrubá stavba) — automatický odhad z tržních nabídek je nevhodný.",
    );
  }

  if (
    subject.propertyType.toUpperCase() === "HOUSE" &&
    (subject.usableArea == null || subject.usableArea > 400)
  ) {
    reasons.push(
      "Velký / atypický dům — sparse market, doporučeno individuální ocenění.",
    );
  }

  const blockAutomated = reasons.length > 0;
  return {
    blockAutomated,
    status: blockAutomated ? "REQUIRES_INDIVIDUAL_APPRAISAL" : "OK",
    reasons,
  };
}
