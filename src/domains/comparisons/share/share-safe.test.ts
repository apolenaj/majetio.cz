import { describe, expect, it } from "vitest";

import {
  assertShareSafePayload,
  DEFAULT_SHARE_INCLUDE,
} from "./share-safe";
import { buildShareSafeView } from "./share-service";

describe("share-safe payload (BOD 80–81)", () => {
  it("builds view without passport / financing / notes keys", () => {
    const view = buildShareSafeView({
      comparisonId: "c1",
      name: "Test",
      includeFlags: DEFAULT_SHARE_INCLUDE,
      properties: [
        {
          propertyId: "p1",
          slug: "demo-high-yield",
          title: "High yield",
          href: "/nemovitosti/demo-high-yield",
          askingPriceCzk: 4_500_000,
          city: "Brno",
          grossYieldPct: 6.2,
          majetioScore: 78,
        },
      ],
    });

    const json = JSON.stringify(view);
    expect(json).not.toMatch(/"passport"/);
    expect(json).not.toMatch(/"financing"/);
    expect(json).not.toMatch(/"income"/);
    expect(json).not.toMatch(/"notes"/);
    expect(json).not.toMatch(/"matchScore"/);
    expect(view.disclaimerCs.toLowerCase()).toContain("finanční pas");
    expect(() => assertShareSafePayload(view)).not.toThrow();
  });

  it("rejects payloads that smuggle personal financing", () => {
    expect(() =>
      assertShareSafePayload({
        properties: [{ financing: { equityCzk: 1 } }],
      }),
    ).toThrow(/forbidden key/);
  });

  it("rejects e-mail in share payload", () => {
    expect(() =>
      assertShareSafePayload({
        properties: [{ title: "x", contact: "a@b.cz" }],
      }),
    ).toThrow(/e-mail/i);
  });

  it("rejects rejectionReason and decisionPriority keys", () => {
    expect(() =>
      assertShareSafePayload({
        properties: [{ rejectionReason: "too expensive" }],
      }),
    ).toThrow(/forbidden key/);
    expect(() =>
      assertShareSafePayload({
        properties: [{ decisionPriority: "HIGH" }],
      }),
    ).toThrow(/forbidden key/);
  });
});
