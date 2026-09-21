/**
 * Display DTOs for scenario comparison and metric cards (pure).
 */

import { formatCzk, formatPercent } from "@/lib/format";

import type { Year1OperatingMetrics } from "../engine";
import type {
  CalculationMetric,
  OrchestratedCalculationResult,
} from "../service/types";

export const UNAVAILABLE_LABEL = "Nutno ověřit";

export type ScenarioColumnKey = "base" | "conservative" | "optimistic";

export type ScenarioColumnView = {
  key: ScenarioColumnKey;
  label: string;
  annualCashFlow: string;
  noi: string;
  dscr: string;
  monthlyCashFlow: string;
};

export type ScenarioComparisonView = {
  columns: ScenarioColumnView[];
};

function formatMoneyMajor(n: number): string {
  return formatCzk(n);
}

function formatDscr(dscr: number | null): string {
  if (dscr == null || !Number.isFinite(dscr)) return UNAVAILABLE_LABEL;
  return dscr.toFixed(2);
}

export function year1ToScenarioColumn(
  key: ScenarioColumnKey,
  label: string,
  metrics: Year1OperatingMetrics,
): ScenarioColumnView {
  return {
    key,
    label,
    annualCashFlow: formatMoneyMajor(metrics.annualCashFlow.toMajorNumber()),
    noi: formatMoneyMajor(metrics.noi.toMajorNumber()),
    dscr: formatDscr(metrics.dscr),
    monthlyCashFlow: formatMoneyMajor(metrics.monthlyCashFlow.toMajorNumber()),
  };
}

export function buildScenarioComparisonView(input: {
  base: Year1OperatingMetrics;
  conservative: Year1OperatingMetrics;
  optimistic: Year1OperatingMetrics;
}): ScenarioComparisonView {
  return {
    columns: [
      year1ToScenarioColumn("conservative", "Konzervativní", input.conservative),
      year1ToScenarioColumn("base", "Realistický", input.base),
      year1ToScenarioColumn("optimistic", "Optimistický", input.optimistic),
    ],
  };
}

export type MetricDisplay = {
  formulaKey: string;
  label: string;
  displayValue: string;
  available: boolean;
  statusReason: string | null;
  tone: "neutral" | "positive" | "negative";
};

function findMetric(
  result: OrchestratedCalculationResult,
  formulaKey: string,
): CalculationMetric | undefined {
  return (
    result.availableMetrics.find((m) => m.formulaKey === formulaKey) ??
    result.unavailableMetrics.find((m) => m.formulaKey === formulaKey)
  );
}

function formatMetricValue(metric: CalculationMetric | undefined): {
  displayValue: string;
  available: boolean;
  statusReason: string | null;
  tone: MetricDisplay["tone"];
} {
  if (!metric) {
    return {
      displayValue: UNAVAILABLE_LABEL,
      available: false,
      statusReason: null,
      tone: "neutral",
    };
  }

  if (metric.status === "not_applicable") {
    return {
      displayValue: "N/A",
      available: false,
      statusReason: metric.statusReason,
      tone: "neutral",
    };
  }

  if (metric.status !== "calculated" || metric.value == null) {
    return {
      displayValue: UNAVAILABLE_LABEL,
      available: false,
      statusReason: metric?.statusReason ?? null,
      tone: "neutral",
    };
  }

  if (metric.kind === "money") {
    const major = Number(metric.value.amountMinor) / 100;
    const tone: MetricDisplay["tone"] =
      major > 0 ? "positive" : major < 0 ? "negative" : "neutral";
    return {
      displayValue: formatCzk(major),
      available: true,
      statusReason: null,
      tone,
    };
  }

  if (metric.formulaKey === "dscr") {
    const multiple = Number(metric.value.ratio);
    return {
      displayValue: Number.isFinite(multiple) ? multiple.toFixed(2) : UNAVAILABLE_LABEL,
      available: true,
      statusReason: null,
      tone: multiple >= 1 ? "positive" : "negative",
    };
  }

  const ratio = Number(metric.value.ratio);
  return {
    displayValue: formatPercent(ratio),
    available: true,
    statusReason: null,
    tone: "neutral",
  };
}

