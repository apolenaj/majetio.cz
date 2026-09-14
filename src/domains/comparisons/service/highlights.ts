import type {
  ComparisonCellValue,
  ComparisonHighlight,
  ComparisonMetricKey,
  ComparisonPropertyColumn,
  MetricDirection,
} from "../types";
import { getMetricDefinition } from "../metrics/registry";

function numericValue(cell: ComparisonCellValue | undefined): number | null {
  if (!cell || cell.kind !== "number") return null;
  if (!Number.isFinite(cell.value)) return null;
  return cell.value;
}

/**
 * Mark best/worst per metric across columns.
 * Missing values never win. Ties share the highlight.
 */
export function applyHighlights(
  columns: ComparisonPropertyColumn[],
  keys: ComparisonMetricKey[],
): ComparisonPropertyColumn[] {
  const next = columns.map((c) => ({
    ...c,
    highlights: { ...c.highlights },
  }));

  for (const key of keys) {
    const def = getMetricDefinition(key);
    const direction: MetricDirection = def?.direction ?? "neutral";
    if (direction === "neutral") continue;

    const scored = next
      .map((col, index) => ({
        index,
        value: numericValue(col.cells[key]),
      }))
      .filter((x): x is { index: number; value: number } => x.value != null);

    if (scored.length < 2) continue;

    const values = scored.map((s) => s.value);
    const best =
      direction === "higher_better" ? Math.max(...values) : Math.min(...values);
    const worst =
      direction === "higher_better" ? Math.min(...values) : Math.max(...values);

    if (best === worst) continue;

    for (const s of scored) {
      let mark: ComparisonHighlight = null;
      if (s.value === best) mark = "best";
      else if (s.value === worst) mark = "worst";
      if (mark) next[s.index]!.highlights[key] = mark;
    }
  }

  return next;
}
