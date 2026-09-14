/**
 * Pure orchestration runner — calls the calculation engine and returns
 * available / unavailable metrics (never invents 0 for missing inputs).
 */

import {
  Money,
  type Percentage,
  nominalInterestRateFromRatio,
} from "@/domains/finance";

import {
  FORMULA_REGISTRY_VERSION,
  INVESTMENT_ENGINE_VERSION,
  annualFromMonthly,
  calculateAnnuityPayment,
  calculateCapRate,
  calculateCashFlows,
  calculateCashOnCash,
  calculateDscr,
  calculateEquityRequired,
  calculateGrossIncome,
  calculateLtv,
  calculateNoi,
  calculateYields,
  computeTotalAcquisitionCost,
  insufficientMoneyMetric,
  insufficientRatioMetric,
  moneyFromDtoOrNull,
  moneyToDto,
  notApplicableMoneyMetric,
  notApplicableRatioMetric,
  percentageFromDtoOrNull,
  percentageToDto,
  validateDomainInputs,
  classifyLoanAmount,
  type CalculationIntent,
  type CalculationMetric,
  type FormulaKey,
  type InvestmentCalculationInput,
  type ResultWarning,
  type TotalAcquisitionCost,
} from "../engine";

import type { AssumptionSet } from "./assumptions";
import { intentFromScenarioType } from "./intent";
import { mergeSnapshotWithAssumptions } from "./merge-input";
import type { PropertyInvestmentSnapshot } from "./property-snapshot";
import {
  splitMetrics,
  type AnalysisScenarioTypeCode,
  type CalculationIssue,
  type OrchestratedCalculationResult,
} from "./types";
import { mergeResultWarnings } from "./warning-helpers";

function moneyMetric(formulaKey: FormulaKey, value: Money): CalculationMetric {
  return {
    kind: "money",
    formulaKey,
    status: "calculated",
    value: moneyToDto(value),
    statusReason: null,
  };
}

function ratioMetric(
  formulaKey: FormulaKey,
  value: Percentage,
): CalculationMetric {
  return {
    kind: "ratio",
    formulaKey,
    status: "calculated",
    value: percentageToDto(value),
    statusReason: null,
  };
}

/** DSCR stored as ratio DTO for schema compatibility; UI formats as multiple. */
function dscrMetric(value: number, reason: string | null = null): CalculationMetric {
  return {
    kind: "ratio",
    formulaKey: "dscr",
    status: "calculated",
    value: { ratio: String(value) },
    statusReason: reason,
  };
}

function extractValidationFields(input: InvestmentCalculationInput) {
  const purchase = moneyFromDtoOrNull(input.acquisition.purchasePrice);
  const annualOpex = moneyFromDtoOrNull(input.incomeExpense.annualOperatingCosts);
  const monthlyOpex = moneyFromDtoOrNull(input.incomeExpense.monthlyOperatingCosts);
  const opexMajor =
    annualOpex?.toMajorNumber() ??
    (monthlyOpex != null ? monthlyOpex.toMajorNumber() * 12 : null);

  const loan = moneyFromDtoOrNull(input.financing.loanAmount);
  const rate = percentageFromDtoOrNull(input.financing.nominalInterestRate);
  const vacancy = percentageFromDtoOrNull(input.incomeExpense.vacancyRate);
  const appreciation = percentageFromDtoOrNull(input.market.appreciationRate);
  const rentGrowth = percentageFromDtoOrNull(input.market.rentGrowthRate);

  return {
    purchasePriceMajor: purchase?.toMajorNumber() ?? null,
    termYears: input.financing.termYears ?? null,
    vacancyRatio: vacancy?.toRatio().toNumber() ?? null,
    annualOpexMajor: opexMajor,
    interestRateRatio: rate?.toRatio().toNumber() ?? null,
    appreciationRatio: appreciation?.toRatio().toNumber() ?? null,
    rentGrowthRatio: rentGrowth?.toRatio().toNumber() ?? null,
    loanAmountMajor: loan?.toMajorNumber() ?? null,
  };
}

