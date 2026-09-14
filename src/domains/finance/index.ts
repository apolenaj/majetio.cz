export {
  CURRENCY_CODES,
  MAJETIO_MARKET_CURRENCIES,
  assertCurrencyCode,
  assertSameCurrency,
  currencyMinorDigits,
  currencyScaleFactor,
  isCurrencyCode,
  type CurrencyCode,
} from "./primitives/currency";

export {
  Money,
  CurrencyMismatchError,
  isMissingMoney,
  isZeroMoney,
  type MoneyMajorInput,
} from "./primitives/money";

export {
  Percentage,
  isMissingPercentage,
  isZeroPercentage,
} from "./primitives/percentage";

export {
  TypedRate,
  RATE_KINDS,
  assertRateKind,
  nominalInterestRateFromPercentPoints,
  nominalInterestRateFromRatio,
  aprFromPercentPoints,
  aprFromRatio,
  appreciationRateFromPercentPoints,
  appreciationRateFromRatio,
  type RateKind,
  type NominalInterestRate,
  type AprRate,
  type AppreciationRate,
} from "./primitives/rates";

export {
  DECIMAL_CONFIG,
  ROUNDING_POLICY,
  roundInternal,
  roundMoneyMajorForDisplay,
  roundPercentPointsForDisplay,
  roundRatePercentPointsForDisplay,
  toDecimal,
} from "./primitives/rounding";

export {
  type ExchangeRateSnapshot,
  type ExchangeRateSource,
  type LegacyExchangeRateSnapshot,
  type DualCurrencyDisplay,
  type FxRateStatus,
  type FxResolveMode,
  type FxResolvedRate,
  type FxRateStore,
  normalizeExchangeRateSnapshot,
  toLegacyExchangeRateSnapshot,
  identityExchangeRateSnapshot,
  assertValidExchangeRateSnapshot,
  convertMoneyWithSnapshot,
  convertMajorToBaseWithSnapshot,
  assertCalculationBaseCurrency,
  invertSnapshot,
  buildDualCurrencyDisplay,
  dualCurrencyDisclaimerCs,
  dualCurrencyDisclaimerEn,
  DEFAULT_FX_MAX_AGE_MS,
  FxUnavailableError,
  InMemoryFxRateStore,
  resolveExchangeRate,
  convertMoneyWithFxEngine,
} from "./fx";
