import { formatCzk, formatPercentPoints } from "@/lib/format";
import type {
  ComparisonMetricKey,
  ComparisonPropertyColumn,
  ComparisonSummaryHighlight,
} from "../types";
import { COMPARISON_UNAVAILABLE } from "../types";

function num(
  col: ComparisonPropertyColumn,
  key: ComparisonMetricKey,
): number | null {
  const cell = col.cells[key];
  if (!cell || cell.kind !== "number") return null;
  return cell.value;
}

function pickBest(
  columns: ComparisonPropertyColumn[],
  key: ComparisonMetricKey,
  higherBetter: boolean,
): ComparisonPropertyColumn | null {
  let best: ComparisonPropertyColumn | null = null;
  let bestVal: number | null = null;
  for (const col of columns) {
    const v = num(col, key);
    if (v == null) continue;
    if (
      bestVal == null ||
      (higherBetter ? v > bestVal : v < bestVal)
    ) {
      bestVal = v;
      best = col;
    }
  }
  return best;
}

function formatCell(
  col: ComparisonPropertyColumn,
  key: ComparisonMetricKey,
): string {
  const cell = col.cells[key];
  if (!cell || cell.kind === "missing") return COMPARISON_UNAVAILABLE;
  if (cell.kind === "string") return cell.value;
  if (cell.unit === "czk") return formatCzk(cell.value);
  if (cell.unit === "czk_per_sqm") return `${formatCzk(cell.value)}/m²`;
  if (cell.unit === "pct") return formatPercentPoints(cell.value);
  if (cell.unit === "sqm") return `${cell.value} m²`;
  return String(cell.value);
}

/** Rychlé rozhodovací shrnutí — top signals across the set. */
export function buildComparisonSummary(
  columns: ComparisonPropertyColumn[],
): ComparisonSummaryHighlight[] {
  if (columns.length < 2) return [];
  const out: ComparisonSummaryHighlight[] = [];

  const lowestPrice = pickBest(columns, "asking_price", false);
  if (lowestPrice) {
    out.push({
      id: "lowest_price",
      label: "Nejnižší cena",
      propertyId: lowestPrice.propertyId,
      propertyTitle: lowestPrice.title,
      valueLabel: formatCell(lowestPrice, "asking_price"),
    });
  }

  const bestCf = pickBest(columns, "cash_flow_monthly", true);
  if (bestCf) {
    out.push({
      id: "best_cash_flow",
      label: "Nejlepší cash flow",
      propertyId: bestCf.propertyId,
      propertyTitle: bestCf.title,
      valueLabel: formatCell(bestCf, "cash_flow_monthly"),
    });
  }

  const bestYield = pickBest(columns, "gross_yield_pct", true);
  if (bestYield) {
    out.push({
      id: "best_yield",
      label: "Nejvyšší hrubý výnos",
      propertyId: bestYield.propertyId,
      propertyTitle: bestYield.title,
      valueLabel: formatCell(bestYield, "gross_yield_pct"),
    });
  }

  const bestMatch = pickBest(columns, "match_score", true);
  if (bestMatch) {
    out.push({
      id: "best_match",
      label: "Nejvyšší shoda s profilem",
      propertyId: bestMatch.propertyId,
      propertyTitle: bestMatch.title,
      valueLabel: formatCell(bestMatch, "match_score"),
    });
  }

  const lowestPayment = pickBest(columns, "monthly_payment", false);
  if (lowestPayment && num(lowestPayment, "monthly_payment") != null) {
    out.push({
      id: "lowest_payment",
      label: "Nejnižší orientační splátka",
      propertyId: lowestPayment.propertyId,
      propertyTitle: lowestPayment.title,
      valueLabel: formatCell(lowestPayment, "monthly_payment"),
    });
  }

  return out.slice(0, 5);
}
