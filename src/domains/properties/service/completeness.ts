/**
 * Internal listing completeness metric (Prompt 7 Part 3).
 * Score 0–100 from weighted presence of key commercial fields.
 */

export type CompletenessPropertySnapshot = {
  askingPrice?: number | null;
  priceCzk?: number | null;
  usableArea?: number | null;
  floorArea?: number | null;
  areaSqm?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  publicCity?: string | null;
  publicLabel?: string | null;
  street?: string | null;
  title?: string | null;
  description?: string | null;
  propertyType?: string | null;
  layout?: string | null;
  disposition?: string | null;
  yearBuilt?: number | null;
  energyRating?: string | null;
  hasMedia?: boolean;
};

export type CompletenessDimension = {
  key: string;
  weight: number;
  filled: boolean;
};

export type CompletenessResult = {
  /** 0–100 */
  score: number;
  breakdown: CompletenessDimension[];
};

const DIMENSIONS: Array<{
  key: string;
  weight: number;
  filled: (p: CompletenessPropertySnapshot) => boolean;
}> = [
  {
    key: "price",
    weight: 20,
    filled: (p) => (p.askingPrice ?? p.priceCzk ?? 0) > 0,
  },
  {
    key: "area",
    weight: 20,
    filled: (p) => (p.usableArea ?? p.floorArea ?? p.areaSqm ?? 0) > 0,
  },
  {
    key: "location",
    weight: 20,
    filled: (p) =>
      (p.latitude != null && p.longitude != null) ||
      Boolean(p.publicCity?.trim()) ||
      Boolean(p.publicLabel?.trim()) ||
      Boolean(p.street?.trim()),
  },
  {
    key: "title",
    weight: 10,
    filled: (p) => Boolean(p.title?.trim()),
  },
  {
    key: "description",
    weight: 10,
    filled: (p) => Boolean(p.description?.trim() && p.description.trim().length >= 40),
  },
  {
    key: "propertyType",
    weight: 5,
    filled: (p) => Boolean(p.propertyType?.trim()),
  },
  {
    key: "layout",
    weight: 5,
    filled: (p) => Boolean(p.layout?.trim() || p.disposition?.trim()),
  },
  {
    key: "building",
    weight: 5,
    filled: (p) => p.yearBuilt != null || Boolean(p.energyRating?.trim()),
  },
  {
    key: "media",
    weight: 5,
    filled: (p) => p.hasMedia === true,
  },
];

export function computeCompletenessScore(
  property: CompletenessPropertySnapshot,
): CompletenessResult {
  const breakdown: CompletenessDimension[] = DIMENSIONS.map((d) => ({
    key: d.key,
    weight: d.weight,
    filled: d.filled(property),
  }));

  const earned = breakdown.reduce((sum, d) => sum + (d.filled ? d.weight : 0), 0);
  const total = breakdown.reduce((sum, d) => sum + d.weight, 0);
  const score = total === 0 ? 0 : Math.round((earned / total) * 1000) / 10;

  return { score, breakdown };
}
