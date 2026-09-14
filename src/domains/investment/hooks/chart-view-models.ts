/**
 * Chart / decomposition view-models for CalculatorShell visualizations.
 */

import {
  Money,
  Percentage,
  nominalInterestRateFromPercentPoints,
} from "@/domains/finance";
import { formatCzk } from "@/lib/format";

import {
  projectHoldingPeriod,
  type HoldingYearRow,
} from "../engine";
import type { OrchestratedCalculationResult } from "../service/types";
import type { InvestmentCalculatorInputs } from "./calculator-inputs";
import { resolveLoanAmount } from "./input-mapping";
import { buildRiskBaseCaseFromInputs } from "./risk-base-from-inputs";

export type CashFlowBreakdownView = {
  incomeMonthly: number | null;
  opexMonthly: number | null;
  debtServiceMonthly: number | null;
  cashFlowMonthly: number | null;
  /** Accessible callout copy. */
  callout: {
    tone: "positive" | "negative" | "neutral" | "unavailable";
    headline: string;
    detail: string;
  };
  barSeries: { label: string; value: number }[];
};

function metricMajor(
  result: OrchestratedCalculationResult,
  key: string,
): number | null {
  const m =
    result.availableMetrics.find((x) => x.formulaKey === key) ??
    result.unavailableMetrics.find((x) => x.formulaKey === key);
  if (!m || m.status !== "calculated" || m.value == null || m.kind !== "money") {
    return null;
  }
  return Number(m.value.amountMinor) / 100;
}

export function buildCashFlowBreakdownView(
  result: OrchestratedCalculationResult,
  inputs: InvestmentCalculatorInputs,
): CashFlowBreakdownView {
  const incomeAnnual =
    inputs.monthlyRent != null
      ? inputs.monthlyRent *
        12 *
        (1 - (inputs.vacancyPp ?? 0) / 100)
      : null;
  const incomeMonthly =
    incomeAnnual != null ? incomeAnnual / 12 : null;
  const opexMonthly =
    inputs.annualOpex != null ? inputs.annualOpex / 12 : null;
  const debtServiceMonthly = metricMajor(result, "monthly_debt_service");
  const cashFlowMonthly = metricMajor(result, "monthly_cash_flow");

  let callout: CashFlowBreakdownView["callout"];
  if (cashFlowMonthly == null) {
    callout = {
      tone: "unavailable",
      headline: "Měsíční cash flow nelze spočítat",
      detail: "Doplňte nájem a provozní náklady — chybějící vstupy neplníme nulou.",
    };
  } else if (cashFlowMonthly < 0) {
    callout = {
      tone: "negative",
      headline: formatCzk(cashFlowMonthly, { signed: true }),
      detail: `Budete muset tuto částku měsíčně doplácet (modelovaný výsledek, ne garance).`,
    };
  } else if (cashFlowMonthly > 0) {
    callout = {
      tone: "positive",
      headline: `Modelované měsíční CF: ${formatCzk(cashFlowMonthly, { signed: true })}`,
      detail:
        "Jde o modelovaný scénář při zadaných předpokladech — nikoli slib výdělku.",
    };
  } else {
    callout = {
      tone: "neutral",
      headline: "Modelované měsíční CF: 0 Kč",
      detail: "Příjmy pokrývají náklady a splátku bez přebytku.",
    };
  }

  const barSeries: { label: string; value: number }[] = [];
  if (incomeMonthly != null) {
    barSeries.push({ label: "Příjem", value: Math.round(incomeMonthly) });
  }
  if (opexMonthly != null) {
    barSeries.push({
      label: "Provoz",
      value: -Math.round(Math.abs(opexMonthly)),
    });
  }
  if (debtServiceMonthly != null) {
    barSeries.push({
      label: "Splátka",
      value: -Math.round(Math.abs(debtServiceMonthly)),
    });
  }
  if (cashFlowMonthly != null) {
    barSeries.push({
      label: "CF",
      value: Math.round(cashFlowMonthly),
    });
  }

  return {
    incomeMonthly:
      incomeMonthly != null ? Math.round(incomeMonthly) : null,
    opexMonthly: opexMonthly != null ? Math.round(opexMonthly) : null,
    debtServiceMonthly:
      debtServiceMonthly != null ? Math.round(debtServiceMonthly) : null,
    cashFlowMonthly:
      cashFlowMonthly != null ? Math.round(cashFlowMonthly) : null,
    callout,
    barSeries,
  };
}

export type ProjectionChartView = {
  rows: {
    year: number;
    propertyValue: number;
    loanBalance: number;
    equity: number;
  }[];
  summary: string;
};

