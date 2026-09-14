import { describe, expect, it } from "vitest";

import {
  FORMULA_REGISTRY,
  FORMULA_REGISTRY_VERSION,
  INVESTMENT_ENGINE_VERSION,
  computeTotalAcquisitionCost,
  describeRoundingPolicy,
  getFormula,
  moneyFromDto,
  moneyToDto,
  parseInvestmentCalculationInput,
  parseInvestmentCalculationResult,
  percentageFromDto,
  percentageToDto,
  requireFormula,
  safeParseInvestmentCalculationInput,
} from "./index";
import { Money, Percentage } from "@/domains/finance";

describe("investment engine money / percentage DTOs", () => {
  it("round-trips money via integer minor units", () => {
    const m = Money.fromMajor("6490000.50", "CZK");
    const dto = moneyToDto(m);
    expect(dto.amountMinor).toBe("649000050");
    expect(moneyFromDto(dto).equals(m.roundForDisplay())).toBe(true);
  });

  it("stores 5.4% as ratio 0.054 in DTO", () => {
    const dto = percentageToDto(Percentage.fromPercentPoints(5.4));
    expect(dto.ratio).toBe("0.054");
    expect(percentageFromDto(dto).toPercentPoints().toString()).toBe("5.4");
  });
});

describe("total acquisition cost", () => {
  it("sums purchase + optional lines and skips nulls (not as zero)", () => {
    const cost = computeTotalAcquisitionCost({
      purchasePrice: moneyToDto(Money.fromMajor(6_000_000, "CZK")),
      acquisitionCosts: moneyToDto(Money.fromMajor(200_000, "CZK")),
      renovation: null,
      initialFurnishing: moneyToDto(Money.fromMajor(0, "CZK")),
      fees: moneyToDto(Money.fromMajor(50_000, "CZK")),
    });

    expect(cost.includedLines).toEqual([
      "purchasePrice",
      "acquisitionCosts",
      "initialFurnishing",
      "fees",
    ]);
    expect(cost.renovation).toBeNull();
    expect(cost.total.toMajorString()).toBe("6250000");
  });

  it("rejects mixed currencies in schema via input parse", () => {
    const parsed = safeParseInvestmentCalculationInput({
      schemaVersion: "1.0.0",
      property: { currency: "CZK" },
      acquisition: {
        purchasePrice: { amountMinor: "10000", currency: "CZK" },
        acquisitionCosts: { amountMinor: "100", currency: "EUR" },
      },
    });
    expect(parsed.success).toBe(false);
  });
});

describe("formula registry", () => {
  it("exposes total_acquisition_cost with explainable formula text", () => {
    const f = requireFormula("total_acquisition_cost");
    expect(f.name).toMatch(/pořizovací/i);
    expect(f.formulaText).toMatch(/Kupní cena/);
    expect(f.formulaVersion).toBe("1.0.0");
    expect(getFormula("nope")).toBeUndefined();
    expect(FORMULA_REGISTRY.length).toBeGreaterThanOrEqual(5);
    expect(FORMULA_REGISTRY_VERSION).toBe("1.3.0");
  });
});

describe("InvestmentCalculationInput / Result schemas", () => {
  it("parses a minimal valid input", () => {
    const input = parseInvestmentCalculationInput({
      schemaVersion: "1.0.0",
      property: {
        propertyId: "demo-apt",
        usableAreaSqm: 74,
        currency: "CZK",
      },
      acquisition: {
        purchasePrice: { amountMinor: "649000000", currency: "CZK" },
        acquisitionCosts: null,
        renovation: null,
        initialFurnishing: null,
        fees: null,
      },
      incomeExpense: {
        monthlyRent: { amountMinor: "2950000", currency: "CZK" },
        annualRent: null,
        monthlyOperatingCosts: null,
        annualOperatingCosts: null,
        vacancyRate: { ratio: "0.05" },
      },
      financing: {
        loanAmount: null,
        nominalInterestRate: { ratio: "0.0525" },
        apr: { ratio: "0.0549" },
        termYears: 30,
        monthlyDebtService: null,
      },
      market: {
        appreciationRate: { ratio: "0.03" },
        rentGrowthRate: null,
      },
      horizon: { holdYears: 10 },
      askingPrice: null,
      yieldBase: "purchase_price",
    });

    expect(input.acquisition.purchasePrice.amountMinor).toBe("649000000");
    expect(input.financing.nominalInterestRate?.ratio).toBe("0.0525");
    expect(input.financing.apr?.ratio).toBe("0.0549");
  });

  it("parses a result envelope with insufficient metrics", () => {
    const result = parseInvestmentCalculationResult({
      schemaVersion: "1.0.0",
      engineVersion: INVESTMENT_ENGINE_VERSION,
      formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
      calculatedAt: "2026-07-19T20:00:00.000Z",
      currency: "CZK",
      inputSchemaVersion: "1.0.0",
      warnings: [],
      acquisition: {
        formulaKey: "total_acquisition_cost",
        status: "calculated",
        purchasePrice: { amountMinor: "600000000", currency: "CZK" },
        acquisitionCosts: null,
        renovation: null,
        initialFurnishing: null,
        fees: null,
        total: { amountMinor: "600000000", currency: "CZK" },
        includedLines: ["purchasePrice"],
        statusReason: null,
      },
      metrics: [
        {
          kind: "ratio",
          formulaKey: "gross_yield",
          status: "insufficient_input",
          value: null,
          statusReason: "Chybí roční nájem",
        },
      ],
    });

    expect(result.metrics[0]?.status).toBe("insufficient_input");
    expect(result.engineVersion).toBe(INVESTMENT_ENGINE_VERSION);
  });
});

describe("rounding policy façade", () => {
  it("describes internal vs display rules", () => {
    const d = describeRoundingPolicy();
    expect(d.internalDecimalPlaces).toBe(10);
    expect(d.percentDisplayDecimalPlaces).toBe(1);
  });
});
