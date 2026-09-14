import { MetricCard } from "@/components/data-display/metric-card";
import { Card } from "@/components/ui/card";
import { Grid } from "@/components/ui/layout-primitives";
import type { LocationTransportProps } from "@/components/locations/types";

export function LocationTransportAmenities({ data, periodLabel }: LocationTransportProps) {
  return (
    <div className="space-y-6">
      <MetricCard
        title={data.transitScore.label}
        value={data.transitScore.formattedValue}
        explanation={`Index dopravní dostupnosti. ${periodLabel}.`}
        quality={data.transitScore.quality}
        className="max-w-sm"
      />
      <Grid cols={2} className="gap-4">
        {data.amenities.map((item) => (
          <Card key={item.label} padding="md" elevation="flat">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              {item.label}
            </p>
            <p className="mt-1 font-medium text-[var(--text-primary)]">{item.value}</p>
            {item.note ? (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.note}</p>
            ) : null}
          </Card>
        ))}
      </Grid>
    </div>
  );
}
