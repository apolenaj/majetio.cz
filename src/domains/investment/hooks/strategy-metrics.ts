/**
 * Strategy-aware key metric displays for result cards.
 */

import { Money } from "@/domains/finance";
import { formatCzk, formatPercent } from "@/lib/format";

import {
  buildEquityCashFlowSeries,
  calculateIrr,
} from "../engine";
import type { OrchestratedCalculationResult } from "../service/types";
import type { InvestmentCalculatorInputs } from "./calculator-inputs";
import type { ProjectionChartView } from "./chart-view-models";
import {
  metricDisplayFromResult,
  UNAVAILABLE_LABEL,
  type MetricDisplay,
} from "./scenario-view-model";
import { STRATEGY_METRIC_KEYS, type InvestmentStrategy } from "./strategy";

function synthetic(
  formulaKey: string,
  label: string,
  displayValue: string,
  available: boolean,
  tone: MetricDisplay["tone"] = "neutral",
  statusReason: string | null = null,
): MetricDisplay {
  return {
    formulaKey,
    label,
    displayValue,
    available,
    tone,
    statusReason,
  };
}

function moneyMajorFromResult(
  result: OrchestratedCalculationResult,
  key: string,
): number | null {
  const m = result.availableMetrics.find((x) => x.formulaKey === key);
  if (!m || m.kind !== "money" || m.value == null) return null;
  return Number(m.value.amountMinor) / 100;
}

function tryIrr(
  inputs: InvestmentCalculatorInputs,
  result: OrchestratedCalculationResult,
  projection: ProjectionChartView | null,
): MetricDisplay {
  if (!projection || inputs.equity == null || inputs.equity <= 0) {
    return synthetic(
      "irr",
      "IRR",
      UNAVAILABLE_LABEL,
      false,
      "neutral",
      "IRR vyžaduje equity a horizont projekce",
    );
  }

  const year1Cf = moneyMajorFromResult(result, "annual_cash_flow_leveraged");
  if (year1Cf == null) {
    return synthetic(
      "irr",
      "IRR",
      UNAVAILABLE_LABEL,
      false,
      "neutral",
      "Chybí roční cash flow",
    );
  }

  try {
    const equity = Money.fromMajor(inputs.equity, "CZK");
    const annual = projection.rows.map((row, i) => {
      const base = Money.fromMajor(year1Cf, "CZK");
      if (i === projection.rows.length - 1) {
        // Add modeled exit equity gain on last year
        const gain = Money.fromMajor(
          Math.max(0, row.equity - inputs.equity!),
          "CZK",
        );
        return base.add(gain);
      }
      return base;
    });
    const series = buildEquityCashFlowSeries(equity, annual);
    const irr = calculateIrr(series);
    if (irr.value == null) {
      return synthetic(
        "irr",
        "IRR",
        UNAVAILABLE_LABEL,
        false,
        "neutral",
        irr.reason,
      );
    }
    return synthetic(
      "irr",
      "IRR (model)",
      formatPercent(Number(irr.value.toRatio().toString())),
      true,
    );
  } catch {
    return synthetic("irr", "IRR", UNAVAILABLE_LABEL, false);
  }
}

export function buildStrategyMetricDisplays(input: {
  strategy: InvestmentStrategy;
  result: OrchestratedCalculationResult;
  inputs: InvestmentCalculatorInputs;
  projection: ProjectionChartView | null;
}): MetricDisplay[] {
  const keys = STRATEGY_METRIC_KEYS[input.strategy];
  const out: MetricDisplay[] = [];

  for (const key of keys) {
    if (key === "irr_placeholder") {
      out.push(tryIrr(input.inputs, input.result, input.projection));
      continue;
    }
    if (key === "monthly_housing_cost") {
      const ds = moneyMajorFromResult(input.result, "monthly_debt_service") ?? 0;
      const opex =
        input.inputs.annualOpex != null ? input.inputs.annualOpex / 12 : null;
      if (opex == null && ds === 0) {
        out.push(
          synthetic(
            "monthly_housing_cost",
            "Měsíční náklad",
            UNAVAILABLE_LABEL,
            false,
          ),
        );
      } else {
        out.push(
          synthetic(
            "monthly_housing_cost",
            "Měsíční náklad bydlení",
            formatCzk(Math.round(ds + (opex ?? 0))),
            true,
          ),
        );
      }
      continue;
    }
    if (key === "flip_profit_placeholder") {
      const purchase = input.inputs.purchasePrice;
      const reno = input.inputs.renovation ?? 0;
      const end = input.projection?.rows.at(-1)?.propertyValue;
      if (purchase == null || end == null) {
        out.push(
          synthetic(
            "flip_gross_profit",
            "Odhadovaný profit",
            UNAVAILABLE_LABEL,
            false,
            "neutral",
            "Doplňte cenu a horizont",
          ),
        );
      } else {
        const profit = end - purchase - reno;
        out.push(
          synthetic(
            "flip_gross_profit",
            "Odhadovaný profit (model)",
            formatCzk(profit, { signed: true }),
            true,
            profit >= 0 ? "positive" : "negative",
          ),
        );
      }
      continue;
    }
    if (key === "flip_margin_placeholder") {
      const purchase = input.inputs.purchasePrice;
      const reno = input.inputs.renovation ?? 0;
      const end = input.projection?.rows.at(-1)?.propertyValue;
      if (purchase == null || end == null || purchase + reno <= 0) {
        out.push(
          synthetic("flip_cost_margin", "Marže", UNAVAILABLE_LABEL, false),
        );
      } else {
        const cost = purchase + reno;
        const margin = (end - cost) / cost;
        out.push(
          synthetic(
            "flip_cost_margin",
            "Marže (model)",
            formatPercent(margin),
            true,
          ),
        );
      }
      continue;
    }

    out.push(metricDisplayFromResult(input.result, key));
  }

  return out;
}
