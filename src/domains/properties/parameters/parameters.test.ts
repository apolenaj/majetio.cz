import { describe, expect, it } from "vitest";

import {
  buildPublicFeatureGroups,
  catalogFeatureHighlights,
  formatFeatureLine,
  mapImportedPresence,
  missingRequiredFeatureLabels,
  parseLocalizedPositiveNumber,
  presenceFromDb,
  presenceToDb,
  requiredFeatureKeys,
  sanitizeDetailsForAnswers,
  validateFeaturesForPublish,
} from "@/domains/properties/parameters";

describe("structured property features", () => {
  it("never coerces null/undefined to false", () => {
    expect(presenceFromDb(null)).toBe("unset");
    expect(presenceFromDb(undefined)).toBe("unset");
    expect(presenceFromDb(true)).toBe("yes");
    expect(presenceFromDb(false)).toBe("no");
    expect(presenceToDb("unset")).toBeNull();
    expect(presenceToDb("no")).toBe(false);
  });

  it("formats public labels Ano / Není / Neuvedeno", () => {
    expect(formatFeatureLine({ key: "balcony", presence: "yes", detail: { areaSqm: 6.2 } }).value).toContain("Ano");
    expect(formatFeatureLine({ key: "balcony", presence: "yes", detail: { areaSqm: 6.2 } }).value).toContain("6,2");
    expect(formatFeatureLine({ key: "loggia", presence: "no" }).value).toBe("Není");
    expect(formatFeatureLine({ key: "cellar", presence: "unset" }).value).toBe("Neuvedeno");
    expect(
      formatFeatureLine({
        key: "terrace",
        presence: "yes",
        detail: { areaUnknown: true, note: "Malá" },
      }).value,
    ).toContain("výměra neuvedena");
  });

  it("requires apartment features on publish and allows draft incompleteness", () => {
    const keys = requiredFeatureKeys("APARTMENT");
    expect(keys).toEqual(
      expect.arrayContaining([
        "balcony",
        "loggia",
        "terrace",
        "cellar",
        "elevator",
        "parking",
        "garage",
        "barrierFree",
      ]),
    );
    const missing = missingRequiredFeatureLabels({
      propertyType: "APARTMENT",
      answers: { balcony: "yes" },
    });
    expect(missing.length).toBeGreaterThan(0);
    expect(missing).toContain("Sklep");
  });

  it("clears details when answer changes to no", () => {
    const sanitized = sanitizeDetailsForAnswers(
      { balcony: "no", cellar: "yes" },
      {
        balcony: { areaSqm: 5, note: "starý popis" },
        cellar: { areaSqm: 3 },
      },
    );
    expect(sanitized.balcony).toBeUndefined();
    expect(sanitized.cellar?.areaSqm).toBe(3);
  });

  it("parses Czech decimal comma and never treats blank as zero", () => {
    expect(parseLocalizedPositiveNumber("6,2")).toBe(6.2);
    expect(parseLocalizedPositiveNumber("")).toBeNull();
    expect(parseLocalizedPositiveNumber("0")).toBeNull();
  });

  it("maps unknown imports to unset, never Ne", () => {
    expect(mapImportedPresence("možná")).toBe("unset");
    expect(mapImportedPresence("ano")).toBe("yes");
    expect(mapImportedPresence("ne")).toBe("no");
    expect(mapImportedPresence(null)).toBe("unset");
  });

  it("filters highlights to confirmed yes only", () => {
    expect(
      catalogFeatureHighlights({
        answers: { balcony: true, cellar: false, elevator: null },
        details: { balcony: { areaSqm: 6.2 } },
      }),
    ).toEqual(["Balkon 6,2 m²"]);
  });

  it("hides N/A garden for apartments in public groups", () => {
    const groups = buildPublicFeatureGroups({
      propertyType: "APARTMENT",
      answers: { balcony: true, garden: true },
    });
    const labels = groups.flatMap((g) => g.rows.map((r) => r.label));
    expect(labels).toContain("Balkon");
    expect(labels).not.toContain("Zahrada");
  });

  it("blocks publish when yes without area or unknown note", () => {
    const result = validateFeaturesForPublish({
      propertyType: "APARTMENT",
      answers: {
        balcony: "yes",
        loggia: "no",
        terrace: "no",
        cellar: "no",
        parking: "no",
        garage: "no",
        elevator: "no",
        barrierFree: "no",
      },
      details: { balcony: { areaUnknown: true } },
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "FEATURE_NOTE_REQUIRED")).toBe(true);
  });
});
