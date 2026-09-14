import { describe, expect, it } from "vitest";
import * as React from "react";
import { render, screen } from "@testing-library/react";

import { comparisonConfig } from "@/config/comparison";
import { comparisonFixtureSources } from "@/content/comparison-ui-fixtures";
import { ComparisonSectionBoundary } from "@/components/comparisons/comparison-section-boundary";
import { buildComparisonViewModel } from "./service/build-view-model";
import { COMPARE_FULL_MESSAGE } from "@/domains/properties/search/compare-tray";

function Boom(): React.ReactNode {
  throw new Error("renovation calc failed");
}

describe("Comparison UI metrics & resilience", () => {
  it("exposes exact tray-full refuse copy", () => {
    expect(COMPARE_FULL_MESSAGE).toBe(
      "Pro přidání další nemovitosti nejprve jednu odeberte",
    );
    expect(comparisonConfig.trayFullMessageCs).toBe(COMPARE_FULL_MESSAGE);
    expect(comparisonConfig.maxProperties).toBe(4);
  });

  it("builds heterogeneous fixture with gap, reno bands, risk severities, confidence", () => {
    const view = buildComparisonViewModel({
      mode: "investment",
      properties: comparisonFixtureSources(),
    });

    expect(view.properties.length).toBe(3);
    expect(view.properties.length).toBeLessThanOrEqual(
      comparisonConfig.maxProperties,
    );

    const vinohrady = view.properties.find(
      (p) => p.slug === "demo-byt-3kk-vinohrady",
    )!;
    expect(vinohrady.cells.max_offer_gap?.kind).toBe("number");
    expect(vinohrady.cells.renovation_cost_low?.kind).toBe("number");
    expect(vinohrady.cells.renovation_cost_base?.kind).toBe("number");
    expect(vinohrady.cells.renovation_cost_high?.kind).toBe("number");
    expect(vinohrady.cells.renovation_duration?.kind).toBe("number");
    expect(vinohrady.cells.majetio_score_confidence?.kind).toBe("string");
    expect(vinohrady.expandDetails.irr_pct?.body.length).toBeGreaterThan(10);

    const brno = view.properties.find((p) => p.slug === "demo-byt-2kk-brno")!;
    // Sparse reno — missing bands, never fake 0
    expect(brno.cells.renovation_cost_base?.kind).toBe("missing");
    expect(brno.cells.renovation_arv?.kind).toBe("missing");

    const house = view.properties.find(
      (p) => p.slug === "demo-dum-rekonstrukce",
    )!;
    expect(house.cells.risk_critical?.kind).toBe("number");
    if (house.cells.risk_critical?.kind === "number") {
      expect(house.cells.risk_critical.value).toBeGreaterThanOrEqual(1);
    }
    expect(house.cells.risk_high?.kind).toBe("number");
    expect(house.cells.risk_medium?.kind).toBe("number");
    expect(house.cells.location_score_confidence?.kind).toBe("string");

    // Cross-type warning apartment vs house
    expect(view.warnings.some((w) => /typ|byt|dům/i.test(w.title + w.body))).toBe(
      true,
    );
  });

  it("section boundary isolates a thrown child without crashing siblings", () => {
    render(
      <div>
        <ComparisonSectionBoundary title="Renovace">
          <Boom />
        </ComparisonSectionBoundary>
        <p>Tabulka porovnání stále viditelná</p>
      </div>,
    );
    expect(screen.getByText(/Renovace není k dispozici/i)).toBeTruthy();
    expect(screen.getByText(/Tabulka porovnání stále viditelná/i)).toBeTruthy();
  });
});