export function buildProjectionChartView(
  inputs: InvestmentCalculatorInputs,
): ProjectionChartView | null {
  const risk = buildRiskBaseCaseFromInputs(inputs);
  if (!risk) return null;

  const holdYears = Math.min(30, Math.max(1, inputs.holdYears ?? 10));
  const appreciation = Percentage.fromPercentPoints(inputs.appreciationPp ?? 3);
  const rentGrowth = Percentage.fromPercentPoints(inputs.rentGrowthPp ?? 2);
  const expenseInflation = Percentage.fromPercentPoints(
    inputs.expenseInflationPp ?? 2,
  );

  const loanAmount = resolveLoanAmount(inputs);
  try {
    const projection = projectHoldingPeriod({
      holdYears,
      baseEgi: risk.annualEgi,
      baseOpex: risk.annualOpex,
      initialPropertyValue: risk.totalAcquisitionCost,
      appreciationRate: appreciation,
      rentGrowthRate: rentGrowth,
      expenseInflationRate: expenseInflation,
      loan:
        loanAmount != null &&
        loanAmount > 0 &&
        inputs.interestRatePp != null &&
        inputs.termYears != null
          ? {
              principal: Money.fromMajor(loanAmount, "CZK"),
              nominalInterestRate: nominalInterestRateFromPercentPoints(
                inputs.interestRatePp,
              ),
              termYears: inputs.termYears,
            }
          : null,
      sellingCostRate: Percentage.fromPercentPoints(inputs.sellingCostPp ?? 3),
    });

    const rows = projection.projection.value.map((row: HoldingYearRow) => {
      const propertyValue = row.propertyValue.toMajorNumber();
      const loanBalance = row.loanBalanceEndOfYear.toMajorNumber();
      return {
        year: row.year,
        propertyValue: Math.round(propertyValue),
        loanBalance: Math.round(loanBalance),
        equity: Math.round(propertyValue - loanBalance),
      };
    });

    return {
      rows,
      summary: `Projekce hodnoty nemovitosti, zůstatku úvěru a equity na ${holdYears} let.`,
    };
  } catch {
    return null;
  }
}

export type EquityGrowthView = {
  segments: {
    key: string;
    label: string;
    amount: number;
    modeled?: boolean;
  }[];
  total: number;
};

export function buildEquityGrowthView(
  inputs: InvestmentCalculatorInputs,
  projection: ProjectionChartView | null,
): EquityGrowthView | null {
  const initialEquity = inputs.equity ?? null;
  if (initialEquity == null || !projection || projection.rows.length === 0) {
    return null;
  }
  const last = projection.rows[projection.rows.length - 1]!;
  const firstLoan = resolveLoanAmount(inputs) ?? 0;
  const lastLoan = last.loanBalance;
  const principalRepayment = Math.max(0, firstLoan - lastLoan);
  const endEquity = last.equity;
  const appreciation = Math.max(
    0,
    endEquity - initialEquity - principalRepayment,
  );

  const segments = [
    {
      key: "initial",
      label: "Počáteční equity",
      amount: Math.round(initialEquity),
    },
    {
      key: "principal",
      label: "Splacená jistina",
      amount: Math.round(principalRepayment),
    },
    {
      key: "appreciation",
      label: "Appreciation (modelovaná)",
      amount: Math.round(appreciation),
      modeled: true,
    },
  ];

  return {
    segments,
    total: Math.round(endEquity),
  };
}

export type ReturnDecompositionView = {
  segments: { key: string; label: string; amount: number; modeled?: boolean }[];
};

export function buildReturnDecompositionView(
  result: OrchestratedCalculationResult,
  inputs: InvestmentCalculatorInputs,
  projection: ProjectionChartView | null,
): ReturnDecompositionView | null {
  const annualCf = metricMajor(result, "annual_cash_flow_leveraged");
  const holdYears = inputs.holdYears ?? 10;
  const operatingCf =
    annualCf != null ? Math.round(annualCf * holdYears) : null;

  const loan = resolveLoanAmount(inputs) ?? 0;
  const lastLoan = projection?.rows.at(-1)?.loanBalance ?? loan;
  const debtPaydown = Math.round(Math.max(0, loan - lastLoan));

  const purchase = inputs.purchasePrice ?? 0;
  const endValue = projection?.rows.at(-1)?.propertyValue ?? purchase;
  const appreciation = Math.round(Math.max(0, endValue - purchase));

  const saleCosts = Math.round((endValue * (inputs.sellingCostPp ?? 3)) / 100);
  const saleProceeds = Math.round(endValue - saleCosts - lastLoan);

  if (operatingCf == null && !projection) return null;

  return {
    segments: [
      {
        key: "operating",
        label: "Provozní CF (kumulativní, model)",
        amount: operatingCf ?? 0,
        modeled: true,
      },
      {
        key: "paydown",
        label: "Splacení dluhu",
        amount: debtPaydown,
      },
      {
        key: "appreciation",
        label: "Appreciation (modelovaná)",
        amount: appreciation,
        modeled: true,
      },
      {
        key: "sale",
        label: "Čistý výnos z prodeje (model)",
        amount: saleProceeds,
        modeled: true,
      },
    ],
  };
}
