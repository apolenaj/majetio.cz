/**
 * Recommended next step from open checklist tasks + risk signals.
 * Never a purchase verdict ("Kupte tuto").
 */

import type { PropertyDecisionTaskDto } from "../tasks/task-service";
import {
  suggestDecisionTasks,
  type ChecklistSuggestionContext,
} from "../tasks/checklist-defaults";

export type RecommendedNextStep = {
  id: string;
  labelCs: string;
  reasonCs: string;
  /** Task type when derived from checklist. */
  taskType: string | null;
};

const OPEN_STATUSES = new Set(["PENDING", "IN_PROGRESS"]);

/** Prefer risk-driven technical work, then viewing, financing, legal. */
const TYPE_RANK: Record<string, number> = {
  TECHNICAL_INSPECTION: 0,
  RENOVATION_QUOTE: 1,
  VIEWING: 2,
  FINANCING: 3,
  LEGAL_CHECK: 4,
  DOCUMENTATION: 5,
  SVJ: 6,
  NEIGHBORS: 7,
  CUSTOM: 8,
};

/**
 * Pick the single recommended next step for the property decision panel.
 */
export function recommendNextStep(input: {
  tasks: PropertyDecisionTaskDto[];
  risk: string | null;
  context: ChecklistSuggestionContext;
}): RecommendedNextStep {
  const open = input.tasks
    .filter((t) => OPEN_STATUSES.has(t.status))
    .sort(
      (a, b) =>
        (TYPE_RANK[a.type] ?? 99) - (TYPE_RANK[b.type] ?? 99) ||
        a.createdAt.localeCompare(b.createdAt),
    );

  const riskDriven =
    input.risk === "high" ||
    input.risk === "critical" ||
    input.context.risk === "high" ||
    input.context.risk === "critical";

  if (riskDriven) {
    const tech = open.find((t) => t.type === "TECHNICAL_INSPECTION");
    if (tech) {
      return {
        id: tech.id,
        labelCs: tech.title,
        reasonCs:
          "Doporučený další krok: ověřit technický stav — u nabídky je zvýšené riziko / rekonstrukce.",
        taskType: tech.type,
      };
    }
  }

  if (open[0]) {
    return {
      id: open[0].id,
      labelCs: open[0].title,
      reasonCs: `Doporučený další krok z checklistu: ${open[0].title}.`,
      taskType: open[0].type,
    };
  }

  const suggestions = suggestDecisionTasks(input.context);
  const preferred =
    (riskDriven
      ? suggestions.find((s) => s.type === "TECHNICAL_INSPECTION")
      : null) ?? suggestions[0];

  if (preferred) {
    return {
      id: `suggest:${preferred.type}`,
      labelCs: preferred.title,
      reasonCs: `Doporučený další krok: ${preferred.reason}`,
      taskType: preferred.type,
    };
  }

  return {
    id: "review",
    labelCs: "Projít podklady a srovnání",
    reasonCs:
      "Doporučený další krok: doplnit checklist a porovnat metriky — Majetio nerozhoduje, kterou nabídku koupit.",
    taskType: null,
  };
}

/** Guard for copy — never ship purchase verdicts. */
export function assertNoPurchaseVerdict(text: string): boolean {
  return !/kupte tuto|koupit tuto|musíte koupit/i.test(text);
}
