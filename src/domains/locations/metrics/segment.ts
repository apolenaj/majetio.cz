import type { PropertyCondition, PropertyType } from "@prisma/client";

export type MarketAgeSegment = "new_build" | "secondary" | "unknown";

export type LocationMetricSegment = {
  propertyType?: PropertyType | "ALL";
  marketAge?: MarketAgeSegment;
  layout?: string | "ALL";
};

export const SEGMENT_ALL_KEY = "_all" as const;

export function encodeSegmentKey(segment: LocationMetricSegment): string {
  const parts: string[] = [];
  parts.push(`pt:${segment.propertyType ?? "ALL"}`);
  parts.push(`age:${segment.marketAge ?? "unknown"}`);
  parts.push(`lay:${normalizeLayout(segment.layout)}`);
  return parts.join("|");
}

export function decodeSegmentKey(segmentKey: string): LocationMetricSegment {
  if (segmentKey === SEGMENT_ALL_KEY) {
    return { propertyType: "ALL", marketAge: "unknown", layout: "ALL" };
  }
  const segment: LocationMetricSegment = {};
  for (const part of segmentKey.split("|")) {
    const [k, v] = part.split(":");
    if (k === "pt" && v) segment.propertyType = v as PropertyType | "ALL";
    if (k === "age" && v) segment.marketAge = v as MarketAgeSegment;
    if (k === "lay" && v) segment.layout = v === "ALL" ? "ALL" : v;
  }
  return segment;
}

export function normalizeLayout(layout: string | undefined | "ALL"): string {
  if (!layout || layout === "ALL") return "ALL";
  return layout.toLowerCase().replace(/\s+/g, "").replace("++", "+");
}

export function inferMarketAge(condition: PropertyCondition): MarketAgeSegment {
  if (condition === "NEW") return "new_build";
  if (condition === "UNKNOWN") return "unknown";
  return "secondary";
}
