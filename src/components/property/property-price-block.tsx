import { formatCzk, formatCzkPerSqm } from "@/lib/format";
import type { PublicPriceHistoryPoint } from "@/domains/properties/service/dto";
import { derivePriceDecrease } from "@/domains/properties/service/price-change";
import { MetricValue } from "@/components/data-display/metric-card";
import { DataSourceBadge } from "@/components/trust";
import { cn } from "@/lib/utils";

export function PropertyPriceBlock({
  askingPrice,
  pricePerSqm,
  priceHistory,
  className,
  compact = false,
}: {
  askingPrice: number | null;
  pricePerSqm: number | null;
  priceHistory: PublicPriceHistoryPoint[];
  className?: string;
  compact?: boolean;
}) {
  const decrease = derivePriceDecrease(priceHistory, askingPrice);

  return (
    <div className={cn(className)}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
          Nabídková cena
        </p>
        <DataSourceBadge kind="source_record" size="sm" />
      </div>
      <MetricValue
        size={compact ? "l" : "xl"}
        value={askingPrice != null ? formatCzk(askingPrice) : "Cena neuvedena"}
      />
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {pricePerSqm != null ? formatCzkPerSqm(pricePerSqm) : "Kč/m² neuvedeno"}
      </p>

      {decrease ? (
        <p className="mt-3 text-sm text-[var(--investment-positive)]">
          <span className="text-[var(--text-muted)] line-through">
            Původně {formatCzk(decrease.previousAmount)}
          </span>
          <span className="mx-2 text-[var(--text-muted)]">|</span>
          <span className="font-metric font-semibold">
            {formatCzk(decrease.deltaAmount, { signed: true })} /{" "}
            {decrease.deltaPercent.toLocaleString("cs-CZ", {
              maximumFractionDigits: 1,
              minimumFractionDigits: 1,
              signDisplay: "exceptZero",
            })}{" "}
            %
          </span>
        </p>
      ) : null}
    </div>
  );
}
