import { describe, expect, it } from "vitest";

import { propertyListingStatusTone } from "./detail-presentation";

describe("propertyListingStatusTone (lifecycle)", () => {
  it("maps active and reserved distinctly", () => {
    expect(propertyListingStatusTone("ACTIVE")).toBe("active");
    expect(propertyListingStatusTone("RESERVED")).toBe("reserved");
  });

  it("maps sold / rented / withdrawn / unavailable to unavailable", () => {
    for (const s of ["SOLD", "RENTED", "WITHDRAWN", "UNAVAILABLE"]) {
      expect(propertyListingStatusTone(s)).toBe("unavailable");
    }
  });

  it("maps draft / archived / moderation states to archived", () => {
    for (const s of [
      "ARCHIVED",
      "DRAFT",
      "REJECTED",
      "SUSPENDED",
      "PENDING_REVIEW",
    ]) {
      expect(propertyListingStatusTone(s)).toBe("archived");
    }
  });
});
