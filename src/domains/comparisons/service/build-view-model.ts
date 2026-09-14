import { comparisonConfig } from "@/config/comparison";
import { listDemoPublicProperties } from "@/content/demo-canonical-properties";
import {
  confidenceLabel,
  getPropertyFinancialDemo,
  type ValuationConfidence,
} from "@/content/demo-property-financial";
import type { PassportState } from "@/lib/financial-passport/types";
import {
  COMPARISON_METRIC_REGISTRY,
  metricsForMode,
} from "../metrics/registry";
import type {
  ComparisonCellValue,
  ComparisonMetricKey,
  ComparisonMode,
  ComparisonPropertyColumn,
  ComparisonViewModel,
} from "../types";
import { COMPARISON_UNAVAILABLE } from "../types";
import { applyHighlights } from "./highlights";
import { computePassportFinancing } from "./passport-financing";
import { buildComparisonSummary } from "./summary";
import { buildComparisonWarnings } from "./warnings";

export type ComparisonSourceProperty = {
  propertyId: string;
  slug: string;
  order?: number;
  /** Optional match score 0–100 from Finanční pas. */
  matchScore?: number | null;
  matchConfidence?: ValuationConfidence | null;
};

function missing(): ComparisonCellValue {
  return { kind: "missing" };
}

function num(
  value: number | null | undefined,
  unit?: "czk" | "czk_per_sqm" | "pct" | "sqm" | "months" | "score",
): ComparisonCellValue {
  if (value == null || !Number.isFinite(value)) return missing();
  return { kind: "number", value, unit };
}

function str(value: string | null | undefined): ComparisonCellValue {
  if (!value?.trim()) return missing();
  return { kind: "string", value: value.trim() };
}

function scoreConfidenceLabel(
  conf: ValuationConfidence | null | undefined,
): ComparisonCellValue {
  if (!conf) return missing();
  return str(confidenceLabel(conf));
}

function scoreConfidenceFromScore(
  score: number | null | undefined,
): ValuationConfidence | null {
  if (score == null || !Number.isFinite(score)) return null;
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Byt",
  HOUSE: "Dům",
  LAND: "Pozemek",
  COMMERCIAL: "Komerční",
  OTHER: "Jiné",
};

const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: "Výborný",
  GOOD: "Dobrý",
  AVERAGE: "Průměrný",
  NEEDS_RENOVATION: "K rekonstrukci",
  UNKNOWN: "Neuvedeno",
};

const RISK_RANK: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
  unknown: 2.5,
};

function resolveDemo(slug: string) {
  return listDemoPublicProperties().find((p) => p.slug === slug) ?? null;
}

function countRisks(
  risks: Array<{ severity: string }> | undefined,
  severity: string,
): number | null {
  if (!risks) return null;
  return risks.filter((r) => r.severity === severity).length;
}

