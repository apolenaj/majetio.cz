import { MetricCard } from "@/components/data-display/metric-card";
import { Grid } from "@/components/ui/layout-primitives";
import type { LocationMarketSummaryProps } from "@/components/locations/types";

export function LocationMarketSummary({
  metrics,
  periodLabel,
  source,
  updatedAt,
}: LocationMarketSummaryProps) {
  return (
    <Grid cols={4} className="gap-4">
      {metrics.map((m) => (
        <MetricCard
          key={m.key}
          title={m.label}
          value={m.formattedValue}
          explanation={`${m.label} — ${periodLabel}. ${m.sampleCount ? `Vzorek: ${m.sampleCount}.` : ""}`}
          trend={m.trend}
          changeLabel={m.changeLabel}
          quality={m.quality}
          source={source}
          updatedAt={updatedAt}
        />
      ))}
    </Grid>
  );
}
