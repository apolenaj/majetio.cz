"use client";

import { useMemo, useState } from "react";

import {
  DEMO_INVESTMENT,
  type PropertyInvestmentInput,
} from "@/lib/calculators";

const BLANK: PropertyInvestmentInput = {
  ...DEMO_INVESTMENT,
  purchasePrice: 0,
  ownCapital: 0,
  loanAmount: 0,
  monthlyRent: 0,
  otherMonthlyIncome: 0,
  vacancyRate: 0,
  monthlyOperatingLump: 0,
  useItemizedOpex: false,
  monthlyHOA: 0,
  maintenanceMonthly: 0,
  insuranceMonthly: 0,
  managementMonthly: 0,
  otherOperatingMonthly: 0,
  annualPropertyTax: 0,
  annualOtherCosts: 0,
  renovationCost: 0,
  acquisitionCosts: 0,
  initialReserve: 0,
  appreciationRate: 0,
  rentGrowthRate: 0,
  expenseGrowthRate: 0,
  saleCostRate: 0,
};

export function useInvestmentForm(seed?: Partial<PropertyInvestmentInput>) {
  const [input, setInput] = useState<PropertyInvestmentInput>({
    ...DEMO_INVESTMENT,
    ...Object.fromEntries(
      Object.entries(seed ?? {}).filter(([, value]) => value !== undefined),
    ) as Partial<PropertyInvestmentInput>,
  });
  const [advanced, setAdvanced] = useState(false);

  const model = useMemo(
    () => ({ ...input, useItemizedOpex: advanced }),
    [input, advanced],
  );

  return {
    input: model,
    advanced,
    setAdvanced,
    patch: (partial: Partial<PropertyInvestmentInput>) =>
      setInput((current) => ({ ...current, ...partial })),
    loadDemo: () => {
      setInput(DEMO_INVESTMENT);
      setAdvanced(false);
    },
    reset: () => {
      setInput(BLANK);
      setAdvanced(false);
    },
  };
}
