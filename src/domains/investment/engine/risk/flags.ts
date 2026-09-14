/**
 * Automatic risk flags from year-1 metrics (pure).
 */

import { bindFormula } from "../calculations/helpers";
import {
  evaluateYear1Metrics,
  type RiskBaseCase,
  type Year1OperatingMetrics,
} from "./base-case";

export const RISK_FLAG_CODES = [
  "negative_cash_flow",
  "high_equity_requirement",
  "low_dscr",
  "high_ltv",
  "thin_yield",
  "insufficient_debt_service_coverage",
] as const;

export type RiskFlagCode = (typeof RISK_FLAG_CODES)[number];

export type RiskFlagSeverity = "info" | "warning" | "critical";

export type RiskFlag = {
  code: RiskFlagCode;
  severity: RiskFlagSeverity;
  message: string;
};

export type RiskFlagsResult = {
  formulaKey: "risk_flags";
  formulaVersion: string;
  metrics: Year1OperatingMetrics;
  flags: RiskFlag[];
};

export type RiskFlagThresholds = {
  /** Equity / TAC above this → high_equity_requirement. Default 0.5 */
  highEquityRatio: number;
  /** DSCR below this → low_dscr. Default 1.2 */
  minDscr: number;
  /** LTV above this → high_ltv. Default 0.8 */
  maxLtv: number;
  /** Net yield (NOI/TAC) below this → thin_yield. Default 0.03 */
  minNetYield: number;
};

export const DEFAULT_RISK_THRESHOLDS: RiskFlagThresholds = {
  highEquityRatio: 0.5,
  minDscr: 1.2,
  maxLtv: 0.8,
  minNetYield: 0.03,
};

export function evaluateRiskFlags(
  base: RiskBaseCase,
  thresholds: RiskFlagThresholds = DEFAULT_RISK_THRESHOLDS,
): RiskFlagsResult {
  const metrics = evaluateYear1Metrics(base);
  const flags: RiskFlag[] = [];
  const bound = bindFormula("risk_flags", null);

  if (metrics.annualCashFlow.isNegative()) {
    flags.push({
      code: "negative_cash_flow",
      severity: "critical",
      message: "Roční leveraged cash flow je záporné",
    });
  }

  if (!base.totalAcquisitionCost.isZero()) {
    const equityRatio = metrics.equityRequired.major.div(
      base.totalAcquisitionCost.major,
    );
    if (equityRatio.gte(thresholds.highEquityRatio)) {
      flags.push({
        code: "high_equity_requirement",
        severity: "warning",
        message: `Vlastní kapitál ≥ ${thresholds.highEquityRatio * 100} % pořizovacích nákladů`,
      });
    }

    const netYield = metrics.noi.major.div(base.totalAcquisitionCost.major);
    if (netYield.lt(thresholds.minNetYield)) {
      flags.push({
        code: "thin_yield",
        severity: "warning",
        message: `Čistý výnos (NOI/TAC) < ${thresholds.minNetYield * 100} %`,
      });
    }
  }

  if (metrics.dscr != null && metrics.dscr < thresholds.minDscr) {
    flags.push({
      code: "low_dscr",
      severity: metrics.dscr < 1 ? "critical" : "warning",
      message: `DSCR ${metrics.dscr.toFixed(2)} pod prahem ${thresholds.minDscr}`,
    });
    if (metrics.dscr < 1) {
      flags.push({
        code: "insufficient_debt_service_coverage",
        severity: "critical",
        message: "NOI nepokryje roční debt service (DSCR < 1)",
      });
    }
  }

  if (
    metrics.ltv != null &&
    metrics.ltv.toRatio().gt(thresholds.maxLtv)
  ) {
    flags.push({
      code: "high_ltv",
      severity: "warning",
      message: `LTV > ${thresholds.maxLtv * 100} %`,
    });
  }

  return {
    formulaKey: "risk_flags",
    formulaVersion: bound.formulaVersion,
    metrics,
    flags,
  };
}
