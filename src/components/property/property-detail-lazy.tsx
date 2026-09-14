"use client";

import dynamic from "next/dynamic";

import { LoadingSkeleton } from "@/components/feedback/states";
import type { PublicPropertyLocation } from "@/domains/properties/service/dto";
import type { LocationBenchmarkDemo } from "@/content/demo-property-context";
import type { CashFlowWaterfallDemo } from "@/content/demo-property-financial";
import type { PublicPriceHistoryPoint } from "@/domains/properties/service/dto";

const PropertyLocationSection = dynamic(
  () =>
    import("@/components/property/property-location-section").then(
      (m) => m.PropertyLocationSection,
    ),
  {
    loading: () => <LoadingSkeleton lines={6} />,
    ssr: true,
  },
);

const PropertyCashFlowWaterfall = dynamic(
  () =>
    import("@/components/property/property-cash-flow-waterfall").then(
      (m) => m.PropertyCashFlowWaterfall,
    ),
  {
    loading: () => <LoadingSkeleton lines={5} />,
    ssr: true,
  },
);

const PropertyMarketHistorySection = dynamic(
  () =>
    import("@/components/property/property-market-history-section").then(
      (m) => m.PropertyMarketHistorySection,
    ),
  {
    loading: () => <LoadingSkeleton lines={6} />,
    ssr: true,
  },
);

import type { PropertySegmentBenchmark } from "@/domains/locations/integration/types";
import type { MarketOpportunityInsight } from "@/domains/locations/integration/market-opportunity-insight";
import type { LocationMarketContextBlock } from "@/domains/locations/integration/market-context";
import type { LocationStrRegulatoryBundle } from "@/domains/locations/integration/str-regulatory-context";

export function LazyPropertyLocationSection(props: {
  location: PublicPropertyLocation;
  benchmark?: LocationBenchmarkDemo | null;
  segmentBenchmark?: PropertySegmentBenchmark | null;
  locationPageHref?: string | null;
  opportunityInsight?: MarketOpportunityInsight | null;
  marketContext?: LocationMarketContextBlock | null;
  strRegulatory?: LocationStrRegulatoryBundle | null;
  watchSlug?: string | null;
}) {
  return <PropertyLocationSection {...props} />;
}

export function LazyCashFlowWaterfall(props: {
  waterfall: CashFlowWaterfallDemo | null;
}) {
  return <PropertyCashFlowWaterfall {...props} />;
}

export function LazyPropertyMarketHistorySection(props: {
  points: PublicPriceHistoryPoint[];
  daysOnMarket: number | null;
  relisted: boolean;
  relistNote: string | null;
  publishedAt: string | null;
}) {
  return <PropertyMarketHistorySection {...props} />;
}
