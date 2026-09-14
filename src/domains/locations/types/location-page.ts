import type { LocationType } from "@prisma/client";

/** Segment option for charts and normalized comparison. */
export type LocationSegmentOption = {
  key: string;
  label: string;
  propertyType: "APARTMENT" | "HOUSE" | "LAND" | "ALL";
};

export type LocationMetricDisplay = {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  formattedValue: string;
  period: string;
  sampleCount?: number;
  confidence?: number;
  trend?: "up" | "down" | "flat";
  changeLabel?: string;
  explanation?: string;
  quality?: "verified" | "estimated" | "incomplete";
};

export type LocationTimeSeries = {
  points: { label: string; value: number }[];
  period: string;
  source: string;
  sampleCount?: number;
};

export type LocationPriceHistory = {
  asking?: LocationTimeSeries;
  transaction?: LocationTimeSeries;
};

export type LocationNeighbor = {
  slug: string;
  name: string;
  publicLabel: string;
  relation: "sibling" | "nearby" | "parent";
  medianPriceSqm?: number | null;
  medianRentSqm?: number | null;
};

export type LocationSupplyDemand = {
  activeListings: LocationMetricDisplay;
  medianDom: LocationMetricDisplay;
  priceReductionRate: LocationMetricDisplay;
  rentTurnover?: LocationMetricDisplay;
};

export type LocationInvestmentBlock = {
  grossYield: LocationMetricDisplay;
  highlights: string[];
};

export type LocationTransportAmenities = {
  transitScore: LocationMetricDisplay;
  amenities: { label: string; value: string; note?: string }[];
};

export type LocationDevelopmentBlock = {
  unitsUnderConstruction: LocationMetricDisplay;
  pipelineNote: string;
  highlights: string[];
};

export type LocationPageProfile = {
  location: {
    id: string;
    slug: string;
    name: string;
    publicLabel: string;
    type: LocationType;
    hierarchyLabel: string;
    searchLokalita: string;
    /**
     * Canonical public path, e.g. `/lokality/praha/vinohrady`.
     * Always prefer this over flat aliases to avoid duplicate SEO URLs.
     */
    canonicalPath: string;
    /** Path segments under /lokality, e.g. ["praha","vinohrady"]. */
    pathSegments: string[];
  };
  heroSummary: string;
  periodLabel: string;
  methodologyVersion: string;
  methodologyHref: string;
  source: string;
  updatedAt: string;
  isDemo: boolean;
  segments: LocationSegmentOption[];
  defaultSegmentKey: string;
  summary: LocationMetricDisplay[];
  priceHistoryBySegment: Record<string, LocationPriceHistory>;
  rentHistoryBySegment: Record<string, LocationTimeSeries>;
  supplyDemand: LocationSupplyDemand;
  investment: LocationInvestmentBlock;
  transport: LocationTransportAmenities;
  development: LocationDevelopmentBlock;
  risks: { title: string; description: string; level: "low" | "medium" | "high" }[];
  neighbors: LocationNeighbor[];
  strategySlugs: string[];
  /** Related guide article slugs for internal linking. */
  guideSlugs?: string[];
  /**
   * Cross-sectional quartile bands per segment — required for purchase/rent percentiles.
   * Omit when unknown; never invent from stereotypes.
   */
  segmentDistributions?: Record<
    string,
    {
      askingPriceSqm?: {
        p25: number;
        p50: number;
        p75: number;
        sampleCount: number;
        confidence: number;
      };
      rentSqm?: {
        p25: number;
        p50: number;
        p75: number;
        sampleCount: number;
        confidence: number;
      };
    }
  >;
  /** Explicit seasonality tags — only when sourced. */
  seasonalityContext?: {
    available: boolean;
    drivers: Array<"students" | "tourism" | "other">;
    note: string | null;
  };
  shortTermRentalContext?: {
    available: boolean;
    tourismDemandIndex: number | null;
    estimatedOccupancyPct: number | null;
    period?: string;
    source: string | null;
    sampleCount: number | null;
  };
  regulatoryContext?: {
    available: boolean;
    shortTermRentalLevel: "none" | "limited" | "restricted" | "unknown";
    summary: string | null;
    source: string | null;
    effectiveFrom: string | null;
  };
};

export type LocationComparisonRow = {
  metricKey: string;
  label: string;
  unit: string;
  values: (string | null)[];
};

export type LocationComparisonData = {
  segment: LocationSegmentOption;
  periodLabel: string;
  methodologyHref: string;
  locations: Pick<
    LocationPageProfile["location"],
    "slug" | "name" | "publicLabel"
  >[];
  rows: LocationComparisonRow[];
};
