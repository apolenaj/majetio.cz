import {
  RENOVATION_COST_RANGES,
  type RenovationItemId,
} from "./renovation-cost-ranges";
import { clamp, nonNegative } from "./common";

export type RenovationCondition = "light" | "partial" | "full";
export type RenovationPropertyKind = "byt" | "dum";

const DEFAULT_SELECTION: Record<RenovationCondition, RenovationItemId[]> = {
  light: ["floors", "paint"],
  partial: ["floors", "paint", "bathroom", "kitchen", "electro"],
  full: [
    "floors",
    "paint",
    "electro",
    "plumbing",
    "bathroom",
    "kitchen",
    "windows",
    "doors",
    "heating",
    "plaster",
    "other",
  ],
};

export function defaultRenovationSelection(
  condition: RenovationCondition,
  kind: RenovationPropertyKind,
): RenovationItemId[] {
  const base = [...DEFAULT_SELECTION[condition]];
  if (kind === "dum" && condition === "full") {
    base.push("roof", "facade", "insulation");
  }
  return base;
}

export type RenovationLine = {
  id: RenovationItemId;
  label: string;
  low: number;
  mid: number;
  high: number;
};

export type RenovationEstimate = {
  lines: RenovationLine[];
  low: number;
  mid: number;
  high: number;
  reservePct: number;
  reserveOnMid: number;
  totalWithReserve: number;
};

export function estimateRenovation(input: {
  areaSqm: number;
  kind: RenovationPropertyKind;
  selected: RenovationItemId[];
  reservePct: number;
}): RenovationEstimate {
  const area = nonNegative(input.areaSqm);
  const reservePct = clamp(input.reservePct, 0, 40);
  const lines: RenovationLine[] = [];

  for (const item of RENOVATION_COST_RANGES) {
    if (!input.selected.includes(item.id)) continue;
    if (item.houseOnly && input.kind !== "dum") continue;
    const qty = item.unit === "m2" ? area : 1;
    lines.push({
      id: item.id,
      label: item.label,
      low: item.low * qty,
      mid: item.mid * qty,
      high: item.high * qty,
    });
  }

  const low = lines.reduce((sum, line) => sum + line.low, 0);
  const mid = lines.reduce((sum, line) => sum + line.mid, 0);
  const high = lines.reduce((sum, line) => sum + line.high, 0);
  const reserveOnMid = mid * (reservePct / 100);

  return {
    lines,
    low,
    mid,
    high,
    reservePct,
    reserveOnMid,
    totalWithReserve: mid + reserveOnMid,
  };
}
