import type {
  LocationResolutionConfidence,
  LocationType,
} from "@prisma/client";

import type {
  AddressInput,
  LocationResolutionResult,
} from "@/domains/locations/schemas/address-input";
import {
  isCoarserOrEqual,
  isFinerType,
  locationTypeRank,
} from "@/domains/locations/types/hierarchy";
import {
  haversineDistanceMeters,
  isGeoJsonBoundary,
  pointInGeoJsonBoundary,
  type GeoPoint,
} from "@/domains/locations/service/geospatial";
import {
  inferMaxAssignableType,
  normalizeAddressInput,
  normalizeLocationName,
} from "@/domains/locations/service/normalize";
import type { LocationRecord, LocationRepository } from "@/domains/locations/service/location-repository";

export const LOCATION_RESOLVER_VERSION = "location-resolver.v2026.07";

export type LocationResolutionServiceDeps = {
  repository: LocationRepository;
};

export class LocationResolutionService {
  constructor(private readonly deps: LocationResolutionServiceDeps) {}

  async resolveAddress(raw: AddressInput): Promise<LocationResolutionResult> {
    const input = normalizeAddressInput(raw);
    const maxType = inferMaxAssignableType(input);
    const warnings: string[] = [];

    const byCode = await this.deps.repository.findByOfficialCodes({
      countryCode: input.countryCode,
      ruianCode: input.ruianCode,
      officialCode: input.officialCode,
      lauCode: input.lauCode,
      nutsCode: input.nutsCode,
    });

    if (byCode) {
      if (isFinerType(byCode.type, maxType)) {
        warnings.push(
          `Oficiální kód odkazuje na jemnější úroveň než textové vstupy — omezeno na ${maxType}.`,
        );
        const capped = await this.capToMaxType(byCode, maxType);
        if (!capped) {
          return this.unknownResult(warnings);
        }
        return this.finalize(capped, input.ruianCode ? "EXACT" : "HIGH", warnings);
      }
      return this.finalize(byCode, input.ruianCode ? "EXACT" : "HIGH", warnings);
    }

    const nameResult = await this.resolveByNames(input, maxType, warnings);

    let pointMatch: LocationRecord | null = null;
    if (input.latitude != null && input.longitude != null) {
      pointMatch = await this.findFinestContainingPoint(
        { latitude: input.latitude, longitude: input.longitude },
        input.countryCode,
        maxType,
      );
      if (pointMatch && isFinerType(pointMatch.type, maxType)) {
        warnings.push(
          "GPS spadá do jemnější lokality než dovolují textové vstupy — ignorováno.",
        );
        pointMatch = null;
      }
    }

    const chosen = this.pickBestCandidate(
      [nameResult.location, pointMatch],
      input,
      maxType,
    );

    if (!chosen) {
      return this.unknownResult([
        ...warnings,
        "Nebyla nalezena kanonická lokace.",
      ]);
    }

    const confidence = this.mergeConfidence(
      nameResult.confidence,
      pointMatch ? "HIGH" : "UNKNOWN",
      chosen,
      input,
    );

    return this.finalize(chosen, confidence, warnings);
  }

  /** Conservative property assignment — never inflate beyond input specificity. */
  async resolveForProperty(raw: AddressInput): Promise<LocationResolutionResult> {
    const result = await this.resolveAddress(raw);
    const maxType = inferMaxAssignableType(normalizeAddressInput(raw));

    if (
      result.matchedType &&
      isFinerType(result.matchedType, maxType)
    ) {
      return {
        ...result,
        canonicalLocationId: null,
        confidence: "LOW",
        matchedType: null,
        hierarchy: [],
        warnings: [
          ...result.warnings,
          "Automatické přiřazení jemnější lokality než vstup — odmítnuto.",
        ],
      };
    }

    return result;
  }

  private async finalize(
    location: LocationRecord,
    confidence: LocationResolutionConfidence,
    warnings: string[],
  ): Promise<LocationResolutionResult> {
    const hierarchy = await this.buildHierarchyChain(location.id);
    return {
      canonicalLocationId: location.id,
      confidence,
      matchedType: location.type,
      hierarchy,
      warnings,
      resolverVersion: LOCATION_RESOLVER_VERSION,
    };
  }

  private unknownResult(warnings: string[]): LocationResolutionResult {
    return {
      canonicalLocationId: null,
      confidence: "UNKNOWN",
      matchedType: null,
      hierarchy: [],
      warnings,
      resolverVersion: LOCATION_RESOLVER_VERSION,
    };
  }

  private async buildHierarchyChain(locationId: string) {
    const chain: LocationResolutionResult["hierarchy"] = [];
    let current = await this.deps.repository.findById(locationId);
    const seen = new Set<string>();

    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      chain.unshift({
        id: current.id,
        type: current.type,
        name: current.name,
        slug: current.slug,
        publicLabel: current.publicLabel,
      });
      if (!current.parentId) break;
      current = await this.deps.repository.findById(current.parentId);
    }

