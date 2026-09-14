/**
 * Merge structured result warnings + legacy string messages for UI.
 */

import type { IrrResult } from "../engine/calculations/returns";
import type { ResultWarning } from "../engine/validation";

export function mergeResultWarnings(
  base: ResultWarning[],
  extra: ResultWarning[],
): ResultWarning[] {
  const seen = new Set<string>();
  const out: ResultWarning[] = [];
  for (const w of [...base, ...extra]) {
    const key = `${w.code}:${w.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(w);
  }
  return out;
}

export function resultWarningsFromIrr(irr: IrrResult): ResultWarning[] {
  const warnings: ResultWarning[] = [];

  if (irr.multipleRootsPossible) {
    warnings.push({
      code: "irr_multiple_roots",
      severity: "warning",
      message:
        irr.reason ??
        "Více změn znamének v cash flow — IRR nemusí být jednoznačný.",
    });
  }

  if (irr.value == null && !irr.converged) {
    warnings.push({
      code: "irr_undefined",
      severity: "warning",
      message: irr.reason ?? "IRR nelze spočítat z dané cash flow řady.",
    });
    return warnings;
  }

  if (irr.value != null && irr.value.toRatio().lt(0)) {
    warnings.push({
      code: "irr_negative",
      severity: "warning",
      message: "IRR je záporný — investice generuje ztrátu v modelovaném horizontu.",
    });
  }

  return warnings;
}

/** Flatten structured warnings + free-text merge warnings for legacy UI lists. */
export function allWarningMessages(input: {
  resultWarnings: ResultWarning[];
  legacyWarnings: string[];
}): string[] {
  const structured = input.resultWarnings.map((w) => w.message);
  const seen = new Set(structured);
  const out = [...structured];
  for (const s of input.legacyWarnings) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}
