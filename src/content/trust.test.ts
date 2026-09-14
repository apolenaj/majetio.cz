import { describe, expect, it } from "vitest";

import {
  ABOUT_DONT,
  GLOSSARY_TERMS,
  TRUST_CENTER_SECTIONS,
} from "@/content/trust";
import { TRUST_FORBIDDEN_CERTAINTY_PHRASES } from "@/components/trust/types";

describe("trust content integrity", () => {
  it("avoids absolute security marketing phrases", () => {
    const blob = JSON.stringify({
      ABOUT_DONT,
      TRUST_CENTER_SECTIONS,
      GLOSSARY_TERMS,
    }).toLowerCase();
    expect(blob).not.toContain("100% secure");
    expect(blob).not.toContain("bank-level security");
    expect(blob).not.toContain("bank level security");
  });

  it("glossary covers core investment terms", () => {
    const slugs = GLOSSARY_TERMS.map((t) => t.slug);
    expect(slugs).toEqual(
      expect.arrayContaining(["ltv", "rpsn", "noi", "irr", "arv"]),
    );
  });

  it("trust center includes responsible disclosure", () => {
    expect(
      TRUST_CENTER_SECTIONS.some((s) => s.id === "responsible-disclosure"),
    ).toBe(true);
  });

  it("forbidden certainty list stays non-empty", () => {
    expect(TRUST_FORBIDDEN_CERTAINTY_PHRASES.length).toBeGreaterThan(0);
  });
});