function buildColumn(
  source: ComparisonSourceProperty,
  passport: PassportState | null,
  order: number,
): ComparisonPropertyColumn | null {
  const dto = resolveDemo(source.slug);
  if (!dto) return null;
  const fin = getPropertyFinancialDemo(source.slug);
  const asking = dto.askingPrice;
  const reno = fin?.renovation ?? null;

  const financing = computePassportFinancing({
    askingPriceCzk: asking,
    availableEquityCzk: passport?.availableEquityCzk ?? null,
    equityPercent: passport?.equityPercent ?? null,
  });

  const conf = fin?.valuation?.confidence ?? null;
  const costBase = reno?.costBaseCzk ?? reno?.costCzk ?? null;
  const costLow = reno?.costLowCzk ?? null;
  const costHigh = reno?.costHighCzk ?? null;
  const maxOffer = reno?.maxOfferCzk ?? null;
  let maxOfferGap: number | null = null;
  if (asking != null && maxOffer != null) {
    maxOfferGap = asking - maxOffer;
  }

  const durationMonths =
    reno?.durationDays != null && Number.isFinite(reno.durationDays)
      ? Math.round((reno.durationDays / 30) * 10) / 10
      : null;

  const locationScore = reno?.locationScore ?? null;
  const locationConf = reno?.locationConfidence ?? null;
  const majetioConf = scoreConfidenceFromScore(dto.majetioScore);
  const matchConf =
    source.matchConfidence ?? scoreConfidenceFromScore(source.matchScore);

  const cells: Partial<Record<ComparisonMetricKey, ComparisonCellValue>> = {
    asking_price: num(asking, "czk"),
    price_per_sqm: num(dto.pricePerSqm, "czk_per_sqm"),
    usable_area: num(dto.usableArea, "sqm"),
    layout: str(dto.layout),
    property_type: str(
      TYPE_LABELS[dto.propertyType] ?? dto.propertyType ?? null,
    ),
    condition: str(
      dto.condition
        ? (CONDITION_LABELS[dto.condition] ?? dto.condition)
        : null,
    ),
    valuation_mid: num(fin?.valuation?.midCzk ?? null, "czk"),
    asking_vs_valuation_pct: (() => {
      const mid = fin?.valuation?.midCzk;
      if (asking == null || mid == null || mid === 0) return missing();
      return num(((asking - mid) / mid) * 100, "pct");
    })(),
    valuation_confidence: conf ? str(confidenceLabel(conf)) : missing(),
    max_offer: num(maxOffer, "czk"),
    max_offer_gap: num(maxOfferGap, "czk"),
    gross_yield_pct: num(
      fin?.investment?.grossYieldPct ?? dto.grossYieldPct,
      "pct",
    ),
    net_yield_pct: num(fin?.investment?.netYieldPct ?? null, "pct"),
    irr_pct: num(reno?.irrPct ?? null, "pct"),
    cash_flow_monthly: num(
      fin?.investment?.cashFlowMonthlyCzk ?? dto.cashFlowMonthlyCzk,
      "czk",
    ),
    estimated_rent_monthly: num(
      fin?.investment?.estimatedRentMonthlyCzk ?? null,
      "czk",
    ),
    ltv_pct: num(financing.ltvPct, "pct"),
    equity_required: num(financing.equityRequiredCzk, "czk"),
    loan_principal: num(financing.loanPrincipalCzk, "czk"),
    monthly_payment: num(financing.monthlyPaymentCzk, "czk"),
    financing_gap: num(financing.financingGapCzk, "czk"),
    renovation_cost: num(costBase, "czk"),
    renovation_cost_low: num(costLow, "czk"),
    renovation_cost_base: num(costBase, "czk"),
    renovation_cost_high: num(costHigh, "czk"),
    renovation_duration: num(durationMonths, "months"),
    renovation_arv: num(reno?.valueAfterCzk ?? null, "czk"),
    location_label: str(
      dto.location.label ||
        [dto.location.district, dto.location.city].filter(Boolean).join(", "),
    ),
    city: str(dto.location.city),
    location_score: num(locationScore, "score"),
    location_score_confidence: scoreConfidenceLabel(locationConf),
    risk_level:
      dto.risk != null
        ? num(RISK_RANK[dto.risk] ?? 2.5, "score")
        : missing(),
    risk_critical: num(countRisks(reno?.risks, "critical"), "score"),
    risk_high: num(countRisks(reno?.risks, "high"), "score"),
    risk_medium: num(countRisks(reno?.risks, "medium"), "score"),
    majetio_score: num(dto.majetioScore, "score"),
    majetio_score_confidence: scoreConfidenceLabel(majetioConf),
    match_score: num(source.matchScore ?? null, "score"),
    match_score_confidence: scoreConfidenceLabel(matchConf),
  };

  const expandDetails: ComparisonPropertyColumn["expandDetails"] = {};
  if (fin?.valuation?.confidenceReason) {
    expandDetails.valuation_confidence = {
      title: "Spolehlivost odhadu",
      body: fin.valuation.confidenceReason,
    };
    expandDetails.valuation_mid = {
      title: "Předpoklady valuace",
      body: fin.valuation.confidenceReason,
    };
  }
  if (reno?.irrAssumptionsCs) {
    expandDetails.irr_pct = {
      title: "Předpoklady IRR",
      body: reno.irrAssumptionsCs,
    };
    expandDetails.gross_yield_pct = {
      title: "Předpoklady výnosu",
      body: reno.irrAssumptionsCs,
    };
  }
  if (reno?.note) {
    expandDetails.renovation_cost_base = {
      title: "Rekonstrukce — pásmo low/base/high",
      body: reno.note,
    };
  }
  if (maxOfferGap != null) {
    expandDetails.max_offer_gap = {
      title: "Vyjednávací gap",
      body: `Asking minus modelované maximum nabídky. Kladný gap = cena nad modelem (prostor ke slevě), záporný = asking pod modelem. Nejde o doporučení ke koupi.`,
    };
  }
  expandDetails.financing_gap = {
    title: "Finanční gap",
    body: financing.note,
  };
  expandDetails.monthly_payment = {
    title: "Splátka",
    body: financing.note,
  };
  if (locationConf) {
    expandDetails.location_score_confidence = {
      title: "Spolehlivost skóre lokality",
      body: `Spolehlivost: ${confidenceLabel(locationConf)}. Skóre lokality je orientační podklad, ne ranking „vítěze“.`,
    };
  }
  if (majetioConf) {
    expandDetails.majetio_score_confidence = {
      title: "Spolehlivost Majetio skóre",
      body: `Spolehlivost: ${confidenceLabel(majetioConf)}. Skóre není verdikt koupě.`,
    };
  }
  if (matchConf) {
    expandDetails.match_score_confidence = {
      title: "Spolehlivost shody s profilem",
      body: `Spolehlivost: ${confidenceLabel(matchConf)}. Vyžaduje doplněný Finanční pas / preference.`,
    };
  }

  return {
    propertyId: source.propertyId || dto.id,
    slug: dto.slug,
    title: dto.title,
    href: `/nemovitosti/${dto.slug}`,
    imageUrl:
      dto.media.find((m) => m.isPrimary && m.url)?.url ??
      dto.media.find((m) => m.url)?.url ??
      null,
    isDemo: dto.isDemo,
    order,
    cells,
    highlights: {},
    expandDetails,
    passportFinancing: financing,
  };
}

