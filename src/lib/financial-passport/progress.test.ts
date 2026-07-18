import { describe, expect, it } from "vitest";

import { computePassportProgress } from "@/lib/financial-passport/progress";
import { buildPassportRecommendations } from "@/lib/financial-passport/recommendations";
import { emptyPassportState } from "@/lib/financial-passport/types";
import { PropertyType } from "@prisma/client";

describe("computePassportProgress", () => {
  it("starts empty", () => {
    const progress = computePassportProgress(emptyPassportState());
    expect(progress.level).toBe("empty");
    expect(progress.percent).toBe(0);
  });

  it("reaches basic with goal, budget, financing", () => {
    const state = emptyPassportState();
    state.goal = "OWN_HOME";
    state.maxPriceCzk = 8_000_000;
    state.financingMode = "MORTGAGE";
    state.availableEquityCzk = 1_600_000;
    expect(computePassportProgress(state).level).toBe("basic");
  });

  it("reaches ready when extended + investment prefs", () => {
    const state = emptyPassportState();
    state.goal = "INVESTMENT";
    state.maxPriceCzk = 6_000_000;
    state.availableEquityCzk = 1_200_000;
    state.financingMode = "MIXED";
    state.preferredCity = "Brno";
    state.propertyTypes = [PropertyType.APARTMENT];
    state.riskTolerance = "BALANCED";
    state.strategies = ["dlouhodoby-pronajem"];
    expect(computePassportProgress(state).level).toBe("ready");
  });
});

describe("buildPassportRecommendations", () => {
  it("flags equity gap for 80% LTV as indicative", () => {
    const state = emptyPassportState();
    state.maxPriceCzk = 8_000_000;
    state.availableEquityCzk = 500_000;
    state.financingMode = "MORTGAGE";
    const tips = buildPassportRecommendations(state);
    const gap = tips.find((t) => t.id === "equity-gap");
    expect(gap).toBeDefined();
    expect(gap?.indicative).toBe(true);
    expect(gap?.body).toContain("orientační");
  });

  it("never invents hard rejection language", () => {
    const state = emptyPassportState();
    state.maxPriceCzk = 10_000_000;
    state.availableEquityCzk = 100_000;
    state.financingMode = "MORTGAGE";
    state.monthlyIncomeCzk = 40_000;
    state.monthlyLiabilitiesCzk = 25_000;
    for (const tip of buildPassportRecommendations(state)) {
      expect(tip.body.toLowerCase()).not.toMatch(/zamítáme|schváleno|nesmíte/);
      expect(tip.indicative).toBe(true);
    }
  });
});
