import { describe, expect, it } from "vitest";

import {
  HYPOTEKAJASNE_RECIPIENT,
  HYPOTEKAJASNE_SHAREABLE_FIELDS,
} from "@/lib/privacy/constants";

describe("HypotekaJasne sharing constants", () => {
  it("always includes email and never auto-shares without preview fields list", () => {
    expect(HYPOTEKAJASNE_SHAREABLE_FIELDS.some((f) => f.key === "email" && f.always)).toBe(
      true,
    );
    expect(HYPOTEKAJASNE_RECIPIENT.name).toContain("HypotekaJasne");
    expect(HYPOTEKAJASNE_RECIPIENT.purpose.length).toBeGreaterThan(20);
  });

  it("does not include birth number or employer fields", () => {
    const keys = HYPOTEKAJASNE_SHAREABLE_FIELDS.map((f) => f.key);
    expect(keys).not.toContain("birthNumber");
    expect(keys).not.toContain("rodneCislo");
    expect(keys).not.toContain("employer");
    expect(keys).not.toContain("address");
  });
});