export function buildComparisonViewModel(input: {
  id?: string | null;
  name?: string | null;
  mode?: ComparisonMode;
  properties: ComparisonSourceProperty[];
  passport?: PassportState | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}): ComparisonViewModel {
  const mode = input.mode ?? "overview";
  const limited = input.properties.slice(0, comparisonConfig.maxProperties);

  const columns = limited
    .map((p, i) => buildColumn(p, input.passport ?? null, p.order ?? i))
    .filter((c): c is ComparisonPropertyColumn => c != null);

  const orderedKeys = metricsForMode(mode);
  const withHighlights = applyHighlights(columns, orderedKeys);

  const warnings = buildComparisonWarnings(
    limited.map((p) => {
      const dto = resolveDemo(p.slug);
      const fin = getPropertyFinancialDemo(p.slug);
      return {
        propertyId: p.propertyId,
        title: dto?.title ?? p.slug,
        propertyType: dto?.propertyType ?? null,
        strategyTags: dto?.tags ?? [],
        valuationConfidence: fin?.valuation?.confidence ?? null,
      };
    }),
  );

  const passportApplied = withHighlights.some(
    (c) => c.passportFinancing?.usedPassport,
  );

  return {
    id: input.id ?? null,
    name: input.name ?? null,
    mode,
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null,
    properties: withHighlights,
    metrics: COMPARISON_METRIC_REGISTRY,
    orderedMetricKeys: orderedKeys,
    warnings,
    summary: buildComparisonSummary(withHighlights),
    passportApplied,
    maxProperties: comparisonConfig.maxProperties,
    unavailableLabel: COMPARISON_UNAVAILABLE,
  };
}

/** Format cell for display — never show fake 0 for missing. */
export function formatComparisonCell(
  cell: ComparisonCellValue | undefined,
  unavailable = COMPARISON_UNAVAILABLE,
): string {
  if (!cell || cell.kind === "missing") return unavailable;
  if (cell.kind === "string") return cell.value;
  if (cell.unit === "czk") {
    return new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0,
    }).format(cell.value);
  }
  if (cell.unit === "czk_per_sqm") {
    return `${new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0,
    }).format(cell.value)}/m²`;
  }
  if (cell.unit === "pct") {
    return `${cell.value.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} %`;
  }
  if (cell.unit === "sqm") return `${cell.value} m²`;
  if (cell.unit === "months") {
    return `${cell.value.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} měs.`;
  }
  if (cell.unit === "score") return String(Math.round(cell.value));
  return String(cell.value);
}
