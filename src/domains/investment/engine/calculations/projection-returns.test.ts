import { describe, expect, it } from "vitest";

import {
  Money,
  Percentage,
  nominalInterestRateFromPercentPoints,
} from "@/domains/finance";

import {
  buildAmortizationSchedule,
  outstandingLoanBalance,
} from "./amortization";
import { calculateNetSaleProceeds } from "./exit";
import { projectHoldingPeriod } from "./projection";
import {
  buildEquityCashFlowSeries,
  calculateEquityMultiple,
  calculateIrr,
  calculatePaybackPeriod,
} from "./returns";
import { calculateCashPurchaseScenario } from "../scenarios/cash-purchase";
import { calculateFlipScenario } from "../scenarios/flip";
import { calculateSeasonalGrossIncome } from "../scenarios/short-term-rental";

describe("amortization schedule", () => {
  it("reduces balance to ~0 over full term and exposes formula key", () => {
    const principal = Money.fromMajor(2_000_000, "CZK");
    const schedule = buildAmortizationSchedule({
      principal,
      nominalInterestRate: nominalInterestRateFromPercentPoints(5),
      termYears: 20,
    });
    expect(schedule.schedule.formulaKey).toBe("amortization_schedule");
    expect(schedule.schedule.value.length).toBe(240);
    expect(schedule.endingBalance.toMajorNumber()).toBeLessThan(100);
  });

  it("reads outstanding balance mid-term", () => {
    const bal = outstandingLoanBalance({
      principal: Money.fromMajor(2_000_000, "CZK"),
      nominalInterestRate: nominalInterestRateFromPercentPoints(5),
      termYears: 20,
      afterMonths: 12,
    });
    expect(bal.toMajorNumber()).toBeGreaterThan(1_800_000);
    expect(bal.toMajorNumber()).toBeLessThan(2_000_000);
  });
});

describe("exit + projection", () => {
  it("computes net sale proceeds", () => {
    const exit = calculateNetSaleProceeds({
      salePrice: Money.fromMajor(7_000_000, "CZK"),
      sellingCostRate: Percentage.fromPercentPoints(3),
      outstandingLoanBalance: Money.fromMajor(3_000_000, "CZK"),
    });
    expect(exit.sellingCosts.toMajorString()).toBe("210000");
    expect(exit.netSaleProceeds.value.toMajorString()).toBe("3790000");
    expect(exit.netSaleProceeds.formulaKey).toBe("net_sale_proceeds");
  });

  it("projects growing rent/opex and exit over 5 years (cash)", () => {
    const projection = projectHoldingPeriod({
      holdYears: 5,
      baseEgi: Money.fromMajor(300_000, "CZK"),
      baseOpex: Money.fromMajor(80_000, "CZK"),
      initialPropertyValue: Money.fromMajor(5_000_000, "CZK"),
      appreciationRate: Percentage.fromPercentPoints(3),
      rentGrowthRate: Percentage.fromPercentPoints(2),
      expenseInflationRate: Percentage.fromPercentPoints(2),
      loan: null,
      sellingCostRate: Percentage.fromPercentPoints(3),
    });

    expect(projection.projection.value).toHaveLength(5);
    expect(projection.projection.formulaKey).toBe("holding_projection");
    // Year 1 EGI = base; year 2 grown once
    expect(projection.projection.value[0]!.egi.toMajorString()).toBe("300000");
    expect(projection.projection.value[1]!.egi.toMajorNumber()).toBeGreaterThan(
      300_000,
    );
    expect(projection.exit.netSaleProceeds.isPositive()).toBe(true);
  });
});

