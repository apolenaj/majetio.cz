/**
 * Search market filters — only when data coverage sufficient.
 */

import type { SearchableListing } from "@/domains/properties/search/apply-filters";
import type {
  MarketFilterCoverage,
  SearchMarketFilterState,
} from "@/domains/locations/integration/types";
import type { PropertyUrlFilterState } from "@/domains/properties/search/url-state";

export const CENOVA_HLADINA_OPTIONS = [
  { value: "pod-trhem", label: "Pod mediánem lokality" },
  { value: "v-trhu", label: "Blízko mediánu (±5 %)" },
  { value: "nad-trhem", label: "Nad mediánem lokality" },
] as const;

export const VYNOS_BENCHMARK_OPTIONS = [
  { value: "nad-benchmarkem", label: "Výnos nad lokálním benchmarkem" },
  { value: "pod-benchmarkem", label: "Výnos pod benchmarkem" },
] as const;

export const CENOVY_TREND_OPTIONS = [
  { value: "rostouci", label: "Rostoucí trend (YoY)" },
  { value: "klesajici", label: "Klesající trend (YoY)" },
  { value: "stabilni", label: "Stabilní (±1 % YoY)" },
] as const;

export type ListingMarketOverlay = {
  listingId: string;
  localMedianPriceSqm: number | null;
  priceVsMedianPct: number | null;
  localGrossYieldPct: number | null;
  yieldVsBenchmarkPct: number | null;
  priceTrendYoYPct: number | null;
  coverage: MarketFilterCoverage;
};

const MIN_COVERAGE_RATIO = 0.4;

export function assessMarketFilterCoverage(
  overlays: ListingMarketOverlay[],
): MarketFilterCoverage {
  if (overlays.length === 0) {
    return {
      priceBand: false,
      yieldBenchmark: false,
      priceTrend: false,
      reason: "Žádné listingy k filtrování.",
    };
  }

  const withPrice = overlays.filter((o) => o.localMedianPriceSqm != null).length;
  const withYield = overlays.filter((o) => o.localGrossYieldPct != null).length;
  const withTrend = overlays.filter((o) => o.priceTrendYoYPct != null).length;
  const ratio = (n: number) => n / overlays.length >= MIN_COVERAGE_RATIO;

  return {
    priceBand: ratio(withPrice),
    yieldBenchmark: ratio(withYield),
    priceTrend: ratio(withTrend),
    reason:
      !ratio(withPrice) && !ratio(withYield)
        ? "Tržní filtry vyžadují alespoň 40 % listingů s lokálním benchmarkem."
        : undefined,
  };
}

export function parseMarketFilters(
  state: PropertyUrlFilterState & SearchMarketFilterState,
): SearchMarketFilterState {
  return {
    cenovaHladina: state.cenovaHladina,
    vynosVsBenchmark: state.vynosVsBenchmark,
    cenovyTrend: state.cenovyTrend,
  };
}

export function applyMarketFilters(
  listings: SearchableListing[],
  overlays: Map<string, ListingMarketOverlay>,
  filters: SearchMarketFilterState,
  coverage: MarketFilterCoverage,
): SearchableListing[] {
  let items = listings;

  if (filters.cenovaHladina && coverage.priceBand) {
    items = items.filter((p) => {
      const o = overlays.get(p.id);
      if (o?.priceVsMedianPct == null) return true;
      const pct = o.priceVsMedianPct;
      if (filters.cenovaHladina === "pod-trhem") return pct < -2;
      if (filters.cenovaHladina === "v-trhu") return Math.abs(pct) <= 5;
      if (filters.cenovaHladina === "nad-trhem") return pct > 2;
      return true;
    });
  }

  if (filters.vynosVsBenchmark && coverage.yieldBenchmark) {
    items = items.filter((p) => {
      const o = overlays.get(p.id);
      if (o?.yieldVsBenchmarkPct == null) return true;
      if (filters.vynosVsBenchmark === "nad-benchmarkem") return o.yieldVsBenchmarkPct > 0;
      if (filters.vynosVsBenchmark === "pod-benchmarkem") return o.yieldVsBenchmarkPct < 0;
      return true;
    });
  }

  if (filters.cenovyTrend && coverage.priceTrend) {
    items = items.filter((p) => {
      const o = overlays.get(p.id);
      if (o?.priceTrendYoYPct == null) return true;
      const t = o.priceTrendYoYPct;
      if (filters.cenovyTrend === "rostouci") return t > 1;
      if (filters.cenovyTrend === "klesajici") return t < -1;
      if (filters.cenovyTrend === "stabilni") return Math.abs(t) <= 1;
      return true;
    });
  }

  return items;
}

export function serializeMarketFilters(
  filters: SearchMarketFilterState,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (filters.cenovaHladina) out["cenova-hladina"] = filters.cenovaHladina;
  if (filters.vynosVsBenchmark) out["vynos-benchmark"] = filters.vynosVsBenchmark;
  if (filters.cenovyTrend) out["cenovy-trend"] = filters.cenovyTrend;
  return out;
}

export function parseMarketFilterParams(
  params: Record<string, string | string[] | undefined>,
): SearchMarketFilterState {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  return {
    cenovaHladina: first(params["cenova-hladina"]),
    vynosVsBenchmark: first(params["vynos-benchmark"]),
    cenovyTrend: first(params["cenovy-trend"]),
  };
}
