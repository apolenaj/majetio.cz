import { describe, expect, it } from "vitest";

import type {
  LocationRecord,
  LocationRepository,
} from "@/domains/locations/service/location-repository";
import { LocationResolutionService } from "@/domains/locations/service/location-resolution-service";

function buildPrahaFixture(): Map<string, LocationRecord> {
  const cz: LocationRecord = {
    id: "loc_cz",
    type: "COUNTRY",
    parentId: null,
    countryCode: "CZ",
    name: "Česko",
    slug: "cz",
    publicLabel: "Česko",
    officialCode: "CZ",
    ruianCode: null,
    lauCode: null,
    nutsCode: "CZ",
    latitude: null,
    longitude: null,
    centroidLat: 49.8,
    centroidLon: 15.5,
    boundary: null,
  };

  const praha: LocationRecord = {
    id: "loc_praha",
    type: "CITY",
    parentId: "loc_cz",
    countryCode: "CZ",
    name: "Praha",
    slug: "praha",
    publicLabel: "Hlavní město Praha",
    officialCode: "554782",
    ruianCode: "554782",
    lauCode: "CZ0100",
    nutsCode: "CZ010",
    latitude: 50.0755,
    longitude: 14.4378,
    centroidLat: 50.0755,
    centroidLon: 14.4378,
    boundary: null,
  };

  const praha2: LocationRecord = {
    id: "loc_praha2",
    type: "CITY_DISTRICT",
    parentId: "loc_praha",
    countryCode: "CZ",
    name: "Praha 2",
    slug: "praha-2",
    publicLabel: "Praha 2",
    officialCode: null,
    ruianCode: null,
    lauCode: null,
    nutsCode: null,
    latitude: null,
    longitude: null,
    centroidLat: 50.075,
    centroidLon: 14.44,
    boundary: null,
  };

  const vinohrady: LocationRecord = {
    id: "loc_vinohrady",
    type: "NEIGHBORHOOD",
    parentId: "loc_praha2",
    countryCode: "CZ",
    name: "Vinohrady",
    slug: "vinohrady",
    publicLabel: "Vinohrady",
    officialCode: null,
    ruianCode: null,
    lauCode: null,
    nutsCode: null,
    latitude: 50.075,
    longitude: 14.45,
    centroidLat: 50.075,
    centroidLon: 14.45,
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [14.43, 50.07],
          [14.46, 50.07],
          [14.46, 50.08],
          [14.43, 50.08],
          [14.43, 50.07],
        ],
      ],
    },
  };

  return new Map([cz, praha, praha2, vinohrady].map((l) => [l.id, l]));
}

function inMemoryRepo(map: Map<string, LocationRecord>): LocationRepository {
  return {
    findById: async (id) => map.get(id) ?? null,
    findByOfficialCodes: async (input) => {
      for (const loc of map.values()) {
        if (loc.countryCode !== input.countryCode) continue;
        if (input.ruianCode && loc.ruianCode === input.ruianCode) return loc;
        if (input.officialCode && loc.officialCode === input.officialCode) {
          return loc;
        }
      }
      return null;
    },
    findByNameAndType: async (input) => {
      for (const loc of map.values()) {
        if (loc.countryCode !== input.countryCode) continue;
        if (loc.type !== input.type) continue;
        if (input.parentId !== undefined && (loc.parentId ?? null) !== input.parentId) {
          continue;
        }
        if (loc.name.toLowerCase() === input.name.toLowerCase()) return loc;
      }
      return null;
    },
    findWithBoundary: async (countryCode) =>
      [...map.values()].filter(
        (l) => l.countryCode === countryCode && l.boundary != null,
      ),
    findBySlug: async (slug) =>
      [...map.values()].find((l) => l.slug === slug) ?? null,
    findSiblings: async (locationId, limit = 6) => {
      const current = map.get(locationId);
      if (!current?.parentId) return [];
      return [...map.values()]
        .filter((l) => l.parentId === current.parentId && l.id !== locationId)
        .slice(0, limit);
    },
  };
}

describe("LocationResolutionService", () => {
  const map = buildPrahaFixture();
  const service = new LocationResolutionService({
    repository: inMemoryRepo(map),
  });

  it("assigns city level when only Praha is provided — not micro-location", async () => {
    const result = await service.resolveForProperty({
      countryCode: "CZ",
      cityName: "Praha",
    });

    expect(result.canonicalLocationId).toBe("loc_praha");
    expect(result.matchedType).toBe("CITY");
    expect(result.confidence).toBe("LOW");
    expect(result.hierarchy.some((h) => h.name === "Praha")).toBe(true);
  });

  it("resolves city district when explicitly provided", async () => {
    const result = await service.resolveForProperty({
      countryCode: "CZ",
      cityName: "Praha",
      cityDistrictName: "Praha 2",
    });

    expect(result.canonicalLocationId).toBe("loc_praha2");
    expect(result.matchedType).toBe("CITY_DISTRICT");
  });

  it("does not assign Vinohrady when only city Praha given", async () => {
    const result = await service.resolveForProperty({
      countryCode: "CZ",
      cityName: "Praha",
    });

    expect(result.canonicalLocationId).not.toBe("loc_vinohrady");
    expect(result.matchedType).not.toBe("NEIGHBORHOOD");
  });

  it("resolves by RUIAN code with EXACT confidence", async () => {
    const result = await service.resolveAddress({
      countryCode: "CZ",
      cityName: "Praha",
      ruianCode: "554782",
    });

    expect(result.canonicalLocationId).toBe("loc_praha");
    expect(result.confidence).toBe("EXACT");
  });

  it("returns UNKNOWN for unmatched input", async () => {
    const result = await service.resolveForProperty({
      countryCode: "CZ",
      cityName: "Nonexistentov",
    });

    expect(result.canonicalLocationId).toBeNull();
    expect(result.confidence).toBe("UNKNOWN");
  });

  it("GPS with city Praha only stays at CITY level", async () => {
    const result = await service.resolveForProperty({
      countryCode: "CZ",
      cityName: "Praha",
      latitude: 50.0755,
      longitude: 14.44,
    });

    expect(result.matchedType).toBe("CITY");
  });
});
