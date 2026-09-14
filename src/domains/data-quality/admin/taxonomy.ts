/**
 * Data Quality taxonomy + explainability (Admin Prompt 3).
 */

export const DQ_CATEGORIES = [
  "MISSING",
  "CONFLICT",
  "ANOMALY",
  "STALE",
  "DUPLICATE",
  "USER_REPORT",
] as const;

export type DqCategory = (typeof DQ_CATEGORIES)[number];

export const DQ_WORKFLOW_STATUSES = [
  "OPEN",
  "IN_REVIEW",
  "RESOLVED",
  "FALSE_POSITIVE",
] as const;

export type DqWorkflowStatus = (typeof DQ_WORKFLOW_STATUSES)[number];

/** Statuses that still need ops attention. */
export const DQ_OPEN_STATUSES = [
  "OPEN",
  "ACKNOWLEDGED",
  "IN_REVIEW",
] as const;

const RULE_CATEGORY: Record<string, DqCategory> = {
  PRICE_NON_POSITIVE: "ANOMALY",
  AREA_NON_POSITIVE: "ANOMALY",
  EXTREME_PRICE_PER_SQM: "ANOMALY",
  PRICE_BELOW_MEDIAN: "ANOMALY",
  PRICE_ABOVE_MEDIAN: "ANOMALY",
  AREA_MISMATCH: "CONFLICT",
  REQUIRED_TITLE: "MISSING",
  REQUIRED_CITY: "MISSING",
  REQUIRED_TYPE: "MISSING",
  REQUIRED_MARKET: "MISSING",
  INVALID_PRICE: "MISSING",
  OPEN_CRITICAL_DQ: "ANOMALY",
  LOCATION_METRIC_STALE: "STALE",
  LOCATION_METRIC_PRICE_SPIKE: "ANOMALY",
  LOCATION_METRIC_SAMPLE_COLLAPSE: "ANOMALY",
  LOCATION_SOURCE_QUALITY_LOW: "ANOMALY",
  LOCATION_METRIC_SUPPRESSED: "ANOMALY",
  DUPLICATE_CANDIDATE: "DUPLICATE",
};

export function categoryForRuleCode(ruleCode: string): DqCategory {
  if (RULE_CATEGORY[ruleCode]) return RULE_CATEGORY[ruleCode];
  const upper = ruleCode.toUpperCase();
  if (upper.startsWith("USER_REPORT")) return "USER_REPORT";
  if (upper.includes("STALE") || upper.includes("FRESH")) return "STALE";
  if (upper.includes("DUP")) return "DUPLICATE";
  if (upper.includes("MISS") || upper.includes("REQUIRED")) return "MISSING";
  if (upper.includes("MISMATCH") || upper.includes("CONFLICT")) return "CONFLICT";
  return "ANOMALY";
}

/**
 * Normalize legacy statuses to Prompt 3 workflow labels.
 */
export function toWorkflowStatus(status: string): DqWorkflowStatus {
  switch (status) {
    case "ACKNOWLEDGED":
      return "IN_REVIEW";
    case "IGNORED":
      return "FALSE_POSITIVE";
    case "IN_REVIEW":
    case "OPEN":
    case "RESOLVED":
    case "FALSE_POSITIVE":
      return status;
    default:
      return "OPEN";
  }
}

export function isOpenDqStatus(status: string): boolean {
  return (DQ_OPEN_STATUSES as readonly string[]).includes(status);
}

export type ExplainInput = {
  ruleCode: string;
  message: string;
  field?: string | null;
  meta?: Record<string, unknown> | null;
  ruleVersion?: string;
};

/**
 * Build a clear WHY explanation — never just "Suspicious".
 */
