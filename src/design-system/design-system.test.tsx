import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Button } from "@/components/ui/button";
import { DataQualityBadge, RiskBadge } from "@/components/ui/badge";
import { interpretScore } from "@/components/data-display/metric-card";
import {
  formatCzk,
  formatPercentPoints,
  parseLocalizedNumber,
} from "@/lib/format";

describe("format helpers", () => {
  it("formats CZK with Czech grouping", () => {
    expect(formatCzk(4_990_000)).toMatch(/4/);
    expect(formatCzk(4_990_000)).toMatch(/Kč/);
  });

  it("formats signed percent points", () => {
    expect(formatPercentPoints(5.4, { signed: true })).toContain("5,4");
    expect(formatPercentPoints(5.4, { signed: true })).toContain("%");
  });

  it("parses localized numbers", () => {
    expect(parseLocalizedNumber("6 500 000")).toBe(6_500_000);
    expect(parseLocalizedNumber("4,8")).toBe(4.8);
    expect(parseLocalizedNumber("")).toBeNull();
  });
});

describe("Button", () => {
  it("renders and supports disabled + loading", () => {
    const { rerender } = render(<Button>Uložit</Button>);
    expect(screen.getByRole("button", { name: "Uložit" })).toBeEnabled();
    rerender(<Button disabled>Uložit</Button>);
    expect(screen.getByRole("button", { name: "Uložit" })).toBeDisabled();
    rerender(
      <Button loading aria-label="Ukládání">
        Uložit
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Ukládání" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });
});

describe("badges", () => {
  it("exposes text for data quality and risk", () => {
    render(
      <>
        <DataQualityBadge quality="verified" />
        <RiskBadge level="high" />
      </>,
    );
    expect(screen.getByText("Ověřeno")).toBeInTheDocument();
    expect(screen.getByText("Vysoké riziko")).toBeInTheDocument();
  });
});

describe("Majetio score interpretation", () => {
  it("maps scores to labels and handles missing data", () => {
    expect(interpretScore(90).label).toBe("Výborné");
    expect(interpretScore(72).label).toBe("Dobré");
    expect(interpretScore(null).label).toBe("Nedostatek dat");
  });
});
