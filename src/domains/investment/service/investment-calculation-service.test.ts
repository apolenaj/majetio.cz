import { describe, expect, it, vi } from "vitest";

import { Money } from "@/domains/finance";

import {
  FORMULA_REGISTRY_VERSION,
  INVESTMENT_ENGINE_VERSION,
  moneyToDto,
} from "../engine";
import {
  buildPropertyInvestmentSnapshot,
  createInvestmentCalculationService,
  hashCalculationInput,
  runInvestmentCalculationPure,
  type InvestmentCalculationRepository,
} from "./index";

describe("calculation input hash", () => {
  it("is deterministic and changes when assumptions or engine version change", () => {
    const snapshot = buildPropertyInvestmentSnapshot({
      id: "prop-1",
      askingPrice: 6_250_000,
      currency: "CZK",
      usableArea: 74,
    });
    const assumptions = {
      monthlyRent: moneyToDto(Money.fromMajor(29_500, "CZK")),
    };

    const a = hashCalculationInput({
      propertySnapshot: snapshot,
      assumptionSet: assumptions,
      scenarioType: "BASE_METRICS",
    });
    const b = hashCalculationInput({
      propertySnapshot: snapshot,
      assumptionSet: assumptions,
      scenarioType: "BASE_METRICS",
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);

    const c = hashCalculationInput({
      propertySnapshot: snapshot,
      assumptionSet: {
        ...assumptions,
        vacancyRate: { ratio: "0.05" },
      },
      scenarioType: "BASE_METRICS",
    });
    expect(c).not.toBe(a);

    const d = hashCalculationInput({
      propertySnapshot: snapshot,
      assumptionSet: assumptions,
      scenarioType: "BASE_METRICS",
      engineVersion: "9.9.9-other",
    });
    expect(d).not.toBe(a);
  });
});

describe("runInvestmentCalculationPure — partial results", () => {
  it("returns unavailable metrics and warnings when rent / opex / repair fund missing", () => {
    const snapshot = buildPropertyInvestmentSnapshot({
      id: "prop-2",
      askingPrice: 5_000_000,
      currency: "CZK",
    });
    const hash = hashCalculationInput({
      propertySnapshot: snapshot,
      assumptionSet: {},
      scenarioType: "BASE_METRICS",
    });

    const result = runInvestmentCalculationPure({
      propertySnapshot: snapshot,
      assumptionSet: {},
      scenarioType: "BASE_METRICS",
      inputHash: hash,
    });

    expect(result.status).toBe("PARTIAL");
    expect(result.engineVersion).toBe(INVESTMENT_ENGINE_VERSION);
    expect(result.formulaRegistryVersion).toBe(FORMULA_REGISTRY_VERSION);
    expect(result.availableMetrics.some((m) => m.formulaKey === "total_acquisition_cost")).toBe(
      true,
    );
    expect(
      result.unavailableMetrics.some(
        (m) => m.formulaKey === "noi" && m.value === null,
      ),
    ).toBe(true);
    expect(result.warnings.some((w) => /nájmu/i.test(w))).toBe(true);
    expect(result.warnings.some((w) => /fondu oprav/i.test(w))).toBe(true);
    // Never invent zero rent as a calculated NOI
    expect(
      result.availableMetrics.find((m) => m.formulaKey === "noi"),
    ).toBeUndefined();
  });

  it("calculates NOI / yields when rent and opex are provided", () => {
    const snapshot = buildPropertyInvestmentSnapshot({
      id: "prop-3",
      askingPrice: 6_250_000,
      currency: "CZK",
    });
    const assumptions = {
      monthlyRent: moneyToDto(Money.fromMajor(30_000, "CZK")),
      annualOperatingCosts: moneyToDto(Money.fromMajor(72_000, "CZK")),
      repairFundAnnual: moneyToDto(Money.fromMajor(12_000, "CZK")),
      vacancyRate: { ratio: "0.05" },
      loanAmount: moneyToDto(Money.fromMajor(3_500_000, "CZK")),
      nominalInterestRate: { ratio: "0.0525" },
      termYears: 30,
    };
    const hash = hashCalculationInput({
      propertySnapshot: snapshot,
      assumptionSet: assumptions,
      scenarioType: "BASE_METRICS",
    });

    const result = runInvestmentCalculationPure({
      propertySnapshot: snapshot,
      assumptionSet: assumptions,
      inputHash: hash,
    });

    expect(result.status === "CALCULATED" || result.status === "PARTIAL").toBe(
      true,
    );
    const noi = result.availableMetrics.find((m) => m.formulaKey === "noi");
    expect(noi?.status).toBe("calculated");
    expect(noi?.value).not.toBeNull();
    expect(result.warnings.some((w) => /fondu oprav/i.test(w))).toBe(false);
  });

  it("fails without inventing zero purchase price when price is missing", () => {
    const snapshot = buildPropertyInvestmentSnapshot({
      id: "prop-4",
      askingPrice: null,
      currency: "CZK",
    });
    const hash = hashCalculationInput({
      propertySnapshot: snapshot,
      assumptionSet: {},
      scenarioType: "BASE_METRICS",
    });
    const result = runInvestmentCalculationPure({
      propertySnapshot: snapshot,
      inputHash: hash,
    });
    expect(result.status).toBe("FAILED");
    expect(result.acquisition).toBeNull();
    expect(result.availableMetrics).toHaveLength(0);
    expect(result.warnings.some((w) => /cena/i.test(w))).toBe(true);
  });
});

describe("InvestmentCalculationService", () => {
  it("loads property, persists scenario with frozen versions, and serves cache hits", async () => {
    const calcs: unknown[] = [];
    const scenarios: unknown[] = [];

    const repository: InvestmentCalculationRepository = {
      async findPropertyById(id) {
        return {
          id,
          slug: "demo",
          askingPrice: 6_250_000,
          currency: "CZK",
          usableArea: 74,
          title: "Demo",
          propertyType: "APARTMENT",
          publicCity: "Praha",
        };
      },
      async findCachedByInputHash(inputHash, engineVersion) {
        const hit = calcs.find(
          (c) =>
            (c as { inputHash: string; engineVersion: string }).inputHash ===
              inputHash &&
            (c as { engineVersion: string }).engineVersion === engineVersion,
        ) as
          | {
              id: string;
              inputHash: string;
              engineVersion: string;
              formulaRegistryVersion: string;
              outputs: unknown;
              scenarioId: string;
            }
          | undefined;
        return hit
          ? {
              id: hit.id,
              inputHash: hit.inputHash,
              engineVersion: hit.engineVersion,
              formulaRegistryVersion: hit.formulaRegistryVersion,
              outputs: hit.outputs,
              scenarioId: hit.scenarioId,
            }
          : null;
      },
      async createScenario(data) {
        const id = `scen-${scenarios.length + 1}`;
        scenarios.push({ id, ...data });
        return { id };
      },
      async createCalculation(data) {
        const id = `calc-${calcs.length + 1}`;
        calcs.push({ id, ...data, scenarioId: data.scenarioId });
        return { id };
      },
    };

    const service = createInvestmentCalculationService({ repository });
    const assumptions = {
      monthlyRent: moneyToDto(Money.fromMajor(30_000, "CZK")),
      annualOperatingCosts: moneyToDto(Money.fromMajor(72_000, "CZK")),
      repairFundAnnual: moneyToDto(Money.fromMajor(12_000, "CZK")),
    };

    const first = await service.calculateForProperty({
      propertyId: "p1",
      assumptionSet: assumptions,
      scenarioType: "LONG_TERM_RENTAL",
    });

    expect(first.cacheHit).toBe(false);
    expect(first.calculationEngineVersion).toBe(INVESTMENT_ENGINE_VERSION);
    expect(first.formulaRegistryVersion).toBe(FORMULA_REGISTRY_VERSION);
    expect(first.methodologyPackageVersion).toMatch(/^methodology\./);
    expect(first.results.inputHash).toBe(first.inputHash);
    expect(scenarios).toHaveLength(1);
    expect(calcs).toHaveLength(1);

    const second = await service.calculateForProperty({
      propertyId: "p1",
      assumptionSet: assumptions,
      scenarioType: "LONG_TERM_RENTAL",
    });

    expect(second.cacheHit).toBe(true);
    expect(second.results.cacheHit).toBe(true);
    expect(scenarios).toHaveLength(1);
    expect(calcs).toHaveLength(1);
  });

  it("does not rewrite cache when engine version differs", async () => {
    const findCached = vi.fn().mockResolvedValue(null);
    const repository: InvestmentCalculationRepository = {
      async findPropertyById(id) {
        return { id, askingPrice: 1_000_000, currency: "CZK" };
      },
      findCachedByInputHash: findCached,
      async createScenario() {
        return { id: "s1" };
      },
      async createCalculation() {
        return { id: "c1" };
      },
    };

    const service = createInvestmentCalculationService({ repository });
    await service.calculateForProperty({
      propertyId: "p2",
      assumptionSet: {
        monthlyRent: moneyToDto(Money.fromMajor(10_000, "CZK")),
        annualOperatingCosts: moneyToDto(Money.fromMajor(20_000, "CZK")),
        repairFundAnnual: moneyToDto(Money.fromMajor(1_000, "CZK")),
      },
      persist: true,
    });

    expect(findCached).toHaveBeenCalledWith(
      expect.any(String),
      INVESTMENT_ENGINE_VERSION,
    );
  });
});
