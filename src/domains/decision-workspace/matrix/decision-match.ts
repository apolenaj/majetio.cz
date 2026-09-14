import type { ComparisonPropertyColumn } from "@/domains/comparisons/types";
import {
  DECISION_CRITERIA,
  DECISION_PRIORITY_WEIGHT,
  type DecisionCriterionId,
  type DecisionPriorities,
} from "./priorities";

export type DecisionBreakdownItem = {
  tone: "strength" | "weakness" | "neutral";
  /** e.g. "✓ nejlepší cash flow" */
  label: string;
};

export type DecisionMatchResult = {
  propertyId: string;
  slug: string;
  title: string;
  /** 0–100 explainable score from weighted ranks. */
  matchScore: number | null;
  breakdown: DecisionBreakdownItem[];
  criterionScores: Partial<
    Record<DecisionCriterionId, { rank: number; of: number; weighted: number }>
  >;
};

function cellNumber(
  col: ComparisonPropertyColumn,
  key: string,
): number | null {
  const cell = col.cells[key as keyof typeof col.cells];
  if (!cell || cell.kind !== "number") return null;
  return cell.value;
}

type CriterionSpec = {
  id: DecisionCriterionId;
  /** Comparison metric key(s) — first available wins. */
  metricKeys: string[];
  higherBetter: boolean;
  strengthLabel: string;
  weaknessLabel: string;
};

const CRITERION_SPECS: CriterionSpec[] = [
  {
    id: "price",
    metricKeys: ["asking_price", "price_per_sqm"],
    higherBetter: false,
    strengthLabel: "nejvýhodnější cena",
    weaknessLabel: "vyšší cena",
  },
  {
    id: "location",
    metricKeys: ["majetio_score"],
    higherBetter: true,
    strengthLabel: "silná lokalitní / skóre pozice",
    weaknessLabel: "slabší lokalitní signál",
  },
  {
    id: "yield",
    metricKeys: ["gross_yield_pct", "net_yield_pct"],
    higherBetter: true,
    strengthLabel: "nejlepší výnos",
    weaknessLabel: "nižší výnos",
  },
  {
    id: "cashFlow",
    metricKeys: ["cash_flow_monthly"],
    higherBetter: true,
    strengthLabel: "nejlepší cash flow",
    weaknessLabel: "slabší cash flow",
  },
  {
    id: "risk",
    metricKeys: ["risk_level"],
    higherBetter: false,
    strengthLabel: "nižší riziko",
    weaknessLabel: "vyšší riziko",
  },
  {
    id: "renovation",
    metricKeys: ["renovation_cost"],
    higherBetter: false,
    strengthLabel: "nižší rekonstrukce",
    weaknessLabel: "vyšší rekonstrukce",
  },
  {
    id: "financing",
    metricKeys: ["monthly_payment", "ltv_pct"],
    higherBetter: false,
    strengthLabel: "snazší financování",
    weaknessLabel: "náročnější financování",
  },
  {
    id: "size",
    metricKeys: ["usable_area"],
    higherBetter: true,
    strengthLabel: "větší užitná plocha",
    weaknessLabel: "menší užitná plocha",
  },
];

/**
 * Explainable Decision Match from matrix priorities × relative ranks.
 * Does NOT reorder properties — caller applies manualOrder separately.
 */
export function computeDecisionMatch(input: {
  properties: ComparisonPropertyColumn[];
  priorities: DecisionPriorities;
}): DecisionMatchResult[] {
  const { properties, priorities } = input;
  if (properties.length === 0) return [];

  const n = properties.length;
  const results: DecisionMatchResult[] = properties.map((p) => ({
    propertyId: p.propertyId,
    slug: p.slug,
    title: p.title,
    matchScore: null,
    breakdown: [],
    criterionScores: {},
  }));

  let totalWeight = 0;
  const weightedSum = new Map<string, number>();
  for (const p of properties) weightedSum.set(p.propertyId, 0);

  for (const spec of CRITERION_SPECS) {
    const level = priorities[spec.id];
    const weight = DECISION_PRIORITY_WEIGHT[level];
    totalWeight += weight;

    const valued = properties
      .map((p) => {
        let v: number | null = null;
        for (const key of spec.metricKeys) {
          v = cellNumber(p, key);
          if (v != null) break;
        }
        return { id: p.propertyId, value: v };
      })
      .filter((x): x is { id: string; value: number } => x.value != null);

    if (valued.length < 2) continue;

    const sorted = [...valued].sort((a, b) =>
      spec.higherBetter ? b.value - a.value : a.value - b.value,
    );

    // rank 1 = best
    const rankOf = new Map<string, number>();
    sorted.forEach((s, i) => rankOf.set(s.id, i + 1));

    for (const p of properties) {
      const rank = rankOf.get(p.propertyId);
      if (rank == null) continue;
      // Normalize: best → 1, worst → 0
      const norm = n === 1 ? 1 : (n - rank) / (n - 1);
      const w = norm * weight;
      weightedSum.set(p.propertyId, (weightedSum.get(p.propertyId) ?? 0) + w);

      const idx = results.findIndex((r) => r.propertyId === p.propertyId);
      if (idx < 0) continue;
      results[idx]!.criterionScores[spec.id] = {
        rank,
        of: valued.length,
        weighted: w,
      };

      if (rank === 1) {
        results[idx]!.breakdown.push({
          tone: "strength",
          label: `✓ ${spec.strengthLabel}`,
        });
      } else if (rank === valued.length) {
        results[idx]!.breakdown.push({
          tone: "weakness",
          label: `! ${spec.weaknessLabel}`,
        });
      }
    }
  }

  for (const r of results) {
    const sum = weightedSum.get(r.propertyId) ?? 0;
    r.matchScore =
      totalWeight > 0 ? Math.round((sum / totalWeight) * 100) : null;
    // Cap breakdown length for UI
    r.breakdown = [
      ...r.breakdown.filter((b) => b.tone === "strength").slice(0, 3),
      ...r.breakdown.filter((b) => b.tone === "weakness").slice(0, 3),
    ];
  }

  return results;
}

/**
 * Apply manual user order. Automation must never invent this list —
 * only reorder when `manualOrder` is provided and non-empty.
 */
export function applyManualPropertyOrder<T extends { propertyId: string }>(
  items: T[],
  manualOrder: string[] | null | undefined,
): T[] {
  if (!manualOrder || manualOrder.length === 0) return items;
  const byId = new Map(items.map((i) => [i.propertyId, i]));
  const ordered: T[] = [];
  for (const id of manualOrder) {
    const hit = byId.get(id);
    if (hit) {
      ordered.push(hit);
      byId.delete(id);
    }
  }
  for (const rest of byId.values()) ordered.push(rest);
  return ordered;
}

export function criteriaLabel(id: DecisionCriterionId): string {
  return DECISION_CRITERIA.find((c) => c.id === id)?.labelCs ?? id;
}
