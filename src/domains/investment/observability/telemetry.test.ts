/**
 * Part 2/D — Telemetry + analytics privacy for investment calculator.
 */

import { describe, expect, it } from "vitest";

import { Money } from "@/domains/finance";
import {
  assertAnalyticsSafe,
  track,
  type AnalyticsEvent,
} from "@/lib/analytics/events";

import {
  computeMissingInputRate,
  registerCalculationTelemetrySink,
  withCalculationTelemetry,
} from "../observability";
import {
  buildPropertyInvestmentSnapshot,
  hashCalculationInput,
  runInvestmentCalculationPure,
} from "../service";
import { moneyToDto } from "../engine";

describe("calculation telemetry", () => {
  it("emits completed event with missing-input rate (no amounts)", () => {
    const events: unknown[] = [];
    const unsub = registerCalculationTelemetrySink((e) => events.push(e));

    const snapshot = buildPropertyInvestmentSnapshot({
      id: "tel-1",
      askingPrice: 5_000_000,
      currency: "CZK",
    });
    const hash = hashCalculationInput({
      propertySnapshot: snapshot,
      assumptionSet: {},
      scenarioType: "BASE_METRICS",
    });

    withCalculationTelemetry(() =>
      runInvestmentCalculationPure({
        propertySnapshot: snapshot,
        assumptionSet: {},
        inputHash: hash,
      }),
    );

    unsub();
    expect(events.length).toBeGreaterThanOrEqual(1);
    const completed = events.find(
      (e) =>
        typeof e === "object" &&
        e != null &&
        (e as { type: string }).type === "calculation_completed",
    ) as {
      type: string;
      missingInputRate: number;
      latencyMs: number;
      status: string;
    };
    expect(completed.status).toBe("PARTIAL");
    expect(completed.missingInputRate).toBeGreaterThan(0);
    expect(completed.latencyMs).toBeGreaterThanOrEqual(0);
    expect(Object.keys(completed)).not.toContain("amount");
    expect(Object.keys(completed)).not.toContain("price");
  });

  it("computeMissingInputRate is bounded", () => {
    expect(computeMissingInputRate(8, 2)).toBe(0.2);
    expect(computeMissingInputRate(0, 0)).toBe(0);
  });
});

describe("investment analytics events — privacy", () => {
  const safeEvents: AnalyticsEvent[] = [
    {
      name: "investment_analysis_viewed",
      props: {
        entry: "calculator",
        strategy: "long_term_rental",
        mode: "simple",
      },
    },
    {
      name: "scenario_selected",
      props: { variant: "conservative", strategy: "long_term_rental" },
    },
    {
      name: "sensitivity_opened",
      props: { surface: "heatmap" },
    },
    {
      name: "investment_assumption_changed",
      props: { field_bucket: "financing", strategy: "flip" },
    },
    {
      name: "investment_scenario_saved",
      props: { authenticated: true },
    },
  ];

  it("accepts investment events without PII / amounts", () => {
    for (const event of safeEvents) {
      expect(() => assertAnalyticsSafe(event)).not.toThrow();
      expect(() => track(event)).not.toThrow();
    }
  });

  it("rejects events that smuggle amounts", () => {
    expect(() =>
      assertAnalyticsSafe({
        name: "investment_analysis_viewed",
        props: {
          entry: "calculator",
          strategy: "long_term_rental",
          mode: "simple",
          amount: 5_000_000,
        },
      } as AnalyticsEvent),
    ).toThrow(/forbidden/i);
  });
});

describe("sensitive calculation cache policy", () => {
  it("ephemeral calculator hash differs from property-bound hash (no public shared cache key)", () => {
    const ephemeral = buildPropertyInvestmentSnapshot({
      id: "calculator-ephemeral",
      askingPrice: 6_000_000,
      currency: "CZK",
    });
    const listed = buildPropertyInvestmentSnapshot({
      id: "prop-real-1",
      askingPrice: 6_000_000,
      currency: "CZK",
    });
    const assumptions = {
      monthlyRent: moneyToDto(Money.fromMajor(30_000, "CZK")),
    };
    const h1 = hashCalculationInput({
      propertySnapshot: ephemeral,
      assumptionSet: assumptions,
      scenarioType: "BASE_METRICS",
    });
    const h2 = hashCalculationInput({
      propertySnapshot: listed,
      assumptionSet: assumptions,
      scenarioType: "BASE_METRICS",
    });
    expect(h1).not.toBe(h2);
  });
});