function resolveAnnualOpex(
  input: InvestmentCalculationInput,
  warnings: string[],
): Money | null {
  const annual = moneyFromDtoOrNull(input.incomeExpense.annualOperatingCosts);
  if (annual != null) return annual.roundForDisplay();

  const monthly = moneyFromDtoOrNull(input.incomeExpense.monthlyOperatingCosts);
  if (monthly != null) return annualFromMonthly(monthly);

  warnings.push(
    "Provozní náklady chybí — NOI nelze spočítat (nepoužíváme 0 Kč jako náhradu)",
  );
  return null;
}

function resolveDebtService(
  input: InvestmentCalculationInput,
  warnings: string[],
): {
  monthly: Money | null;
  annual: Money | null;
  principal: Money | null;
  loanClass: ReturnType<typeof classifyLoanAmount>;
} {
  const principalDto = input.financing.loanAmount;
  const principal = moneyFromDtoOrNull(principalDto);
  const loanMajor =
    principalDto == null ? null : (principal?.toMajorNumber() ?? 0);
  const loanClass = classifyLoanAmount(loanMajor);

  if (loanClass === "missing" || loanClass === "cash") {
    return { monthly: null, annual: null, principal: null, loanClass };
  }

  const rateDto = input.financing.nominalInterestRate;
  const termYears = input.financing.termYears;

  if (rateDto == null || termYears == null) {
    warnings.push(
      "Úvěr je zadán, ale chybí nominální sazba nebo splatnost — debt service není k dispozici",
    );
    return { monthly: null, annual: null, principal, loanClass };
  }

  const rate = percentageFromDtoOrNull(rateDto);
  if (rate == null || principal == null) {
    return { monthly: null, annual: null, principal, loanClass };
  }

  const annuity = calculateAnnuityPayment({
    principal,
    nominalInterestRate: nominalInterestRateFromRatio(rate.toRatio()),
    termYears,
  });
  return {
    monthly: annuity.monthlyDebtService.value,
    annual: annuity.annualDebtService.value,
    principal,
    loanClass,
  };
}

function acquisitionToResult(tac: TotalAcquisitionCost) {
  return {
    formulaKey: "total_acquisition_cost" as const,
    status: "calculated" as const,
    purchasePrice: moneyToDto(tac.purchasePrice),
    acquisitionCosts:
      tac.acquisitionCosts != null ? moneyToDto(tac.acquisitionCosts) : null,
    renovation: tac.renovation != null ? moneyToDto(tac.renovation) : null,
    initialFurnishing:
      tac.initialFurnishing != null ? moneyToDto(tac.initialFurnishing) : null,
    fees: tac.fees != null ? moneyToDto(tac.fees) : null,
    total: moneyToDto(tac.total),
    includedLines: [...tac.includedLines],
    statusReason: null,
  };
}

function upsert(
  byKey: Map<string, CalculationMetric>,
  metric: CalculationMetric,
) {
  byKey.set(metric.formulaKey, metric);
}

function markYieldMetricsNotApplicable(
  byKey: Map<string, CalculationMetric>,
  reason: string,
) {
  upsert(byKey, notApplicableRatioMetric("gross_yield", reason));
  upsert(byKey, notApplicableRatioMetric("net_yield", reason));
  upsert(byKey, notApplicableRatioMetric("cap_rate", reason));
}

function markIncomeMetricsInsufficient(
  byKey: Map<string, CalculationMetric>,
  reason: string,
) {
  upsert(byKey, insufficientMoneyMetric("potential_gross_income", reason));
  upsert(byKey, insufficientMoneyMetric("effective_gross_income", reason));
  upsert(byKey, insufficientMoneyMetric("noi", reason));
  upsert(byKey, insufficientRatioMetric("gross_yield", reason));
  upsert(byKey, insufficientRatioMetric("net_yield", reason));
  upsert(byKey, insufficientRatioMetric("cap_rate", reason));
}

