import { describe, expect, it } from "vitest";

import {
  ASSUMPTION_CONFIG_VERSION,
  resolveAssumptionDefaults,
} from "@/config/investment-assumptions";
import { Percentage } from "@/domains/finance";
import { Money } from "@/domains/finance";

import { calculateNpv } from "../engine/calculations/npv";
import {
  buildMajetioScoreFeatures,
  classifyYieldCfQuality,
} from "../integrations/score-search-dto";
import { applyTaxPlugin } from "../plugins/tax-plugin";
import { canReadScenario, canWriteScenario } from "./access";
import { applyScenarioVariant } from "./apply-variant";
import { convertWithSnapshot } from "./exchange-rate";
import { sanitizeScenarioName, scenarioNameSchema } from "./sanitize-name";
import { DEFAULT_CALCULATOR_INPUTS } from "../hooks/calculator-inputs";

describe("scenario name sanitization", () => {
  it("strips HTML and rejects injection", () => {
    expect(sanitizeScenarioName('<script>alert(1)</script>Můj')).toBe("Můj");
    expect(scenarioNameSchema.safeParse("<b>Hack</b>").success).toBe(true);
    expect(scenarioNameSchema.parse("<b>Hack</b>")).toBe("Hack");
  });
});

describe("assumption config (no magic vacancy)", () => {
  it("resolves vacancy from versioned config", () => {
    const a = resolveAssumptionDefaults({ strategy: "long_term_rental" });
    expect(a.versionKey).toBe(ASSUMPTION_CONFIG_VERSION);
    expect(a.defaults.vacancyRatePp).toBe(5);
    const commercial = resolveAssumptionDefaults({ propertyType: "COMMERCIAL" });
    expect(commercial.defaults.vacancyRatePp).toBe(8);
  });
});

describe("scenario variants", () => {
  it("makes conservative rent lower than realistic", () => {
    const base = { ...DEFAULT_CALCULATOR_INPUTS, monthlyRent: 24_000 };
    const cons = applyScenarioVariant({ base, variant: "conservative" });
    const opt = applyScenarioVariant({ base, variant: "optimistic" });
    expect(cons.monthlyRent!).toBeLessThan(base.monthlyRent!);
    expect(opt.monthlyRent!).toBeGreaterThan(base.monthlyRent!);
  });
});

describe("IDOR access helpers", () => {
  it("blocks user B from reading user A scenario", () => {
    const scenario = {
      ownerUserId: "user-a",
      profile: "USER" as const,
      isPublicShareEnabled: true,
    };
    expect(
      canReadScenario(scenario, { id: "user-b", role: "USER" }),
    ).toBe(false);
    expect(
      canReadScenario(scenario, { id: "user-a", role: "USER" }),
    ).toBe(true);
    // Public share disabled for private USER scenarios even if flag true
    expect(
      canWriteScenario(scenario, { id: "user-b", role: "USER" }),
    ).toBe(false);
  });

  it("allows SYSTEM_NEUTRAL read without session", () => {
    expect(
      canReadScenario(
        {
          ownerUserId: null,
          profile: "SYSTEM_NEUTRAL",
          isPublicShareEnabled: false,
        },
        null,
      ),
    ).toBe(true);
  });
});

describe("tax / npv / fx foundations", () => {
  it("tax plugin stays pre-tax", () => {
    const r = applyTaxPlugin({
      baseCurrency: "CZK",
      annualNoi: 200_000,
      annualCashFlow: 50_000,
    });
    expect(r.status).toBe("not_applied");
    expect(r.message).toMatch(/před zdaněním/i);
  });

  it("computes NPV from nominal flows", () => {
    const npv = calculateNpv({
      cashFlows: [
        Money.fromMajor(-1_000_000, "CZK"),
        Money.fromMajor(120_000, "CZK"),
        Money.fromMajor(120_000, "CZK"),
        Money.fromMajor(1_100_000, "CZK"),
      ],
      discountRate: Percentage.fromPercentPoints(8),
    });
    expect(npv.npv.toMajorNumber()).toBeGreaterThan(0);
  });

  it("converts with FX snapshot", () => {
    const r = convertWithSnapshot({
      amountMajor: 1000,
      fromCurrency: "EUR",
      baseCurrency: "CZK",
      snapshot: {
        fromCurrency: "EUR",
        toCurrency: "CZK",
        rate: "25",
        source: "cnb-demo",
        asOf: "2026-07-20T00:00:00.000Z",
      },
    });
    expect(r.amountMajorInBase).toBe(25_000);
  });
});

describe("majetio score features", () => {
  it("classifies yield/CF quality for search/score pipeline", () => {
    expect(
      classifyYieldCfQuality({ netYield: 0.06, monthlyCashFlow: 3000 }),
    ).toBe("strong");
    const features = buildMajetioScoreFeatures({
      assumptionConfigVersion: ASSUMPTION_CONFIG_VERSION,
      engineVersion: "0.4.0-risk",
      netYield: 0.04,
      monthlyCashFlow: 1000,
      dscr: 1.3,
      ltv: 0.6,
    });
    expect(features.yieldCfQuality).toBe("adequate");
    expect(features.schemaVersion).toBe("1.0.0");
  });
});