    return chain;
  }

  private async capToMaxType(
    location: LocationRecord,
    maxType: LocationType,
  ): Promise<LocationRecord | null> {
    if (isCoarserOrEqual(location.type, maxType)) return location;

    let current: LocationRecord | null = location;
    const seen = new Set<string>();
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      if (current.type === maxType) return current;
      if (isCoarserOrEqual(current.type, maxType)) return current;
      if (!current.parentId) return null;
      current = await this.deps.repository.findById(current.parentId);
    }
    return null;
  }

  private async findFinestContainingPoint(
    point: GeoPoint,
    countryCode: string,
    maxType: LocationType,
  ): Promise<LocationRecord | null> {
    const withBoundary = await this.deps.repository.findWithBoundary(countryCode);
    let best: LocationRecord | null = null;

    for (const loc of withBoundary) {
      if (!loc.boundary || !isGeoJsonBoundary(loc.boundary)) continue;
      if (!pointInGeoJsonBoundary(point, loc.boundary)) continue;
      if (isFinerType(loc.type, maxType)) continue;
      if (!best || locationTypeRank(loc.type) > locationTypeRank(best.type)) {
        best = loc;
      }
    }
    return best;
  }

  private async resolveByNames(
    input: ReturnType<typeof normalizeAddressInput>,
    maxType: LocationType,
    warnings: string[],
  ): Promise<{
    location: LocationRecord | null;
    confidence: LocationResolutionConfidence;
  }> {
    const steps: Array<{ type: LocationType; name: string | null | undefined }> =
      [
        { type: "REGION", name: input.regionName },
        { type: "DISTRICT", name: input.districtName },
        { type: "MUNICIPALITY", name: input.municipalityName },
        { type: "CITY", name: input.cityName },
        { type: "CITY_DISTRICT", name: input.cityDistrictName },
        { type: "NEIGHBORHOOD", name: input.neighborhoodName },
        { type: "MICRO_LOCATION", name: input.microLocationName },
      ];

    let parentId: string | null = null;
    let lastMatch: LocationRecord | null = null;
    let confidence: LocationResolutionConfidence = "UNKNOWN";

    for (const step of steps) {
      if (!step.name) continue;
      if (isFinerType(step.type, maxType)) break;

      const match = await this.deps.repository.findByNameAndType({
        countryCode: input.countryCode,
        type: step.type,
        name: step.name,
        parentId: parentId ?? undefined,
      });

      if (!match) {
        if (lastMatch) {
          warnings.push(`Neznámá úroveň ${step.type}: „${step.name}“.`);
        }
        break;
      }

      lastMatch = match;
      parentId = match.id;
      confidence =
        step.type === "MICRO_LOCATION"
          ? "HIGH"
          : step.type === "CITY_DISTRICT" || step.type === "NEIGHBORHOOD"
            ? "MEDIUM"
            : step.type === "CITY" || step.type === "MUNICIPALITY"
              ? "LOW"
              : "LOW";
    }

    return { location: lastMatch, confidence };
  }

  private pickBestCandidate(
    candidates: Array<LocationRecord | null>,
    input: ReturnType<typeof normalizeAddressInput>,
    maxType: LocationType,
  ): LocationRecord | null {
    const valid = candidates.filter(
      (c): c is LocationRecord =>
        c != null && isCoarserOrEqual(c.type, maxType),
    );
    if (valid.length === 0) return null;

    valid.sort((a, b) => locationTypeRank(b.type) - locationTypeRank(a.type));
    const best = valid[0]!;

    if (
      input.latitude != null &&
      input.longitude != null &&
      best.centroidLat != null &&
      best.centroidLon != null
    ) {
      const d = haversineDistanceMeters(
        { latitude: input.latitude, longitude: input.longitude },
        { latitude: best.centroidLat, longitude: best.centroidLon },
      );
      if (d > 50_000) {
        warningsPushFarCentroid();
        return valid.find((v) => v.id !== best.id) ?? best;
      }
    }

    return best;
  }

  private mergeConfidence(
    nameConfidence: LocationResolutionConfidence,
    pointConfidence: LocationResolutionConfidence,
    location: LocationRecord,
    input: ReturnType<typeof normalizeAddressInput>,
  ): LocationResolutionConfidence {
    if (input.street && input.houseNumber && input.ruianCode) return "EXACT";
    if (pointConfidence === "HIGH" && nameConfidence !== "UNKNOWN") return "HIGH";
    if (nameConfidence !== "UNKNOWN") return nameConfidence;
    if (input.latitude != null && location.centroidLat != null) return "MEDIUM";
    return "LOW";
  }
}

function warningsPushFarCentroid(): void {
  // Centroid far from GPS — prefer alternate candidate (logged in meta via caller if needed)
}

export function namesMatch(a: string, b: string): boolean {
  return normalizeLocationName(a) === normalizeLocationName(b);
}