function markIncomeMetricsNotApplicable(
  byKey: Map<string, CalculationMetric>,
  reason: string,
) {
  upsert(byKey, notApplicableMoneyMetric("potential_gross_income", reason));
  upsert(byKey, notApplicableMoneyMetric("effective_gross_income", reason));
  upsert(byKey, notApplicableMoneyMetric("noi", reason));
  markYieldMetricsNotApplicable(byKey, reason);
}

/**
 * Execute year-1 investment metrics from a merged engine input.
 */
export function executeEngineCalculation(params: {
  input: InvestmentCalculationInput;
  warnings: string[];
  resultWarnings?: ResultWarning[];
  intent?: CalculationIntent;
  scenarioType: AnalysisScenarioTypeCode;
  inputHash: string;
  asOf?: Date;
}): OrchestratedCalculationResult {
  const { input, scenarioType, inputHash } = params;
  const warnings = [...params.warnings];
  const intent = params.intent ?? intentFromScenarioType(scenarioType);
  let resultWarnings = [...(params.resultWarnings ?? [])];
  const byKey = new Map<string, CalculationMetric>();
  const asOf = params.asOf ?? new Date();
  const currency = input.property.currency;

  const validation = validateDomainInputs(extractValidationFields(input));
  if (!validation.ok) {
    const unavailableMetrics: CalculationMetric[] = [
      insufficientMoneyMetric(
        "total_acquisition_cost",
        validation.issues[0]?.message ?? "Neplatné vstupy",
      ),
      insufficientMoneyMetric("noi", "Neplatné vstupy"),
      insufficientRatioMetric("net_yield", "Neplatné vstupy"),
    ];
    return {
      schemaVersion: "1.0.0",
      engineVersion: INVESTMENT_ENGINE_VERSION,
      formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
      calculatedAt: asOf.toISOString(),
      currency,
      scenarioType,
      inputHash,
      status: "FAILED",
      acquisition: null,
      availableMetrics: [],
      unavailableMetrics,
      resultWarnings: [],
      issues: validation.issues,
      warnings: [
        ...warnings,
        ...validation.issues.map((i: CalculationIssue) => i.message),
      ],
      inputSchemaVersion: "1.0.0",
      cacheHit: false,
    };
  }
  resultWarnings = mergeResultWarnings(resultWarnings, validation.warnings);

  const tac = computeTotalAcquisitionCost(input.acquisition);
  upsert(byKey, moneyMetric("total_acquisition_cost", tac.total));

  const rentKnown =
    input.incomeExpense.monthlyRent != null ||
    input.incomeExpense.annualRent != null;

  let noi: Money | null = null;

  if (intent === "own_use") {
    markIncomeMetricsNotApplicable(
      byKey,
      "Vlastní bydlení — výnosové metriky nejsou relevantní",
    );
    const opex = resolveAnnualOpex(input, warnings);
    if (opex == null) {
      upsert(
        byKey,
        insufficientMoneyMetric(
          "operating_expenses",
          "Chybí provozní náklady",
        ),
      );
    } else {
      upsert(byKey, moneyMetric("operating_expenses", opex));
      noi = Money.zero(currency).sub(opex).roundForDisplay();
      upsert(byKey, moneyMetric("noi", noi));
    }
  } else if (!rentKnown) {
    markIncomeMetricsInsufficient(byKey, "Chybí údaj o nájmu");
  } else {
    const income = calculateGrossIncome({
      monthlyRent: moneyFromDtoOrNull(input.incomeExpense.monthlyRent),
      annualRent: moneyFromDtoOrNull(input.incomeExpense.annualRent),
      vacancyRate: percentageFromDtoOrNull(input.incomeExpense.vacancyRate),
    });
    const egi = income.effectiveGrossIncome.value;
    upsert(
      byKey,
      moneyMetric("potential_gross_income", income.potentialGrossIncome.value),
    );
    upsert(byKey, moneyMetric("vacancy_loss", income.vacancyLoss.value));
    upsert(byKey, moneyMetric("effective_gross_income", egi));

    const opex = resolveAnnualOpex(input, warnings);
    if (opex == null) {
      upsert(
        byKey,
        insufficientMoneyMetric(
          "operating_expenses",
          "Chybí provozní náklady",
        ),
      );
      upsert(
        byKey,
        insufficientMoneyMetric(
          "noi",
          "Chybí provozní náklady pro výpočet NOI",
        ),
      );
      upsert(
        byKey,
        insufficientRatioMetric("net_yield", "NOI není k dispozici"),
      );
      upsert(
        byKey,
        insufficientRatioMetric("cap_rate", "NOI není k dispozici"),
      );
      const grossOnly = calculateYields({
        effectiveGrossIncome: egi,
        noi: egi,
        totalAcquisitionCost: tac.total,
      });
      upsert(byKey, ratioMetric("gross_yield", grossOnly.grossYield.value));
    } else {
      upsert(byKey, moneyMetric("operating_expenses", opex));
      noi = calculateNoi({
        effectiveGrossIncome: egi,
        annualOperatingExpenses: opex,
      }).value;
      upsert(byKey, moneyMetric("noi", noi));

      const yields = calculateYields({
        effectiveGrossIncome: egi,
        noi,
        totalAcquisitionCost: tac.total,
      });
      upsert(byKey, ratioMetric("gross_yield", yields.grossYield.value));
      upsert(byKey, ratioMetric("net_yield", yields.netYield.value));
      upsert(
        byKey,
        ratioMetric(
          "cap_rate",
          calculateCapRate({ noi, propertyValue: tac.total }).value,
        ),
      );
    }
  }

  const debt = resolveDebtService(input, warnings);
  const equity = calculateEquityRequired({
    totalAcquisitionCost: tac.total,
    loanPrincipal: debt.principal,
  });
  upsert(byKey, moneyMetric("equity_required", equity.value));

  if (debt.loanClass === "financed" && debt.principal != null) {
    if (!tac.total.isZero()) {
      const ltv = calculateLtv({
        loanPrincipal: debt.principal,
        propertyValue: tac.total,
      }).value;
      upsert(byKey, ratioMetric("ltv", ltv));
      if (ltv.toRatio().gt(1)) {
        resultWarnings = mergeResultWarnings(resultWarnings, [
          {
            code: "ltv_over_100",
            severity: "warning",
            message:
              "LTV > 100 % — platné custom financování; ověřte parametry úvěru.",
          },
        ]);
      }
    }
    if (debt.monthly != null && debt.annual != null) {
      upsert(byKey, moneyMetric("monthly_debt_service", debt.monthly));
      upsert(byKey, moneyMetric("annual_debt_service", debt.annual));
    } else {
      upsert(
        byKey,
        insufficientMoneyMetric(
          "monthly_debt_service",
          "Chybí sazba nebo splatnost úvěru",
        ),
      );
    }
  }

  if (debt.loanClass === "cash" || debt.loanClass === "missing") {
    upsert(
      byKey,
      notApplicableRatioMetric(
        "dscr",
        debt.loanClass === "cash"
          ? "Cash purchase — DSCR není relevantní"
          : "Bez úvěru — DSCR není relevantní",
      ),
    );
  } else if (noi != null && debt.annual != null) {
    const dscr = calculateDscr({ noi, annualDebtService: debt.annual });
    if (dscr.value != null) {
      upsert(byKey, dscrMetric(dscr.value));
    } else {
      upsert(
        byKey,
        notApplicableRatioMetric(
          "dscr",
          dscr.undefinedReason ?? "DSCR není definován",
        ),
      );
    }
  } else {
    upsert(
      byKey,
      insufficientRatioMetric(
        "dscr",
        "Chybí NOI nebo debt service pro DSCR",
      ),
    );
  }

  if (noi != null) {
    const cfs = calculateCashFlows({
      noi,
      monthlyDebtService: debt.monthly,
    });
    upsert(
      byKey,
      moneyMetric("monthly_cash_flow_unlevered", cfs.monthlyUnlevered.value),
    );
    upsert(
      byKey,
      moneyMetric("annual_cash_flow_unlevered", cfs.annualUnlevered.value),
    );
    upsert(byKey, moneyMetric("monthly_cash_flow", cfs.monthlyLeveraged.value));
    upsert(
      byKey,
      moneyMetric("annual_cash_flow_leveraged", cfs.annualLeveraged.value),
    );

    const annualCfMajor = cfs.annualLeveraged.value.toMajorNumber();
    if (annualCfMajor < 0) {
      resultWarnings = mergeResultWarnings(resultWarnings, [
        {
          code: "negative_cash_flow",
          severity: "info",
          message:
            "Záporný cash flow — běžný jev u financovaných nemovitostí; není chyba výpočtu.",
        },
      ]);
    }

    const coc = calculateCashOnCash({
      annualLeveragedCashFlow: cfs.annualLeveraged.value,
      equityRequired: equity.value,
    });
    if (coc.value != null) {
      upsert(byKey, ratioMetric("cash_on_cash", coc.value));
    } else {
      upsert(
        byKey,
        insufficientRatioMetric(
          "cash_on_cash",
          coc.undefinedReason ?? "Cash-on-cash nelze spočítat",
        ),
      );
    }
  } else if (intent !== "own_use") {
    upsert(
      byKey,
      insufficientMoneyMetric("monthly_cash_flow", "NOI není k dispozici"),
    );
    upsert(
      byKey,
      insufficientMoneyMetric(
        "annual_cash_flow_leveraged",
        "NOI není k dispozici",
      ),
    );
  }

  const all = [...byKey.values()];
  const { availableMetrics, unavailableMetrics } = splitMetrics(all);
  const status =
    unavailableMetrics.length === 0
      ? ("CALCULATED" as const)
      : availableMetrics.length === 0
        ? ("FAILED" as const)
        : ("PARTIAL" as const);

  return {
    schemaVersion: "1.0.0",
    engineVersion: INVESTMENT_ENGINE_VERSION,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    calculatedAt: asOf.toISOString(),
    currency,
    scenarioType,
    inputHash,
    status,
    acquisition: acquisitionToResult(tac),
    availableMetrics,
    unavailableMetrics,
    resultWarnings,
    issues: [],
    warnings,
    inputSchemaVersion: "1.0.0",
    cacheHit: false,
  };
}

