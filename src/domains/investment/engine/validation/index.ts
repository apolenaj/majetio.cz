export {
  CALCULATION_ERROR_CATEGORIES,
  RESULT_WARNING_CODES,
  calculationIntentSchema,
  validateDomainInputs,
  classifyLoanAmount,
  type CalculationErrorCategory,
  type CalculationIssue,
  type ResultWarning,
  type ResultWarningCode,
  type CalculationIntent,
} from "./domain-validation";

export {
  notApplicableMoneyMetric,
  notApplicableRatioMetric,
  errorMoneyMetric,
  errorRatioMetric,
} from "./metric-status";
