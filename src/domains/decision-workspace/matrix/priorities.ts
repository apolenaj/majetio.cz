import type { PassportState } from "@/lib/financial-passport/types";

export const DECISION_CRITERIA = [
  { id: "price", labelCs: "Cena" },
  { id: "location", labelCs: "Lokalita" },
  { id: "yield", labelCs: "Výnos" },
  { id: "cashFlow", labelCs: "Cash flow" },
  { id: "risk", labelCs: "Riziko" },
  { id: "renovation", labelCs: "Rekonstrukce" },
  { id: "financing", labelCs: "Financování" },
  { id: "size", labelCs: "Velikost / dispozice" },
] as const;

export type DecisionCriterionId = (typeof DECISION_CRITERIA)[number]["id"];

export type DecisionPriorityLevel = "LOW" | "MEDIUM" | "HIGH";

export const DECISION_PRIORITY_LABELS_CS: Record<DecisionPriorityLevel, string> =
  {
    LOW: "Nízká",
    MEDIUM: "Střední",
    HIGH: "Vysoká",
  };

export const DECISION_PRIORITY_WEIGHT: Record<DecisionPriorityLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

export type DecisionPriorities = Record<
  DecisionCriterionId,
  DecisionPriorityLevel
>;

export const DEFAULT_DECISION_PRIORITIES: DecisionPriorities = {
  price: "HIGH",
  location: "HIGH",
  yield: "MEDIUM",
  cashFlow: "MEDIUM",
  risk: "MEDIUM",
  renovation: "LOW",
  financing: "MEDIUM",
  size: "MEDIUM",
};

/** Prefill matrix from Finanční pas goal / strategies. */
export function prioritiesFromPassport(
  passport: PassportState | null | undefined,
): DecisionPriorities {
  const base = { ...DEFAULT_DECISION_PRIORITIES };
  if (!passport) return base;

  if (passport.goal === "OWN_HOME") {
    base.price = "HIGH";
    base.location = "HIGH";
    base.size = "HIGH";
    base.yield = "LOW";
    base.cashFlow = "LOW";
    base.financing = "HIGH";
    base.renovation = "MEDIUM";
  } else if (passport.goal === "INVESTMENT") {
    base.yield = "HIGH";
    base.cashFlow = "HIGH";
    base.price = "HIGH";
    base.risk = "HIGH";
    base.location = "MEDIUM";
    base.size = "LOW";
  } else if (passport.goal === "RENOVATION" || passport.goal === "FLIP") {
    base.renovation = "HIGH";
    base.price = "HIGH";
    base.risk = "HIGH";
    base.yield = passport.goal === "FLIP" ? "MEDIUM" : "LOW";
  }

  if (passport.strategies.some((s) => /pronajem|pronájem|yield/i.test(s))) {
    base.yield = "HIGH";
    base.cashFlow = "HIGH";
  }

  if (passport.financingMode === "MORTGAGE" || passport.financingMode === "MIXED") {
    base.financing = "HIGH";
  }

  if (passport.riskTolerance === "CONSERVATIVE") {
    base.risk = "HIGH";
  } else if (passport.riskTolerance === "DYNAMIC") {
    base.risk = "LOW";
  }

  return base;
}

export function parsePriorities(raw: unknown): DecisionPriorities {
  const out = { ...DEFAULT_DECISION_PRIORITIES };
  if (!raw || typeof raw !== "object") return out;
  const obj = raw as Record<string, unknown>;
  for (const c of DECISION_CRITERIA) {
    const v = obj[c.id];
    if (v === "LOW" || v === "MEDIUM" || v === "HIGH") {
      out[c.id] = v;
    }
  }
  return out;
}
