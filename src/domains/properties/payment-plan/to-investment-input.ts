/**
 * Bridge PropertyPaymentPlan + transaction costs + optional FX into
 * Financial Engine acquisition inputs (Prompt 17.4).
 */

import {
  Money,
  convertMoneyWithSnapshot,
  type CurrencyCode,
  type ExchangeRateSnapshot,
} from "@/domains/finance";
import type { TotalAcquisitionCostInput } from "@/domains/investment/engine/acquisition-cost";
import {
  expandPaymentPlanSchedule,
  type PropertyPaymentPlan,
  type PaymentScheduleCashEvent,
} from "@/domains/properties/payment-plan/types";
import type { TransactionCostEstimateResult } from "@/domains/regulatory/transaction-costs/types";

export type FinancialEnginePaymentContext = {
  /** Scenario base currency — all money normalized here. */
  baseCurrency: CurrencyCode;
  purchasePriceMinor: number;
  purchaseCurrency: CurrencyCode;
  /** Optional off-plan schedule (same or convertible currency). */
  paymentPlan?: PropertyPaymentPlan | null;
  /** Buyer-side closing costs already estimated. */
  transactionCosts?: TransactionCostEstimateResult | null;
  /**
   * Required when plan/purchase currency ≠ baseCurrency.
   * Snapshot must convert purchaseCurrency → baseCurrency
   * (baseCurrency field on snapshot = from, quoteCurrency = to).
   */
  fxSnapshot?: ExchangeRateSnapshot | null;
  renovationMinor?: number | null;
  furnishingMinor?: number | null;
};

export type FinancialEnginePaymentBundle = {
  acquisition: TotalAcquisitionCostInput;
  /** Timed cash events in base currency (for projection / liquidity). */
  paymentSchedule: PaymentScheduleCashEvent[];
  warnings: string[];
};

function minorDto(amountMinor: number, currency: CurrencyCode) {
  return {
    amountMinor: String(Math.round(amountMinor)),
    currency,
  };
}

function toBaseMinor(
  amountMinor: number,
  from: CurrencyCode,
  base: CurrencyCode,
  fx: ExchangeRateSnapshot | null | undefined,
  warnings: string[],
): number {
  if (from === base) return Math.round(amountMinor);
  if (!fx) {
    warnings.push(
      `FX snapshot missing for ${from}→${base}; amounts left unconverted (unsafe).`,
    );
    return Math.round(amountMinor);
  }
  try {
    const converted = convertMoneyWithSnapshot({
      amount: Money.fromMinor(amountMinor, from),
      snapshot: fx,
    });
    if (converted.currency !== base) {
      warnings.push(
        `FX snapshot quote ${converted.currency} ≠ base ${base}; check snapshot orientation.`,
      );
    }
    return Number(converted.toMinorInteger());
  } catch (err) {
    warnings.push(
      `FX conversion failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return Math.round(amountMinor);
  }
}

/**
 * Build acquisition cost DTO + schedule for the investment engine.
 * Transaction costs map into `fees`; payment plan does not change total price
 * but provides timing for cash-flow projections.
 */
export function buildFinancialEnginePaymentBundle(
  ctx: FinancialEnginePaymentContext,
): FinancialEnginePaymentBundle {
  const warnings: string[] = [];
  const priceBase = toBaseMinor(
    ctx.purchasePriceMinor,
    ctx.purchaseCurrency,
    ctx.baseCurrency,
    ctx.fxSnapshot,
    warnings,
  );

  let feesMinor: number | null = null;
  if (ctx.transactionCosts) {
    feesMinor = toBaseMinor(
      ctx.transactionCosts.buyerTotalMinor,
      ctx.transactionCosts.currency as CurrencyCode,
      ctx.baseCurrency,
      ctx.fxSnapshot,
      warnings,
    );
  }

  const acquisition: TotalAcquisitionCostInput = {
    purchasePrice: minorDto(priceBase, ctx.baseCurrency),
    acquisitionCosts: null,
    renovation:
      ctx.renovationMinor != null
        ? minorDto(ctx.renovationMinor, ctx.baseCurrency)
        : null,
    initialFurnishing:
      ctx.furnishingMinor != null
        ? minorDto(ctx.furnishingMinor, ctx.baseCurrency)
        : null,
    fees:
      feesMinor != null ? minorDto(feesMinor, ctx.baseCurrency) : null,
  };

  let paymentSchedule: PaymentScheduleCashEvent[] = [];
  if (ctx.paymentPlan) {
    const expanded = expandPaymentPlanSchedule(ctx.paymentPlan);
    paymentSchedule = expanded.map((e) => ({
      ...e,
      amountMinor: toBaseMinor(
        e.amountMinor,
        e.currency as CurrencyCode,
        ctx.baseCurrency,
        ctx.fxSnapshot,
        warnings,
      ),
      currency: ctx.baseCurrency,
    }));
  }

  return { acquisition, paymentSchedule, warnings };
}
