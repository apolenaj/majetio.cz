/**
 * Data quality anomaly rules (Prompt 7 Part 3).
 */

export type DataQualitySeverity = "CRITICAL" | "WARNING" | "INFO";

export type QualityPropertySnapshot = {
  askingPrice?: number | null;
  priceCzk?: number | null;
  pricePerSqm?: number | null;
  usableArea?: number | null;
  floorArea?: number | null;
  landArea?: number | null;
  areaSqm?: number | null;
};

export type DetectedQualityIssue = {
  ruleCode: string;
  severity: DataQualitySeverity;
  message: string;
  field?: string;
  meta?: Record<string, unknown>;
};

/** Kč/m² outside this band → warning (CZ residential rough bounds). */
export const PRICE_PER_SQM_WARN_MIN = 15_000;
export const PRICE_PER_SQM_WARN_MAX = 350_000;

/** Usable vs floor area relative mismatch threshold. */
export const AREA_MISMATCH_RATIO = 0.35;

function primaryPrice(p: QualityPropertySnapshot): number | null {
  return p.askingPrice ?? p.priceCzk ?? null;
}

function primaryArea(p: QualityPropertySnapshot): number | null {
  return p.usableArea ?? p.floorArea ?? p.areaSqm ?? null;
}

function computedPricePerSqm(p: QualityPropertySnapshot): number | null {
  if (p.pricePerSqm != null && p.pricePerSqm > 0) return p.pricePerSqm;
  const price = primaryPrice(p);
  const area = primaryArea(p);
  if (price == null || area == null || area <= 0) return null;
  return price / area;
}

/**
 * Evaluate anomaly rules. Does not persist — caller upserts DataQualityIssue rows.
 */
export function detectDataQualityIssues(
  property: QualityPropertySnapshot,
): DetectedQualityIssue[] {
  const issues: DetectedQualityIssue[] = [];
  const price = primaryPrice(property);
  const area = primaryArea(property);

  if (price != null && price <= 0) {
    issues.push({
      ruleCode: "PRICE_NON_POSITIVE",
      severity: "CRITICAL",
      message: "Cena musí být kladná (cena ≤ 0).",
      field: property.askingPrice != null ? "askingPrice" : "priceCzk",
      meta: { price },
    });
  }

  if (area != null && area <= 0) {
    issues.push({
      ruleCode: "AREA_NON_POSITIVE",
      severity: "CRITICAL",
      message: "Plocha musí být kladná (plocha ≤ 0).",
      field: property.usableArea != null ? "usableArea" : property.floorArea != null ? "floorArea" : "areaSqm",
      meta: { area },
    });
  }

  const ppsm = computedPricePerSqm(property);
  if (ppsm != null && (ppsm < PRICE_PER_SQM_WARN_MIN || ppsm > PRICE_PER_SQM_WARN_MAX)) {
    issues.push({
      ruleCode: "EXTREME_PRICE_PER_SQM",
      severity: "WARNING",
      message: `Extrémní cena za m² (${Math.round(ppsm)} Kč/m²).`,
      field: "pricePerSqm",
      meta: {
        pricePerSqm: ppsm,
        min: PRICE_PER_SQM_WARN_MIN,
        max: PRICE_PER_SQM_WARN_MAX,
      },
    });
  }

  const usable = property.usableArea;
  const floor = property.floorArea;
  if (usable != null && floor != null && usable > 0 && floor > 0) {
    const ratio = Math.abs(usable - floor) / Math.max(usable, floor);
    if (ratio >= AREA_MISMATCH_RATIO) {
      issues.push({
        ruleCode: "AREA_MISMATCH",
        severity: "WARNING",
        message: "Nesoulad užitné a podlahové plochy.",
        field: "usableArea",
        meta: { usableArea: usable, floorArea: floor, ratio },
      });
    }
  }

  return issues;
}
