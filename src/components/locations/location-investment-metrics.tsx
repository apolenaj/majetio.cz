import Link from "next/link";

import { MetricCard } from "@/components/data-display/metric-card";
import { Card } from "@/components/ui/card";
import type { LocationInvestmentProps } from "@/components/locations/types";

export function LocationInvestmentMetrics({
  data,
  periodLabel,
  methodologyHref,
}: LocationInvestmentProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <MetricCard
        title={data.grossYield.label}
        value={data.grossYield.formattedValue}
        explanation={`Hrubý roční nájem / nabídková cena. ${periodLabel}.`}
        quality={data.grossYield.quality}
      />
      <Card padding="md">
        <h3 className="font-display text-lg text-[var(--text-primary)]">Investiční kontext</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
          {data.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Výnos je orientační — nepočítá provozní náklady ani daně.{" "}
          <Link href={methodologyHref} className="text-[var(--text-link)] hover:underline">
            Metodika
          </Link>
        </p>
      </Card>
    </div>
  );
}
