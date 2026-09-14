/**
 * Decision Workspace demo fixtures (BOD 175).
 * Pure content helpers for tests / local demos — no monetization.
 */

export type DecisionDemoPropertyFixture = {
  slug: string;
  title: string;
  city: string;
  propertyType: "APARTMENT" | "HOUSE";
  askingPriceCzk: number;
  previousAskingPriceCzk?: number;
  grossYieldPct: number | null;
  tag: "high_yield" | "price_change" | "needs_renovation";
};

export const DECISION_DEMO_FIXTURES: DecisionDemoPropertyFixture[] = [
  {
    slug: "demo-byt-2kk-brno",
    title: "Demo: High-yield 2+kk Brno",
    city: "Brno",
    propertyType: "APARTMENT",
    askingPriceCzk: 4_200_000,
    grossYieldPct: 6.4,
    tag: "high_yield",
  },
  {
    slug: "demo-byt-3kk-vinohrady",
    title: "Demo: Price-change 3+kk Vinohrady",
    city: "Praha",
    propertyType: "APARTMENT",
    askingPriceCzk: 6_490_000,
    previousAskingPriceCzk: 6_790_000,
    grossYieldPct: 3.8,
    tag: "price_change",
  },
  {
    slug: "demo-dum-rekonstrukce",
    title: "Demo: House needing renovation",
    city: "Plzeň",
    propertyType: "HOUSE",
    askingPriceCzk: 5_100_000,
    grossYieldPct: null,
    tag: "needs_renovation",
  },
];

export function getHighYieldDemoFixture(): DecisionDemoPropertyFixture {
  return DECISION_DEMO_FIXTURES.find((f) => f.tag === "high_yield")!;
}

export function getPriceChangeDemoFixture(): DecisionDemoPropertyFixture {
  return DECISION_DEMO_FIXTURES.find((f) => f.tag === "price_change")!;
}
