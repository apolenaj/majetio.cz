import { Container } from "@/components/ui/container";
import { DEMO_ANALYSIS_PLACEHOLDER } from "@/domains/content/demo/demo-analysis";
import { formatCzk } from "@/lib/format";

export function HomeDemoAnalysis() {
  const demo = DEMO_ANALYSIS_PLACEHOLDER;

  return (
    <section className="py-16 sm:py-20" aria-labelledby="demo-heading">
      <Container>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h2 id="demo-heading" className="text-h2 text-[var(--color-ink)]">
            Ukázka analytické karty
          </h2>
          <span className="rounded border border-[var(--color-sand)] bg-[color-mix(in_srgb,var(--color-sand)_18%,white)] px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]">
            Demo
          </span>
        </div>
        <p className="mb-8 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          {demo.label}. Čísla slouží pouze k ilustraci rozhraní a nejsou investičním
          doporučením ani aktuální nabídkou.
        </p>

        <div
          className="rounded-xl border-2 border-dashed border-[var(--color-sand)] bg-[var(--color-surface)] p-6 sm:p-8"
          data-demo="true"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sand)]">
            Ilustrativní výpočet
          </p>
          <h3 className="mt-2 font-display text-xl text-[var(--color-ink)]">
            {demo.propertyTitle}
          </h3>
          <p className="text-sm text-[var(--color-ink-soft)]">{demo.locationLabel}</p>

          <dl className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-caption uppercase tracking-wide text-[var(--color-ink-muted)]">
                Poptávková cena (demo)
              </dt>
              <dd className="font-metric mt-1 text-lg font-medium text-[var(--color-ink)]">
                {formatCzk(demo.askingPriceCzk)}
              </dd>
            </div>
            <div>
              <dt className="text-caption uppercase tracking-wide text-[var(--color-ink-muted)]">
                Odhad hodnoty (demo)
              </dt>
              <dd className="font-metric mt-1 text-lg font-medium text-[var(--color-ink)]">
                {formatCzk(demo.estimatedValueRangeCzk.low)} –{" "}
                {formatCzk(demo.estimatedValueRangeCzk.high)}
              </dd>
            </div>
            <div>
              <dt className="text-caption uppercase tracking-wide text-[var(--color-ink-muted)]">
                Hrubý výnos (demo)
              </dt>
              <dd className="font-metric mt-1 text-lg font-medium text-[var(--color-positive)]">
                +{demo.grossYieldPct.toFixed(1)} %
              </dd>
            </div>
            <div>
              <dt className="text-caption uppercase tracking-wide text-[var(--color-ink-muted)]">
                Majetio skóre (demo)
              </dt>
              <dd className="font-metric mt-1 text-lg font-medium text-[var(--color-ink)]">
                {demo.majetioScore}/100
              </dd>
            </div>
          </dl>

          <p className="mt-6 text-sm text-[var(--color-ink-soft)]">
            Strategie: {demo.strategy} · Měsíční cash flow (demo): +
            {formatCzk(demo.monthlyCashFlowCzk)}
          </p>
        </div>
      </Container>
    </section>
  );
}
