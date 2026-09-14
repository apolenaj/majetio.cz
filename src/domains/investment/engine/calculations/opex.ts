/**
 * Structured operating expenses (pure).
 * SVJ advances are tracked but excluded from NOI opex by default.
 */

import { Money } from "@/domains/finance";

import { bindFormula, type FormulaBound } from "./helpers";

export type OperatingExpenseLines = {
  /** Property management / správa. */
  propertyManagement?: Money | null;
  maintenance?: Money | null;
  insurance?: Money | null;
  propertyTax?: Money | null;
  /** SVJ / HOA cost borne by owner (counts toward NOI opex). */
  svjOwnerCost?: Money | null;
  /**
   * SVJ advances / prepaid utilities often recharged to tenants.
   * Tracked for transparency — **not** included in NOI opex.
   */
  svjAdvances?: Money | null;
  /** Short-term rental platform fees (Airbnb etc.). */
  platformFees?: Money | null;
};

export type OperatingExpensesResult = {
  /** Annual opex included in NOI. */
  annualOpex: FormulaBound<Money>;
  /** SVJ advances (excluded from NOI). */
  svjAdvancesExcluded: Money | null;
  /** Lines that contributed to annualOpex. */
  includedKeys: Array<keyof OperatingExpenseLines>;
};

const NOI_OPEX_KEYS = [
  "propertyManagement",
  "maintenance",
  "insurance",
  "propertyTax",
  "svjOwnerCost",
  "platformFees",
] as const satisfies ReadonlyArray<keyof OperatingExpenseLines>;

/**
 * Sum owner-borne opex lines. Null lines omitted (≠ zero).
 * Period: amounts are treated as **annual**.
 */
export function calculateAnnualOperatingExpenses(
  lines: OperatingExpenseLines,
  currencyFallback?: Money,
): OperatingExpensesResult {
  let total: Money | null = null;
  const includedKeys: Array<keyof OperatingExpenseLines> = [];

  for (const key of NOI_OPEX_KEYS) {
    const line = lines[key];
    if (line == null) continue;
    if (total == null) {
      total = line;
    } else {
      total = total.add(line);
    }
    includedKeys.push(key);
  }

  if (total == null) {
    if (currencyFallback) {
      total = Money.zero(currencyFallback.currency);
    } else {
      throw new Error(
        "operating expenses require at least one opex line or a currency fallback",
      );
    }
  }

  return {
    annualOpex: bindFormula("operating_expenses", total.roundForDisplay()),
    svjAdvancesExcluded: lines.svjAdvances ?? null,
    includedKeys,
  };
}
