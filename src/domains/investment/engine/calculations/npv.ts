/**
 * DCF / NPV foundations — advanced / hidden from default UI.
 * Prefer nominal cash flows; discount rate is an explicit advanced input.
 */

import { Decimal } from "decimal.js";

import { Money, type Percentage, toDecimal } from "@/domains/finance";

export type NpvInput = {
  /** Period 0..N nominal cash flows (period 0 typically −equity). */
  cashFlows: Money[];
  /** Annual discount rate as ratio Percentage (e.g. 0.08). */
  discountRate: Percentage;
};

export type NpvResult = {
  npv: Money;
  discountRate: Percentage;
  periods: number;
  note: string;
};

/**
 * NPV = Σ CF_t / (1+r)^t  (nominal CF, constant discount rate).
 */
export function calculateNpv(input: NpvInput): NpvResult {
  if (input.cashFlows.length === 0) {
    throw new Error("NPV requires at least one cash flow");
  }
  const currency = input.cashFlows[0]!.currency;
  const r = input.discountRate.toRatio();
  let total = new Decimal(0);
  for (let t = 0; t < input.cashFlows.length; t++) {
    const cf = input.cashFlows[t]!;
    if (cf.currency !== currency) {
      throw new Error("NPV cash flow currency mismatch");
    }
    const denom = toDecimal(1).plus(r).pow(t);
    total = total.plus(cf.major.div(denom));
  }
  return {
    npv: Money.fromMajor(total, currency).roundForDisplay(),
    discountRate: input.discountRate,
    periods: input.cashFlows.length,
    note: "NPV z nominálních CF — pokročilá funkce, není součástí základního UI.",
  };
}
