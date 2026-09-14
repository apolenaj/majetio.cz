/**
 * Golden fixtures — hand / Excel-precomputed year-1 case (Part 2/D).
 *
 * Case G1 (Praha baseline):
 *   TAC 6_000_000 Kč · nájem 30_000 / měs · vacancy 5 % · opex 72_000 / rok
 *   Úvěr 4_200_000 @ 5.25 % p.a. nominální · 30 let anuita
 *
 * Derivace (excel-compatible):
 *   PGI = 30_000 × 12 = 360_000
 *   Vacancy loss = 360_000 × 0.05 = 18_000
 *   EGI = 342_000
 *   NOI = 342_000 − 72_000 = 270_000
 *   Gross yield = 342_000 / 6_000_000 = 0.057
 *   Net yield = Cap rate = 270_000 / 6_000_000 = 0.045
 *   Equity = 1_800_000 · LTV = 0.7
 *   Annuity (Decimal, ROUND_HALF_UP to haléře): M ≈ 23_192.56 Kč/měs
 */

export const GOLDEN_CASE_G1 = {
  id: "G1_prague_ltr_baseline",
  currency: "CZK" as const,
  inputs: {
    purchasePriceMajor: 6_000_000,
    monthlyRentMajor: 30_000,
    vacancyPercentPoints: 5,
    annualOpexMajor: 72_000,
    loanAmountMajor: 4_200_000,
    interestRatePercentPoints: 5.25,
    termYears: 30,
  },
  expected: {
    pgiMajor: "360000",
    vacancyLossMajor: "18000",
    egiMajor: "342000",
    noiMajor: "270000",
    grossYieldRatio: 0.057,
    netYieldRatio: 0.045,
    capRateRatio: 0.045,
    equityMajor: "1800000",
    ltvRatio: 0.7,
    /** Monthly annuity after money display rounding (haléře). */
    monthlyDebtServiceMajorApprox: 23_192.56,
    monthlyDebtServiceTolerance: 0.02,
    /** Absolute CF may be slightly negative — still a valid result. */
    annualCashFlowMajorApprox: -8_310.72,
    cashFlowTolerance: 1,
    /** CoC = annual CF / equity */
    cashOnCashRatioApprox: -8_310.72 / 1_800_000,
    cocTolerance: 1e-5,
    /** DSCR = NOI / annual DS */
    dscrApprox: 270_000 / (23_192.56 * 12),
    dscrTolerance: 1e-3,
  },
} as const;

/** Cash purchase variant of G1 — no debt service. */
export const GOLDEN_CASE_G1_CASH = {
  id: "G1_cash_purchase",
  currency: "CZK" as const,
  inputs: {
    ...GOLDEN_CASE_G1.inputs,
    loanAmountMajor: 0,
  },
  expected: {
    noiMajor: "270000",
    annualCashFlowMajor: "270000",
    monthlyCashFlowMajor: "22500",
    equityMajor: "6000000",
    dscrApplicable: false,
  },
} as const;

/** High leverage stress — LTV ≈ 95 %. */
export const GOLDEN_CASE_HIGH_LTV = {
  id: "G2_high_leverage",
  currency: "CZK" as const,
  inputs: {
    purchasePriceMajor: 5_000_000,
    monthlyRentMajor: 22_000,
    vacancyPercentPoints: 5,
    annualOpexMajor: 60_000,
    loanAmountMajor: 4_750_000,
    interestRatePercentPoints: 5.5,
    termYears: 30,
  },
  expected: {
    ltvRatio: 0.95,
  },
} as const;

/**
 * Known IRR series (Excel IRR / XIRR equivalent for annual periods):
 *   t0 = −100_000 · t1 = 40_000 · t2 = 40_000 · t3 = 50_000
 * Hand-checked ≈ 13.7 % (Newton).
 */
export const GOLDEN_IRR_POSITIVE = {
  id: "IRR_known_positive",
  equityMajor: 100_000,
  annualFlowsMajor: [40_000, 40_000, 50_000],
  expectedIrrRatioApprox: 0.137,
  tolerance: 0.005,
} as const;

/**
 * Negative IRR: equity outlay never recovered.
 *   t0 = −100_000 · t1..t3 = 10_000 each
 */
export const GOLDEN_IRR_NEGATIVE = {
  id: "IRR_known_negative",
  equityMajor: 100_000,
  annualFlowsMajor: [10_000, 10_000, 10_000],
  expectNegative: true,
} as const;

/** Equity multiple: total inflows / equity. */
export const GOLDEN_EQUITY_MULTIPLE = {
  id: "EM_simple",
  equityMajor: 100_000,
  annualFlowsMajor: [40_000, 40_000, 40_000],
  expectedMultiple: 1.2,
} as const;

/**
 * Mortgage payment golden values (Excel PMT compatible with nominal monthly).
 * Engine uses ROUND_HALF_UP to 2 dp (haléře).
 */
export const GOLDEN_MORTGAGE = {
  zeroRate: {
    principalMajor: 3_600_000,
    ratePp: 0,
    termYears: 30,
    expectedMonthlyMajor: "10000",
    expectedEndingBalanceMax: 0.01,
  },
  fivePercent30y: {
    principalMajor: 3_600_000,
    ratePp: 5,
    termYears: 30,
    expectedMonthlyApprox: 19_325.58,
    monthlyTolerance: 0.05,
    expectedEndingBalanceMax: 1,
  },
  fivePercent5y: {
    principalMajor: 1_000_000,
    ratePp: 5,
    termYears: 5,
    expectedMonthlyApprox: 18_871.23,
    monthlyTolerance: 0.05,
    expectedEndingBalanceMax: 1,
  },
} as const;

/**
 * Break-even occupancy (hand):
 *   PGI = 360_000 · opex = 72_000 · ADS = 0 (cash)
 *   BE occ = opex / PGI = 0.2
 */
export const GOLDEN_BREAK_EVEN_OCC = {
  pgiMajor: 360_000,
  opexMajor: 72_000,
  expectedOccupancyRatio: 0.2,
} as const;
