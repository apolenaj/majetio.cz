import { describe, expect, it } from "vitest";

import { canDisplayMediaUrl, toPublicMediaItem } from "./media-public";
import { toPublicPropertyDto } from "./dto";
import { canViewProperty } from "./authorization";
import {
  buildPropertyDetailBreadcrumbs,
  propertyListingStatusTone,
} from "./detail-presentation";
import { getDemoPropertyRecord } from "@/content/demo-canonical-properties";
import { createPropertyService, type PropertyRepository } from "./property-service";

describe("media license projection", () => {
  it("blocks prohibited and restricted URLs", () => {
    expect(canDisplayMediaUrl("PROHIBITED")).toBe(false);
    expect(canDisplayMediaUrl("RESTRICTED")).toBe(false);
    expect(canDisplayMediaUrl("OWNED")).toBe(true);

    const blocked = toPublicMediaItem({
      url: "/secret.jpg",
      type: "PHOTO",
      isPrimary: false,
      isPlaceholder: false,
      licenseStatus: "PROHIBITED",
      sourceId: "internal-source-id",
    });
    expect(blocked.url).toBeNull();
    expect(blocked.restricted).toBe(true);
    expect(JSON.stringify(blocked)).not.toContain("secret.jpg");
    expect(JSON.stringify(blocked)).not.toContain("internal-source-id");
  });
});

describe("property detail DTO security", () => {
  it("strips internals and respects HIDDEN address", () => {
    const hidden = getDemoPropertyRecord("demo-byt-2kk-nizka-cena")!;
    const dto = toPublicPropertyDto(hidden);
    expect(dto.location.addressLine).toBeNull();
    expect(dto.location.precision).toBe("HIDDEN");
    expect(JSON.stringify(dto)).not.toMatch(/Skrytá|canonicalKey|INTERNAL|ownerUserId|sourceId/i);
  });

  it("exposes exact street when not hidden and EXACT", () => {
    const vinohrady = getDemoPropertyRecord("demo-byt-3kk-vinohrady")!;
    const dto = toPublicPropertyDto(vinohrady);
    expect(dto.location.addressLine).toContain("Korunní");
    expect(dto.condition).toBe("GOOD");
    expect(dto.hasElevator).toBe(true);
    expect(dto.media.some((m) => m.restricted)).toBe(true);
  });

  it("IDOR: anonymous cannot load private slug via service", async () => {
    const privateB = getDemoPropertyRecord("demo-private-owner-b")!;
    expect(canViewProperty(privateB, {})).toBe(false);

    const repository: PropertyRepository = {
      findBySlug: async (slug) =>
        slug === privateB.slug ? privateB : null,
      findById: async () => null,
      search: async () => ({ items: [], hasMore: false }),
    };
    const service = createPropertyService({ repository });
    expect(await service.getPublicBySlug(privateB.slug, { viewer: {} })).toBeNull();
    expect(
      await service.getPublicBySlug(privateB.slug, {
        viewer: { userId: "user-b-owner", role: "USER" },
      }),
    ).not.toBeNull();
  });
});

describe("detail breadcrumbs and status", () => {
  it("builds Domů > Nemovitosti > Praha > Byt 3+kk", () => {
    const dto = toPublicPropertyDto(getDemoPropertyRecord("demo-byt-3kk-vinohrady")!);
    const crumbs = buildPropertyDetailBreadcrumbs(dto);
    expect(crumbs.map((c) => c.label)).toEqual([
      "Domů",
      "Nemovitosti",
      "Praha",
      "Byt 3+kk",
    ]);
  });

  it("maps unavailable and archived tones", () => {
    expect(propertyListingStatusTone("UNAVAILABLE")).toBe("unavailable");
    expect(propertyListingStatusTone("ARCHIVED")).toBe("archived");
    expect(propertyListingStatusTone("ACTIVE")).toBe("active");
  });
});