const METRIC_LABELS: Record<string, string> = {
  net_yield: "Čistý výnos",
  gross_yield: "Hrubý výnos",
  noi: "NOI",
  monthly_cash_flow: "Měsíční CF",
  annual_cash_flow_leveraged: "Roční CF",
  equity_required: "Vlastní kapitál",
  total_acquisition_cost: "Pořizovací náklady",
  cash_on_cash: "Cash-on-cash",
};

export function metricDisplayFromResult(
  result: OrchestratedCalculationResult,
  formulaKey: string,
): MetricDisplay {
  const metric = findMetric(result, formulaKey);
  const formatted = formatMetricValue(metric);
  return {
    formulaKey,
    label: METRIC_LABELS[formulaKey] ?? formulaKey,
    ...formatted,
  };
}

export type AcquisitionLineView = {
  key: string;
  label: string;
  amount: string;
};

const ACQUISITION_LABELS: Record<string, string> = {
  purchasePrice: "Kupní cena",
  acquisitionCosts: "Náklady na pořízení",
  renovation: "Rekonstrukce",
  initialFurnishing: "Vybavení",
  fees: "Poplatky",
};

export function acquisitionBreakdownFromResult(
  result: OrchestratedCalculationResult,
): {
  lines: AcquisitionLineView[];
  total: string | null;
} {
  const acq = result.acquisition;
  if (!acq || acq.status !== "calculated" || acq.total == null) {
    return { lines: [], total: null };
  }

  const lines: AcquisitionLineView[] = [];
  for (const key of acq.includedLines) {
    const raw = acq[key as keyof typeof acq];
    if (raw == null || typeof raw !== "object" || !("amountMinor" in raw)) {
      continue;
    }
    const major = Number((raw as { amountMinor: string }).amountMinor) / 100;
    lines.push({
      key,
      label: ACQUISITION_LABELS[key] ?? key,
      amount: formatCzk(major),
    });
  }

  return {
    lines,
    total: formatCzk(Number(acq.total.amountMinor) / 100),
  };
}

/** Build substituted values text for explainability dialogs. */
export function formatSubstitutionLines(
  result: OrchestratedCalculationResult,
  formulaKey: string,
): string[] {
  const lines: string[] = [];
  const metric = findMetric(result, formulaKey);
  if (!metric) return lines;

  if (metric.status !== "calculated" || metric.value == null) {
    if (metric.statusReason) lines.push(metric.statusReason);
    return lines;
  }

  if (formulaKey === "net_yield") {
    const noi = findMetric(result, "noi");
    const tac = findMetric(result, "total_acquisition_cost");
    if (noi?.kind === "money" && noi.value) {
      lines.push(`NOI = ${formatCzk(Number(noi.value.amountMinor) / 100)}`);
    }
    if (tac?.kind === "money" && tac.value) {
      lines.push(
        `Total Acquisition Cost = ${formatCzk(Number(tac.value.amountMinor) / 100)}`,
      );
    }
  }

  if (formulaKey === "noi") {
    const egi = findMetric(result, "effective_gross_income");
    const opex = findMetric(result, "operating_expenses");
    if (egi?.kind === "money" && egi.value) {
      lines.push(`EGI = ${formatCzk(Number(egi.value.amountMinor) / 100)}`);
    }
    if (opex?.kind === "money" && opex.value) {
      lines.push(`Opex = ${formatCzk(Number(opex.value.amountMinor) / 100)}`);
    }
  }

  const formatted = formatMetricValue(metric);
  lines.push(`Výsledek = ${formatted.displayValue}`);
  return lines;
}
