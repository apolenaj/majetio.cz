/**
 * Tests for MortgageReadiness domain model (Prompt 13/3).
 */

import { describe, it, expect } from "vitest";

import {
  computeMortgageReadiness,
  buildReadinessInputFromPassport,
  applyScenarioOverride,
} from "./mortgage-readiness";
import { emptyPassportState } from "@/lib/financial-passport/types";
import type { PropertyFinancingSummary } from "./property-financing";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COMPLETE_INPUT = {
  askingPriceCzk: 4_000_000,
  availableEquityCzk: 1_600_000,
  monthlyIncomeCzk: 65_000,
  monthlyLiabilitiesCzk: 5_000,
  hasContact: true,
};

const MINIMAL_INPUT = {
  askingPriceCzk: 4_000_000,
  availableEquityCzk: 1_600_000,
  monthlyIncomeCzk: null,
  monthlyLiabilitiesCzk: null,
  hasContact: true,
};

const INCOMPLETE_INPUT = {
  askingPriceCzk: null,
  availableEquityCzk: null,
  monthlyIncomeCzk: null,
  monthlyLiabilitiesCzk: null,
  hasContact: false,
};

// ---------------------------------------------------------------------------
// computeMortgageReadiness
// ---------------------------------------------------------------------------

describe("computeMortgageReadiness", () => {
  it("returns ready_for_review when all required + income present", () => {
    const r = computeMortgageReadiness(COMPLETE_INPUT);
    expect(r.level).toBe("ready_for_review");
    expect(r.label).toBe("Připraveno k odbornému posouzení");
    expect(r.allRequiredDone).toBe(true);
    expect(r.ctaLabel).toBe("Chci zjistit reálné možnosti financování");
  });

  it("returns basic_data_ready when required done but no income", () => {
    const r = computeMortgageReadiness(MINIMAL_INPUT);
    expect(r.level).toBe("basic_data_ready");
    expect(r.label).toBe("Základní údaje připraveny");
    expect(r.allRequiredDone).toBe(true);
  });

  it("returns data_incomplete when required items missing", () => {
    const r = computeMortgageReadiness(INCOMPLETE_INPUT);
    expect(r.level).toBe("data_incomplete");
    expect(r.label).toBe("Chybí údaje");
    expect(r.allRequiredDone).toBe(false);
    expect(r.ctaTone).toBe("secondary");
  });

  it("checklist has 5 items", () => {
    const r = computeMortgageReadiness(COMPLETE_INPUT);
    expect(r.checklist).toHaveLength(5);
    const ids = r.checklist.map((i) => i.id);
    expect(ids).toContain("property_price");
    expect(ids).toContain("own_funds");
    expect(ids).toContain("income");
    expect(ids).toContain("liabilities");
    expect(ids).toContain("contact");
  });

  it("marks income as optional_missing when absent", () => {
    const r = computeMortgageReadiness(MINIMAL_INPUT);
    const income = r.checklist.find((i) => i.id === "income");
    expect(income?.status).toBe("optional_missing");
  });

  it("marks required items as done when present", () => {
    const r = computeMortgageReadiness(COMPLETE_INPUT);
    const price = r.checklist.find((i) => i.id === "property_price");
    const equity = r.checklist.find((i) => i.id === "own_funds");
    const contact = r.checklist.find((i) => i.id === "contact");
    expect(price?.status).toBe("done");
    expect(equity?.status).toBe("done");
    expect(contact?.status).toBe("done");
  });

  it("never uses 'approved' or 'pre-approved' in labels", () => {
    for (const input of [COMPLETE_INPUT, MINIMAL_INPUT, INCOMPLETE_INPUT]) {
      const r = computeMortgageReadiness(input);
      const allText = [r.label, r.description, r.ctaLabel].join(" ").toLowerCase();
      expect(allText).not.toContain("schválen");
      expect(allText).not.toContain("approved");
      expect(allText).not.toContain("pre-approved");
    }
  });

  it("income preview uses bucketed label, not exact amount", () => {
    const r = computeMortgageReadiness(COMPLETE_INPUT);
    const income = r.checklist.find((i) => i.id === "income");
    expect(income?.previewLabel).not.toBe("65 000");
    expect(income?.previewLabel).toContain("Kč/měs");
  });
});

// ---------------------------------------------------------------------------
// buildReadinessInputFromPassport
// ---------------------------------------------------------------------------

describe("buildReadinessInputFromPassport", () => {
  it("merges passport equity with summary price", () => {
    const passport = {
      ...emptyPassportState(),
      availableEquityCzk: 2_000_000,
      monthlyIncomeCzk: 80_000,
    };
    const summary = {
      purchasePriceCzk: 5_000_000,
      availableEquityCzk: 2_000_000,
    } as PropertyFinancingSummary;

    const input = buildReadinessInputFromPassport(passport, summary, true);
    expect(input.askingPriceCzk).toBe(5_000_000);
    expect(input.availableEquityCzk).toBe(2_000_000);
    expect(input.monthlyIncomeCzk).toBe(80_000);
    expect(input.hasContact).toBe(true);
  });

  it("handles null passport gracefully", () => {
    const input = buildReadinessInputFromPassport(null, null, false);
    expect(input.askingPriceCzk).toBeNull();
    expect(input.hasContact).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyScenarioOverride
// ---------------------------------------------------------------------------

describe("applyScenarioOverride", () => {
  it("overrides income without touching other fields", () => {
    const base = buildReadinessInputFromPassport(
      { ...emptyPassportState(), monthlyIncomeCzk: 50_000 },
      null,
      true,
    );
    const overridden = applyScenarioOverride(base, { monthlyIncomeCzk: 70_000 });
    expect(overridden.monthlyIncomeCzk).toBe(70_000);
    expect(overridden.hasContact).toBe(true);
  });

  it("does not override when override value is undefined", () => {
    const base = { ...COMPLETE_INPUT };
    const overridden = applyScenarioOverride(base, {});
    expect(overridden.monthlyIncomeCzk).toBe(65_000);
  });
});