export function explainDataQualityIssue(input: ExplainInput): string {
  const meta = input.meta ?? {};
  const version = input.ruleVersion ?? "1";

  if (
    input.ruleCode === "PRICE_BELOW_MEDIAN" ||
    (typeof meta.medianPrice === "number" &&
      typeof meta.askingPrice === "number" &&
      typeof meta.pctBelowMedian === "number")
  ) {
    const pct = Number(meta.pctBelowMedian);
    const asking = Number(meta.askingPrice);
    const median = Number(meta.medianPrice);
    if (Number.isFinite(pct) && Number.isFinite(asking) && Number.isFinite(median)) {
      return [
        `Cena ${asking.toLocaleString("cs-CZ")} je o ${Math.round(pct)} % nižší než medián lokality (${median.toLocaleString("cs-CZ")}).`,
        `Pravidlo ${input.ruleCode} v${version}.`,
      ].join(" ");
    }
  }

  if (input.ruleCode === "EXTREME_PRICE_PER_SQM") {
    const ppsm = Number(meta.pricePerSqm);
    const min = Number(meta.min);
    const max = Number(meta.max);
    if (Number.isFinite(ppsm)) {
      const band =
        Number.isFinite(min) && Number.isFinite(max)
          ? ` očekávané pásmo ${Math.round(min).toLocaleString("cs-CZ")}–${Math.round(max).toLocaleString("cs-CZ")} Kč/m²`
          : "";
      return `Cena za m² (${Math.round(ppsm).toLocaleString("cs-CZ")} Kč/m²) je mimo typické tržní pásmo${band}. Pravidlo ${input.ruleCode} v${version}.`;
    }
  }

  if (input.ruleCode === "AREA_MISMATCH") {
    const usable = Number(meta.usableArea);
    const floor = Number(meta.floorArea);
    const ratio = Number(meta.ratio);
    if (Number.isFinite(usable) && Number.isFinite(floor)) {
      const pct = Number.isFinite(ratio) ? Math.round(ratio * 100) : null;
      return [
        `Užitná plocha ${usable} m² vs podlahová ${floor} m²`,
        pct != null ? `(odchylka ${pct} %).` : ".",
        `Pravidlo ${input.ruleCode} v${version}.`,
      ].join(" ");
    }
  }

  if (input.ruleCode === "PRICE_NON_POSITIVE" || input.ruleCode === "INVALID_PRICE") {
    return `Cena není kladná (hodnota ${String(meta.price ?? "chybí")}). Bez platné ceny nelze listing bezpečně publikovat. Pravidlo ${input.ruleCode} v${version}.`;
  }

  if (input.ruleCode === "AREA_NON_POSITIVE") {
    return `Plocha není kladná (hodnota ${String(meta.area ?? "chybí")}). Pravidlo ${input.ruleCode} v${version}.`;
  }

  if (input.ruleCode.startsWith("LOCATION_METRIC_STALE")) {
    return `Metrika lokality je zastaralá — zdroj dlouho neposkytl aktualizaci. Pravidlo ${input.ruleCode} v${version}.`;
  }

  // Fallback: enrich message, never leave opaque single word.
  const base = input.message?.trim() || "Detekován problém kvality dat.";
  if (/^suspicious$/i.test(base)) {
    return `Detekována anomálie na poli ${input.field ?? "neznámé"} (pravidlo ${input.ruleCode} v${version}). Zkontrolujte vstupní data a medián trhu.`;
  }
  return `${base} Pravidlo ${input.ruleCode} v${version}.`;
}

/**
 * Optional median-deviation detector for richer ANOMALY explanations.
 */
export function detectPriceVsMedianIssue(input: {
  askingPrice: number | null | undefined;
  medianPrice: number | null | undefined;
  /** Absolute relative deviation threshold, default 0.5 (50%). */
  threshold?: number;
}): {
  ruleCode: string;
  severity: "WARNING";
  message: string;
  explanation: string;
  category: DqCategory;
  field: string;
  meta: Record<string, unknown>;
  ruleVersion: string;
} | null {
  const asking = input.askingPrice;
  const median = input.medianPrice;
  if (asking == null || median == null || !(asking > 0) || !(median > 0)) {
    return null;
  }
  const threshold = input.threshold ?? 0.5;
  const delta = (asking - median) / median;
  if (Math.abs(delta) < threshold) return null;

  const below = delta < 0;
  const pct = Math.abs(delta) * 100;
  const ruleCode = below ? "PRICE_BELOW_MEDIAN" : "PRICE_ABOVE_MEDIAN";
  const meta = {
    askingPrice: asking,
    medianPrice: median,
    pctBelowMedian: below ? pct : undefined,
    pctAboveMedian: below ? undefined : pct,
    threshold,
  };
  const explanation = explainDataQualityIssue({
    ruleCode,
    message: below
      ? `Cena je o ${Math.round(pct)} % nižší než medián`
      : `Cena je o ${Math.round(pct)} % vyšší než medián`,
    field: "askingPrice",
    meta,
    ruleVersion: "1",
  });

  return {
    ruleCode,
    severity: "WARNING",
    message: below
      ? `Cena je o ${Math.round(pct)} % nižší než medián`
      : `Cena je o ${Math.round(pct)} % vyšší než medián`,
    explanation,
    category: "ANOMALY",
    field: "askingPrice",
    meta,
    ruleVersion: "1",
  };
}