describe("IRR / equity multiple / payback", () => {
  it("solves a simple two-period IRR", () => {
    // -100 + 110 → 10%
    const series = buildEquityCashFlowSeries(
      Money.fromMajor(100, "CZK"),
      [Money.fromMajor(110, "CZK")],
    );
    const irr = calculateIrr(series);
    expect(irr.converged).toBe(true);
    expect(irr.value!.toRatio().toNumber()).toBeCloseTo(0.1, 5);
    expect(irr.formulaKey).toBe("irr");
  });

  it("returns null IRR without sign change", () => {
    const irr = calculateIrr({
      flows: [Money.fromMajor(10, "CZK"), Money.fromMajor(20, "CZK")],
    });
    expect(irr.converged).toBe(false);
    expect(irr.value).toBeNull();
    expect(irr.signChangeCount).toBe(0);
    expect(irr.multipleRootsPossible).toBe(false);
  });

  it("computes equity multiple and payback", () => {
    const series = buildEquityCashFlowSeries(
      Money.fromMajor(100_000, "CZK"),
      [
        Money.fromMajor(40_000, "CZK"),
        Money.fromMajor(40_000, "CZK"),
        Money.fromMajor(40_000, "CZK"),
      ],
    );
    const em = calculateEquityMultiple(series);
    expect(em.value).toBeCloseTo(1.2, 5);
    const pb = calculatePaybackPeriod(series);
    expect(pb.value).not.toBeNull();
    expect(pb.value!).toBeGreaterThan(2);
    expect(pb.value!).toBeLessThanOrEqual(3);
  });
});

describe("scenarios", () => {
  it("runs cash purchase scenario with returns bundle", () => {
    const result = calculateCashPurchaseScenario({
      holdYears: 10,
      totalAcquisitionCost: Money.fromMajor(5_000_000, "CZK"),
      baseEgi: Money.fromMajor(300_000, "CZK"),
      baseOpex: Money.fromMajor(70_000, "CZK"),
      growth: {
        appreciationRate: Percentage.fromPercentPoints(2),
        rentGrowthRate: Percentage.fromPercentPoints(2),
        expenseInflationRate: Percentage.fromPercentPoints(2),
        sellingCostRate: Percentage.fromPercentPoints(3),
      },
    });
    expect(result.kind).toBe("cash_purchase");
    expect(result.equityRequired.toMajorString()).toBe("5000000");
    expect(result.projection.projection.value).toHaveLength(10);
    expect(result.returns.irr.formulaKey).toBe("irr");
  });

  it("aggregates STR seasonal ADR × occupancy", () => {
    const { annualGross, occupiedNights } = calculateSeasonalGrossIncome([
      {
        month: 1,
        adr: Money.fromMajor(2_000, "CZK"),
        occupancy: Percentage.fromPercentPoints(50),
        daysInMonth: 30,
      },
      {
        month: 7,
        adr: Money.fromMajor(3_000, "CZK"),
        occupancy: Percentage.fromPercentPoints(80),
        daysInMonth: 31,
      },
    ]);
    // 2000*15 + 3000*24.8 = 30000 + 74400 = 104400
    expect(annualGross.toMajorNumber()).toBeCloseTo(104_400, -2);
    expect(occupiedNights).toBeCloseTo(15 + 24.8, 1);
  });

  it("computes flip gross profit and cost margin", () => {
    const flip = calculateFlipScenario({
      holdMonths: 9,
      purchasePrice: Money.fromMajor(4_000_000, "CZK"),
      renovationCapex: Money.fromMajor(800_000, "CZK"),
      holdingCosts: Money.fromMajor(100_000, "CZK"),
      salePrice: Money.fromMajor(6_000_000, "CZK"),
      sellingCostRate: Percentage.fromPercentPoints(3),
    });
    expect(flip.kind).toBe("flip");
    expect(flip.totalFlipCost.toMajorString()).toBe("4900000");
    // sale 6M - 3% = 5.82M; profit = 5.82M - 4.9M = 0.92M
    expect(flip.grossProfit.toMajorString()).toBe("920000");
    expect(flip.costMargin.toRatio().toNumber()).toBeCloseTo(920_000 / 4_900_000, 5);
  });
});
