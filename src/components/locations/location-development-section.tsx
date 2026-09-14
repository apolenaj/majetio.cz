import { MetricCard } from "@/components/data-display/metric-card";
import { Card } from "@/components/ui/card";
import type { LocationDevelopmentProps } from "@/components/locations/types";

export function LocationDevelopmentSection({ data, periodLabel }: LocationDevelopmentProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_1fr]">
      <MetricCard
        title={data.unitsUnderConstruction.label}
        value={data.unitsUnderConstruction.formattedValue}
        explanation={`${data.unitsUnderConstruction.label} — ${periodLabel}.`}
      />
      <Card padding="md">
        <p className="text-sm text-[var(--text-secondary)]">{data.pipelineNote}</p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
          {data.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
