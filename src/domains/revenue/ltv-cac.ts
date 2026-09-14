/**
 * LTV / CAC foundations (checklist 153, 154).
 * Simple unit-economics helpers — not full cohort BI.
 */

export type LtvInputs = {
  /** Average recognized revenue per customer per month (minor). */
  avgMonthlyRevenueMinor: number;
  /** Gross margin 0–1 (e.g. 0.7). */
  grossMargin: number;
  /** Monthly churn rate 0–1 (e.g. 0.05 = 5%). */
  monthlyChurnRate: number;
};

export type CacInputs = {
  marketingSpendMinor: number;
  newPayingCustomers: number;
};

export const LTV_CAC_GUARDRAILS = {
  /** Target LTV:CAC often cited as ≥ 3. */
  healthyLtvCacMin: 3,
  /** Never treat GMV as LTV input. */
  forbidGmvAsLtvInput: true,
  /** Default margin / churn for admin dashboard hints. */
  defaultGrossMargin: 0.7,
  defaultMonthlyChurnRate: 0.05,
} as const;

/**
 * Classic LTV ≈ ARPU × margin / churn (monthly).
 */
export function estimateCustomerLtvMinor(input: LtvInputs): {
  ltvMinor: number;
  formula: string;
} {
  const churn = Math.max(0.001, Math.min(1, input.monthlyChurnRate));
  const margin = Math.max(0, Math.min(1, input.grossMargin));
  const arpu = Math.max(0, input.avgMonthlyRevenueMinor);
  const ltvMinor = Math.round((arpu * margin) / churn);
  return {
    ltvMinor,
    formula: "(avgMonthlyRevenue × grossMargin) / monthlyChurn",
  };
}

export function estimateCacMinor(input: CacInputs): {
  cacMinor: number;
  formula: string;
} {
  const customers = Math.max(0, Math.floor(input.newPayingCustomers));
  if (customers === 0) {
    return { cacMinor: 0, formula: "marketingSpend / newPayingCustomers" };
  }
  return {
    cacMinor: Math.round(
      Math.max(0, input.marketingSpendMinor) / customers,
    ),
    formula: "marketingSpend / newPayingCustomers",
  };
}

export function ltvToCacRatio(ltvMinor: number, cacMinor: number): number | null {
  if (cacMinor <= 0) return null;
  return Math.round((ltvMinor / cacMinor) * 100) / 100;
}

/**
 * CAC inputs from env (ops) + optional DB new-paying count.
 * Env: MARKETING_SPEND_MINOR_30D, NEW_PAYING_CUSTOMERS_30D (override).
 */
export function resolveCacInputs(input?: {
  marketingSpendMinor?: number;
  newPayingCustomers?: number;
  env?: NodeJS.ProcessEnv;
}): CacInputs {
  const env = input?.env ?? process.env;
  const spendEnv = Number(env.MARKETING_SPEND_MINOR_30D ?? "");
  const customersEnv = Number(env.NEW_PAYING_CUSTOMERS_30D ?? "");

  return {
    marketingSpendMinor:
      input?.marketingSpendMinor ??
      (Number.isFinite(spendEnv) && spendEnv >= 0 ? spendEnv : 0),
    newPayingCustomers:
      input?.newPayingCustomers ??
      (Number.isFinite(customersEnv) && customersEnv >= 0
        ? Math.floor(customersEnv)
        : 0),
  };
}

/**
 * Guard: refuse to compute LTV when caller passes GMV as ARPU by mistake.
 */
export function assertLtvDoesNotUseGmv(input: {
  avgMonthlyRevenueMinor: number;
  gmvMinor: number;
  label?: string;
}): { ok: true } | { ok: false; error: string } {
  if (!LTV_CAC_GUARDRAILS.forbidGmvAsLtvInput) return { ok: true };
  if (
    input.gmvMinor > 0 &&
    input.avgMonthlyRevenueMinor === input.gmvMinor
  ) {
    return {
      ok: false,
      error: `LTV nesmí používat GMV jako ARPU (${input.label ?? "153"}).`,
    };
  }
  return { ok: true };
}
