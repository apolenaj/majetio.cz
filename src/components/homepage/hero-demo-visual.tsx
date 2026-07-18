import { Badge, DataQualityBadge } from "@/components/ui/badge";
import { MetricValue } from "@/components/data-display/metric-card";
import { homepageContent } from "@/content/homepage";
import { homepageDemoAnalysis } from "@/data/demo/homepage-analysis";
import { formatCzk, formatPercentPoints } from "@/lib/format";

/**
 * Product visual for the hero — clearly labelled demo / illustrative data.
 */
export function HeroDemoVisual() {
  const demo = homepageDemoAnalysis;
  const copy = homepageContent.demoVisual;

  return (
    <aside
      className="motion-fade-in w-full min-w-0 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-raised)] sm:p-6"
      data-demo="true"
      data-is-demo={String(demo.isDemo)}
      aria-label={demo.label}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="premium">{copy.badge}</Badge>
        <DataQualityBadge quality="estimated" />
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">{copy.disclaimer}</p>

      <h2 className="mt-4 font-display text-xl text-[var(--text-primary)]">
        {demo.propertyTitle}
      </h2>
      <p className="text-sm text-[var(--text-secondary)]">
        {demo.locationLabel}
        {demo.disposition ? ` · ${demo.disposition}` : null}
        {demo.areaSqm ? ` · ${demo.areaSqm} m²` : null}
      </p>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Rozměry analýzy">
        {demo.dimensions.map((dim) => (
          <li
            key={dim.id}
            className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--background-secondary)] px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-[var(--text-secondary)]"
          >
            {dim.label}
          </li>
        ))}
      </ul>

      <dl className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
            {copy.metrics.askingPrice}
          </dt>
          <dd className="mt-1">
            <MetricValue value={formatCzk(demo.askingPriceCzk)} size="s" />
          </dd>
        </div>
        <div>
          <dt className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
            {copy.metrics.estimatedValue}
          </dt>
          <dd className="mt-1">
            <MetricValue value={formatCzk(demo.estimatedValueRangeCzk.mid)} size="s" />
          </dd>
        </div>
        <div>
          <dt className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
            {copy.metrics.grossYield}
          </dt>
          <dd className="mt-1">
            <MetricValue
              value={formatPercentPoints(demo.grossYieldPct, { signed: true })}
              tone="positive"
              size="s"
            />
          </dd>
        </div>
        <div>
          <dt className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
            {copy.metrics.cashFlow}
          </dt>
          <dd className="mt-1">
            <MetricValue
              value={formatCzk(demo.monthlyCashFlowCzk, { signed: true })}
              tone="positive"
              size="s"
            />
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex items-end justify-between gap-4 border-t border-[var(--border-default)] pt-4">
        <div>
          <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
            {copy.metrics.score}
          </p>
          <p className="font-metric text-metric-xl font-semibold text-[var(--text-primary)]">
            {demo.majetioScore}
            <span className="text-base font-normal text-[var(--text-muted)]">/100</span>
          </p>
        </div>
        <p className="max-w-[11rem] text-right text-xs leading-snug text-[var(--text-secondary)]">
          {demo.riskLabel}
        </p>
      </div>
    </aside>
  );
}
