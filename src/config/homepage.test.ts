import { describe, expect, it } from "vitest";

import {
  homepageExperimentDefaults,
  homepageSectionOrderControl,
  resolveHomepageHero,
  resolveHomepageSectionOrder,
} from "@/config/homepage";
import { homepageContent } from "@/content/homepage";
import { homepageDemoAnalysis } from "@/data/demo/homepage-analysis";

describe("homepage experiments", () => {
  it("defaults to control variants", () => {
    expect(homepageExperimentDefaults.homepage_h1).toBe("control");
    expect(homepageExperimentDefaults.homepage_primary_cta).toBe("control");
    expect(homepageExperimentDefaults.homepage_section_order).toBe("control");
  });

  it("resolves control hero from content", () => {
    const hero = resolveHomepageHero();
    expect(hero.headline).toBe(homepageContent.hero.headline);
    expect(hero.primaryCta.label).toBe(homepageContent.hero.primaryCta.label);
  });

  it("resolves challenger H1 and CTA independently", () => {
    const hero = resolveHomepageHero({ h1: "challenger", cta: "challenger" });
    expect(hero.headline).toBe("Vyplatí se tuto nemovitost koupit?");
    expect(hero.primaryCta.label).toBe("Spustit analýzu");
  });

  it("keeps control section order complete", () => {
    expect(resolveHomepageSectionOrder("control")).toEqual(homepageSectionOrderControl);
    expect(homepageSectionOrderControl).toContain("sampleAnalysis");
    expect(homepageSectionOrderControl).toContain("finalCta");
  });

  it("challenger order moves pricing earlier", () => {
    const order = resolveHomepageSectionOrder("challenger");
    expect(order.indexOf("pricing")).toBeLessThan(order.indexOf("scoreAndMetrics"));
  });
});

describe("homepage demo data", () => {
  it("marks analysis as demo", () => {
    expect(homepageDemoAnalysis.isDemo).toBe(true);
    expect(homepageDemoAnalysis.askingPriceCzk).toBe(6_490_000);
    expect(homepageDemoAnalysis.grossYieldPct).toBe(5.4);
  });
});

describe("homepage content", () => {
  it("has FAQ items for structured data", () => {
    expect(homepageContent.faq.items.length).toBeGreaterThanOrEqual(6);
    expect(homepageContent.faq.items.length).toBeLessThanOrEqual(10);
  });

  it("avoids urgency tactics in final CTA", () => {
    const blob = `${homepageContent.finalCta.title} ${homepageContent.finalCta.description}`;
    expect(blob.toLowerCase()).not.toMatch(/poslední šance|jen dnes|okamžitě/);
  });
});
