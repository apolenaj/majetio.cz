import { describe, expect, it } from "vitest";

import { FINANCING_ASSUMPTIONS, resolveFinancingInputs } from "@/config/financing-assumptions";
import { calculateMortgage } from "@/lib/calculators/mortgage";
import { buildHypotekaJasneFinancingUrl } from "@/lib/financing/hypotekajasne-url";

describe("financing integration", () => {
  it("resolves default equity and rate from central assumptions", () => {
    const resolved = resolveFinancingInputs({ propertyPriceCzk: 6_500_000 });
    expect(resolved.ownFundsCzk).toBe(1_300_000);
    expect(resolved.loanAmountCzk).toBe(5_200_000);
    expect(resolved.annualInterestRatePp).toBe(
      FINANCING_ASSUMPTIONS.referenceMortgageRatePp,
    );
    expect(resolved.termYears).toBe(FINANCING_ASSUMPTIONS.defaultTermYears);
  });

  it("uses shared annuity engine for monthly payment", () => {
    const resolved = resolveFinancingInputs({ propertyPriceCzk: 6_500_000 });
    const mortgage = calculateMortgage({
      principal: resolved.loanAmountCzk,
      annualInterestRate: resolved.annualInterestRatePp,
      years: resolved.termYears,
    });
    expect(mortgage.monthlyPayment).toBeGreaterThan(20_000);
    expect(mortgage.monthlyPayment).toBeLessThan(40_000);
  });

  it("builds HypotekaJasne URL with safe context and UTM", () => {
    const href = buildHypotekaJasneFinancingUrl({
      propertyPriceCzk: 6_500_000,
      ownFundsCzk: 1_300_000,
      loanAmountCzk: 5_200_000,
      termYears: 30,
      propertyUrl: "https://www.majetio.cz/nemovitosti/demo?email=secret@x.cz#frag",
      sourceContext: "property_detail",
    });
    const url = new URL(href);
    expect(url.origin).toBe("https://www.hypotekajasne.cz");
    expect(url.searchParams.get("cena")).toBe("6500000");
    expect(url.searchParams.get("vlastniZdroje")).toBe("1300000");
    expect(url.searchParams.get("uver")).toBe("5200000");
    expect(url.searchParams.get("splatnost")).toBe("30");
    expect(url.searchParams.get("source")).toBe("majetio");
    expect(url.searchParams.get("utm_source")).toBe("majetio");
    expect(url.searchParams.get("utm_medium")).toBe("referral");
    expect(url.searchParams.get("utm_campaign")).toBe("property_financing");
    expect(url.searchParams.get("utm_content")).toBe("property_detail");
    expect(url.searchParams.get("propertyUrl")).toBe(
      "https://www.majetio.cz/nemovitosti/demo",
    );
    expect(href).not.toContain("secret@");
  });

  it("passes foreign country context without implying CZ mortgage approval", () => {
    const href = buildHypotekaJasneFinancingUrl({
      propertyPriceCzk: 6_250_000,
      country: "Spain",
      currency: "EUR",
      sourceContext: "foreign_property",
    });
    const url = new URL(href);
    expect(url.searchParams.get("country")).toBe("Spain");
    expect(url.searchParams.get("currency")).toBe("EUR");
    expect(url.searchParams.get("utm_content")).toBe("foreign_property");
  });
});
