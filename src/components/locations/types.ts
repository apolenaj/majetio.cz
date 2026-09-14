export type {
  LocationSegmentOption,
  LocationMetricDisplay,
  LocationTimeSeries,
  LocationPriceHistory,
  LocationNeighbor,
  LocationSupplyDemand,
  LocationInvestmentBlock,
  LocationTransportAmenities,
  LocationDevelopmentBlock,
  LocationPageProfile,
  LocationComparisonRow,
  LocationComparisonData,
} from "@/domains/locations/types/location-page";

export type LocationSectionProps = {
  id: string;
  title: string;
  description?: string;
  period?: string;
  methodologyHref?: string;
  children: React.ReactNode;
  className?: string;
};

export type LocationHeroProps = {
  name: string;
  hierarchyLabel: string;
  summary: string;
  periodLabel: string;
  isDemo?: boolean;
  strategySlugs?: string[];
};

export type LocationMarketSummaryProps = {
  metrics: import("@/domains/locations/types/location-page").LocationMetricDisplay[];
  periodLabel: string;
  source: string;
  updatedAt: string;
};

export type LocationChartSeries = {
  key: string;
  label: string;
  color?: string;
  points: { label: string; value: number }[];
};

export type LocationPriceTrendsProps = {
  segments: import("@/domains/locations/types/location-page").LocationSegmentOption[];
  defaultSegmentKey: string;
  priceHistoryBySegment: Record<
    string,
    import("@/domains/locations/types/location-page").LocationPriceHistory
  >;
  rentHistoryBySegment: Record<
    string,
    import("@/domains/locations/types/location-page").LocationTimeSeries
  >;
  periodLabel: string;
  source: string;
  updatedAt: string;
  methodologyHref: string;
};

export type LocationSupplyDemandProps = {
  data: import("@/domains/locations/types/location-page").LocationSupplyDemand;
  periodLabel: string;
};

export type LocationInvestmentProps = {
  data: import("@/domains/locations/types/location-page").LocationInvestmentBlock;
  periodLabel: string;
  methodologyHref: string;
};

export type LocationTransportProps = {
  data: import("@/domains/locations/types/location-page").LocationTransportAmenities;
  periodLabel: string;
};

export type LocationDevelopmentProps = {
  data: import("@/domains/locations/types/location-page").LocationDevelopmentBlock;
  periodLabel: string;
};

export type LocationRisksProps = {
  risks: import("@/domains/locations/types/location-page").LocationPageProfile["risks"];
};

export type LocationNeighborsProps = {
  neighbors: import("@/domains/locations/types/location-page").LocationNeighbor[];
  currentSlug: string;
};

export type LocationAvailablePropertiesProps = {
  searchLokalita: string;
  cards: import("@/components/property/property-card").PropertyCardData[];
  totalCount: number;
};

export type LocationComparisonClientProps = {
  availableSlugs: { slug: string; name: string }[];
  initialSlugs: string[];
  initialSegmentKey: string;
  segments: import("@/domains/locations/types/location-page").LocationSegmentOption[];
  comparison: import("@/domains/locations/types/location-page").LocationComparisonData | null;
  /** LocationMatchScore overall (0–100) keyed by slug — from Finanční pas. */
  matchScores?: Record<string, number> | null;
  passportGoalLabel?: string | null;
};
