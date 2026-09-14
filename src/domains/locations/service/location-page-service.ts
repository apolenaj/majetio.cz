/**
 * Loads location page profiles — DB when available, demo profiles as fallback.
 */

import type { LocationType } from "@prisma/client";

import {
  INDEXABLE_LOCATION_SLUGS,
  LOCATION_DEMO_PROFILES,
} from "@/domains/locations/content/demo-profiles";
import { isDemoPropertyContentAllowed } from "@/lib/demo-content-gate";
import { decodeSegmentKey } from "@/domains/locations/metrics/segment";
import { createLocationMetricService } from "@/domains/locations/service/location-metric-service";
import {
  createPrismaLocationRepository,
  type LocationRecord,
} from "@/domains/locations/service/location-repository";
import { haversineDistanceMeters } from "@/domains/locations/service/geospatial";
import type {
  LocationComparisonData,
  LocationComparisonRow,
  LocationNeighbor,
  LocationPageProfile,
  LocationSegmentOption,
} from "@/domains/locations/types/location-page";
import { formatCzk, formatPercentPoints } from "@/lib/format";

function hierarchyLabel(record: LocationRecord): string {
  const typeLabels: Partial<Record<LocationType, string>> = {
    CITY: "Město",
    CITY_DISTRICT: "Městská část",
    NEIGHBORHOOD: "Čtvrť",
    MUNICIPALITY: "Obec",
    DISTRICT: "Okres",
    REGION: "Kraj",
  };
  return typeLabels[record.type] ?? record.type;
}

function demoNeighborsFor(slug: string): LocationNeighbor[] {
  return LOCATION_DEMO_PROFILES[slug]?.neighbors ?? [];
}

function dbNeighbors(
  record: LocationRecord,
  siblings: LocationRecord[],
): LocationNeighbor[] {
  const fromSiblings: LocationNeighbor[] = siblings.map((s) => ({
    slug: s.slug,
    name: s.name,
    publicLabel: s.publicLabel ?? s.name,
    relation: "sibling" as const,
  }));

  if (fromSiblings.length > 0) return fromSiblings.slice(0, 6);
  return demoNeighborsFor(record.slug);
}

function dbProfileFromRecord(record: LocationRecord): LocationPageProfile | null {
  const demo = LOCATION_DEMO_PROFILES[record.slug];
  if (!demo) return null;
  return {
    ...demo,
    location: {
      ...demo.location,
      id: record.id,
      slug: record.slug,
      name: record.name,
      publicLabel: record.publicLabel ?? record.name,
      type: record.type,
      hierarchyLabel: hierarchyLabel(record),
      searchLokalita: record.publicLabel ?? record.name,
      canonicalPath: demo.location.canonicalPath,
      pathSegments: demo.location.pathSegments,
    },
    /**
     * Keep isDemo=true until enrichProfileWithDbMetrics replaces synthetic
     * metrics with production LocationMetric rows. Never present demo numbers as live.
     */
    isDemo: demo.isDemo,
  };
}

export async function loadLocationPageProfile(
  slug: string,
): Promise<LocationPageProfile | null> {
  try {
    const repo = createPrismaLocationRepository();
    const record = await repo.findBySlug(slug);

    if (record) {
      const siblings = await repo.findSiblings(record.id);
      const demoMerge = dbProfileFromRecord(record);
      if (demoMerge) {
        return {
          ...demoMerge,
          neighbors: dbNeighbors(record, siblings),
        };
      }
    }
  } catch {
    // DB down / misconfigured — never 500 property detail.
    // Production: fail closed (no silent demo medians). Dev/staging hatch may use demo.
  }

  if (!isDemoPropertyContentAllowed()) {
    return null;
  }

  const demo = LOCATION_DEMO_PROFILES[slug];
  if (demo) return demo;

  return null;
}

export function listComparableLocationSlugs(): string[] {
  return INDEXABLE_LOCATION_SLUGS;
}

function formatMetricValue(key: string, value: number | null, unit: string): string {
  if (value == null) return "—";
  if (unit.includes("Kč/m²") && !unit.includes("měs")) return formatCzk(value).replace(/\s?Kč$/, " Kč/m²");
  if (unit === "Kč/m²/měs." || unit.includes("měs")) return `${Math.round(value)} Kč/m²/měs.`;
  if (unit.includes("%")) return formatPercentPoints(value);
  if (unit === "dní") return `${Math.round(value)} dní`;
  if (unit === "ks") return new Intl.NumberFormat("cs-CZ").format(Math.round(value));
  if (unit === "podíl") return formatPercentPoints(value * 100);
  return String(Math.round(value * 10) / 10);
}

function pickSegment(
  profile: LocationPageProfile,
  segmentKey: string,
): LocationSegmentOption {
  return (
    profile.segments.find((s) => s.key === segmentKey) ??
    profile.segments[0]!
  );
}

