/**
 * Elegant source-conflict display (Prompt 7 Part 5).
 * Prefer ranges over false precision when sources disagree.
 */

import type { PublicFieldConflict } from "./dto";

export function formatNumericRangeConflict(input: {
  fieldKey: string;
  label: string;
  values: Array<{ value: number; sourceLabel?: string; unit?: string }>;
  unit?: string;
}): PublicFieldConflict | null {
  if (input.values.length < 2) return null;
  const nums = input.values.map((v) => v.value).filter((n) => Number.isFinite(n));
  if (nums.length < 2) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) return null;

  const unit = input.unit ?? input.values[0]?.unit ?? "";
  const unitSuffix = unit ? ` ${unit}` : "";

  return {
    fieldKey: input.fieldKey,
    label: input.label,
    display: `${min}–${max}${unitSuffix} podle zdrojů`,
    values: input.values.map((v) => ({
      value: `${v.value}${v.unit ? ` ${v.unit}` : unitSuffix}`,
      sourceLabel: v.sourceLabel,
    })),
  };
}

export function formatAreaConflict(
  values: Array<{ value: number; sourceLabel?: string }>,
): PublicFieldConflict | null {
  return formatNumericRangeConflict({
    fieldKey: "usableArea",
    label: "Plocha",
    values: values.map((v) => ({ ...v, unit: "m²" })),
    unit: "m²",
  });
}
