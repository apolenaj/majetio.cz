import { describe, expect, it } from "vitest";

import {
  marketRegistry,
  isMarketPubliclyActive,
  buildCapabilityMatrix,
  isMarketFeatureEnabled,
  isMarketValuationEnabled,
  marketFeatureFlagKey,
  LAUNCH_STATUSES,
  listMarketPlugins,
  getMarketPlugin,
} from "@/domains/markets";
import { ID_BALI_REGION } from "@/domains/markets/plugins/id";

describe("MarketRegistry (Prompt 17.1)", () => {
  it("seeds CZ SK ES IT HR AE SA ID", () => {
    const codes = marketRegistry.listAll().map((m) => m.marketCode);
    expect(codes).toEqual(["CZ", "SK", "ES", "IT", "HR", "AE", "SA", "ID"]);
  });

  it("defines all LaunchStatus values", () => {
    expect(LAUNCH_STATUSES).toEqual([
      "PLANNED",
      "RESEARCH",
      "BETA",
      "LIVE",
      "PAUSED",
    ]);
  });

  it("exposes CZ as LIVE publicly active home market", () => {
    const cz = marketRegistry.getHomeMarket();
    expect(cz.launchStatus).toBe("LIVE");
    expect(cz.enabled).toBe(true);
    expect(cz.hasMinimumPublicData).toBe(true);
    expect(isMarketPubliclyActive(cz)).toBe(true);
    expect(marketRegistry.listPubliclyActive()).toHaveLength(1);
  });

  it("hides markets without data / not LIVE|BETA", () => {
    const sk = marketRegistry.get("SK")!;
    expect(isMarketPubliclyActive(sk)).toBe(false);
    const surface = marketRegistry.toPublicSurface("SK")!;
    expect(surface.publiclyActive).toBe(false);
    expect(surface.reasonIfHidden).toMatch(/disabled|status|data/i);
  });

  it("treats Bali as region under ID, not a country market", () => {
    expect(getMarketPlugin("BALI")).toBeNull();
    expect(marketRegistry.get("BALI")).toBeNull();
    const bali = marketRegistry.resolveRegion("ID", "bali");
    expect(bali).toEqual(ID_BALI_REGION);
    expect(bali?.parentMarketCode).toBe("ID");
  });
});

describe("MarketPlugin + Capability Matrix", () => {
  it("loads plugins with property/financing/tax configs", () => {
    const plugins = listMarketPlugins();
    expect(plugins.length).toBe(8);
    for (const p of plugins) {
      expect(p.property.areaUnit).toMatch(/sqm|sqft/);
      expect(p.financing.currency.length).toBe(3);
      expect(p.taxation.regulatoryPackId.length).toBeGreaterThan(0);
      expect(p.marketCode).toBe(p.definition.marketCode);
    }
  });

  it("builds capability matrix with FULL valuation for CZ only", () => {
    const matrix = buildCapabilityMatrix();
    expect(matrix.capabilityKeys).toContain("VALUATION");
    const cz = matrix.rows.find((r) => r.marketCode === "CZ")!;
    expect(cz.capabilities.VALUATION).toBe("FULL");
    const es = matrix.rows.find((r) => r.marketCode === "ES")!;
    expect(es.capabilities.VALUATION).toBe("NOT_AVAILABLE");
  });

  it("resolves MARKET_CZ_VALUATION_ENABLED and env override", () => {
    expect(marketFeatureFlagKey("CZ", "VALUATION")).toBe(
      "MARKET_CZ_VALUATION_ENABLED",
    );
    expect(isMarketValuationEnabled("CZ")).toBe(true);
    expect(isMarketValuationEnabled("ES")).toBe(false);
    expect(
      isMarketFeatureEnabled("CZ", "VALUATION", {
        MARKET_CZ_VALUATION_ENABLED: "false",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
  });
});