export async function loadLocationComparison(input: {
  slugs: string[];
  segmentKey?: string;
}): Promise<LocationComparisonData | null> {
  const unique = [...new Set(input.slugs.map((s) => s.trim().toLowerCase()))].slice(
    0,
    3,
  );
  if (unique.length < 2) return null;

  const profiles = (
    await Promise.all(unique.map((slug) => loadLocationPageProfile(slug)))
  ).filter((p): p is LocationPageProfile => p != null);

  if (profiles.length < 2) return null;

  const segmentKey =
    input.segmentKey ?? profiles[0]!.defaultSegmentKey;
  const segment = pickSegment(profiles[0]!, segmentKey);
  const periodLabel = profiles[0]!.periodLabel;

  const rowDefs: {
    key: string;
    label: string;
    unit: string;
    pick: (p: LocationPageProfile) => number | null;
  }[] = [
    {
      key: "asking",
      label: "Medián nabídky",
      unit: "Kč/m²",
      pick: (p) => {
        const pts = p.priceHistoryBySegment[segmentKey]?.asking?.points;
        return pts?.at(-1)?.value ?? null;
      },
    },
    {
      key: "transaction",
      label: "Medián transakcí",
      unit: "Kč/m²",
      pick: (p) => {
        const pts = p.priceHistoryBySegment[segmentKey]?.transaction?.points;
        return pts?.at(-1)?.value ?? null;
      },
    },
    {
      key: "rent",
      label: "Medián nájmu",
      unit: "Kč/m²/měs.",
      pick: (p) => p.rentHistoryBySegment[segmentKey]?.points.at(-1)?.value ?? null,
    },
    {
      key: "yield",
      label: "Hrubý výnos",
      unit: "%",
      pick: (p) => p.investment.grossYield.value,
    },
    {
      key: "dom",
      label: "Medián DOM",
      unit: "dní",
      pick: (p) => p.supplyDemand.medianDom.value,
    },
    {
      key: "transit",
      label: "Doprava",
      unit: "index",
      pick: (p) => p.transport.transitScore.value,
    },
  ];

  const rows: LocationComparisonRow[] = rowDefs.map((def) => ({
    metricKey: def.key,
    label: def.label,
    unit: def.unit,
    values: profiles.map((p) => formatMetricValue(def.key, def.pick(p), def.unit)),
  }));

  return {
    segment,
    periodLabel,
    methodologyHref: profiles[0]!.methodologyHref,
    locations: profiles.map((p) => ({
      slug: p.location.slug,
      name: p.location.name,
      publicLabel: p.location.publicLabel,
    })),
    rows,
  };
}

export function segmentLabelFromKey(key: string): string {
  const seg = decodeSegmentKey(key);
  const parts: string[] = [];
  if (seg.propertyType && seg.propertyType !== "ALL") {
    const map: Record<string, string> = {
      APARTMENT: "Byt",
      HOUSE: "Dům",
      LAND: "Pozemek",
      COMMERCIAL: "Komerční",
    };
    parts.push(map[seg.propertyType] ?? seg.propertyType);
  }
  if (seg.layout && seg.layout !== "ALL") parts.push(seg.layout);
  if (seg.marketAge === "new_build") parts.push("novostavba");
  if (seg.marketAge === "secondary") parts.push("secondary");
  return parts.join(" · ") || "Všechny segmenty";
}

export function findNearbyByCentroid(
  origin: LocationRecord,
  candidates: LocationRecord[],
  maxMeters = 50_000,
  limit = 6,
): LocationNeighbor[] {
  const lat = origin.centroidLat ?? origin.latitude;
  const lon = origin.centroidLon ?? origin.longitude;
  if (lat == null || lon == null) return [];

  return candidates
    .filter((c) => c.id !== origin.id)
    .map((c) => {
      const clat = c.centroidLat ?? c.latitude;
      const clon = c.centroidLon ?? c.longitude;
      if (clat == null || clon == null) return null;
      const distance = haversineDistanceMeters(
        { latitude: lat, longitude: lon },
        { latitude: clat, longitude: clon },
      );
      return { c, distance };
    })
    .filter((x): x is { c: LocationRecord; distance: number } => x != null)
    .filter((x) => x.distance <= maxMeters)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ c }) => ({
      slug: c.slug,
      name: c.name,
      publicLabel: c.publicLabel ?? c.name,
      relation: "nearby" as const,
    }));
}

/** Reserved for future DB-backed metrics overlay. */
export async function enrichProfileWithDbMetrics(
  profile: LocationPageProfile,
): Promise<LocationPageProfile> {
  const metricService = createLocationMetricService();
  const metrics = await metricService.getDisplayableMetrics({
    locationId: profile.location.id,
  });
  if (metrics.length === 0) return profile;
  return profile;
}