/**
 * Full pure run from snapshot + assumptions (no I/O).
 */
export function runInvestmentCalculationPure(params: {
  propertySnapshot: PropertyInvestmentSnapshot;
  assumptionSet?: AssumptionSet;
  scenarioType?: AnalysisScenarioTypeCode;
  intent?: CalculationIntent;
  inputHash: string;
  asOf?: Date;
}): OrchestratedCalculationResult {
  const scenarioType = params.scenarioType ?? "BASE_METRICS";
  const intent = params.intent ?? intentFromScenarioType(scenarioType);
  const merged = mergeSnapshotWithAssumptions(
    params.propertySnapshot,
    params.assumptionSet ?? {},
    { intent },
  );

  if (merged.input == null) {
    const unavailableMetrics: CalculationMetric[] = [
      insufficientMoneyMetric(
        "total_acquisition_cost",
        merged.blockingReasons[0] ?? "Chybí vstupy",
      ),
      insufficientMoneyMetric("noi", "Chybí vstupy"),
      insufficientRatioMetric("net_yield", "Chybí vstupy"),
      insufficientMoneyMetric("monthly_cash_flow", "Chybí vstupy"),
    ];
    return {
      schemaVersion: "1.0.0",
      engineVersion: INVESTMENT_ENGINE_VERSION,
      formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
      calculatedAt: (params.asOf ?? new Date()).toISOString(),
      currency: params.propertySnapshot.currency,
      scenarioType,
      inputHash: params.inputHash,
      status: "FAILED",
      acquisition: null,
      availableMetrics: [],
      unavailableMetrics,
      resultWarnings: [],
      issues: merged.issues ?? [],
      warnings: [...merged.warnings, ...merged.blockingReasons],
      inputSchemaVersion: "1.0.0",
      cacheHit: false,
    };
  }

  return executeEngineCalculation({
    input: merged.input,
    warnings: merged.warnings,
    resultWarnings: merged.resultWarnings,
    intent,
    scenarioType,
    inputHash: params.inputHash,
    asOf: params.asOf,
  });
}
