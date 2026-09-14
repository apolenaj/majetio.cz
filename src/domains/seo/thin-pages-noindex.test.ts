/**
 * Thin pages must resolve to noindex metadata — SEO quality gate.
 */

import { describe, expect, it } from "vitest";

import {
  decideProgrammaticIndexability,
  type ProgrammaticSeoPage,
} from "@/domains/seo/programmatic-rules";
import { buildPageMetadata } from "@/domains/seo/metadata";
import { buildSeoDocumentMeta } from "@/domains/seo/architecture";

function thinLocation(overrides: Partial<ProgrammaticSeoPage> = {}): ProgrammaticSeoPage {
  return {
    id: "thin-1",
    kind: "LOCATION_LANDING",
    marketCode: "CZ",
    path: "/lokality/thin-demo",
    hasRealData: false,
    sampleCount: 2,
    publishedAt: null,
    reviewRequiredAt: null,
    lastReviewedAt: null,
    isDemo: true,
    ...overrides,
  };
}

describe("SEO: thin pages → noindex", () => {
  it("programmatic gate marks thin / demo location as non-indexable", () => {
    const decision = decideProgrammaticIndexability(thinLocation());
    expect(decision.indexable).toBe(false);
    expect(decision.reasons.length).toBeGreaterThan(0);
    expect(decision.reasons.some((r) => /demo|no_real_data|sample_below/i.test(r))).toBe(
      true,
    );
  });

  it("buildPageMetadata sets robots noindex when noIndex flag is true", () => {
    const meta = buildPageMetadata({
      title: "Thin page",
      description: "Nedostatek unikátního obsahu",
      path: "/lokality/thin-demo",
      noIndex: true,
    });
    expect(meta.robots).toMatchObject({
      index: false,
    });
  });

  it("buildSeoDocumentMeta forceNoIndex mirrors thin-page policy", () => {
    const doc = buildSeoDocumentMeta({
      pathname: "/lokality/thin-demo",
      marketCode: "CZ",
      forceNoIndex: true,
      forceNoIndexReason: "thin_page",
    });
    expect(doc.robots.index).toBe(false);
    expect(doc.indexDenialReason).toMatch(/thin|force/i);
  });

  it("maps non-indexable programmatic decision → metadata noIndex contract", () => {
    const decision = decideProgrammaticIndexability(
      thinLocation({
        isDemo: false,
        publishedAt: "2026-01-01T00:00:00.000Z",
        hasRealData: false,
        sampleCount: 1,
      }),
    );
    expect(decision.indexable).toBe(false);

    // Release contract: callers must pass noIndex when decision.indexable === false
    const meta = buildPageMetadata({
      title: "Lokalita",
      description: "Profil",
      path: "/lokality/thin-demo",
      noIndex: !decision.indexable,
    });
    expect(meta.robots).toEqual(
      expect.objectContaining({ index: false }),
    );
  });
});
