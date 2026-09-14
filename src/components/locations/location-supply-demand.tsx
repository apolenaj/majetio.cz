import { MetricCard } from "@/components/data-display/metric-card";
import { Grid } from "@/components/ui/layout-primitives";
import type { LocationSupplyDemandProps } from "@/components/locations/types";

export function LocationSupplyDemand({ data, periodLabel }: LocationSupplyDemandProps) {
  const cards = [
    data.activeListings,
    data.medianDom,
    data.priceReductionRate,
    ...(data.rentTurnover ? [data.rentTurnover] : []),
  ];

  return (
    <Grid cols={4} className="gap-4">
      {cards.map((m) => (
        <MetricCard
          key={m.key}
          title={m.label}
          value={m.formattedValue}
          explanation={m.explanation ?? `${m.label} — ${periodLabel}`}
          quality={m.quality}
        />
      ))}
    </Grid>
  );
}
