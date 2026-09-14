import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { DataQualityBadge } from "@/components/ui/badge";
import { MetricValue } from "@/components/data-display/metric-card";
import { brand } from "@/config/brand";
import { DEMO_ANALYSIS_PLACEHOLDER } from "@/domains/content/demo/demo-analysis";
import { formatCzk, formatPercentPoints } from "@/lib/format";

export function HomeHero() {
  const demo = DEMO_ANALYSIS_PLACEHOLDER;

  return (
    <section className="relative overflow-hidden border-b border-[var(--border-default)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(11,31,51,0.10),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(31,111,84,0.08),transparent_50%)]"
      />

      <Container className="relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className="motion-fade-in">
          <p className="text-overline text-[var(--action-premium)]">{brand.claims.primary}</p>
          <h1 className="text-display-l mt-4 max-w-xl text-[var(--text-primary)]">
            {brand.claims.hero}
          </h1>
          <p className="mt-5 max-w-xl text-[length:var(--text-body-l)] leading-relaxed text-[var(--text-secondary)]">
            Majetio spojuje vyhledávání nemovitostí s analýzou hodnoty, výnosů, cash flow a
            rizik — aby rozhodnutí o koupi stálo na datech, ne na dojmu.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/analyza" size="lg">
              Analyzovat nemovitost
            </ButtonLink>
            <ButtonLink href="/nemovitosti" variant="secondary" size="lg">
              Procházet nemovitosti
            </ButtonLink>
          </div>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Katalog a analýza se připravují. CTA vedou na připravené stránky bez falešných
            funkcí.
          </p>
        </div>

        <aside
          className="motion-fade-in rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-raised)] sm:p-6"
          data-demo="true"
          aria-label={demo.label}
        >
          <div className="flex flex-wrap items-center gap-2">
            <DataQualityBadge quality="estimated" />
            <span className="rounded border border-[var(--action-premium)] bg-[color-mix(in_srgb,var(--action-premium)_18%,white)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              Demo · ilustrativní výpočet
            </span>
          </div>
          <h2 className="mt-3 font-display text-xl text-[var(--text-primary)]">
            {demo.propertyTitle}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">{demo.locationLabel}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
                Nabídková cena
              </dt>
              <dd className="mt-1">
                <MetricValue value={formatCzk(demo.askingPriceCzk)} size="s" />
              </dd>
            </div>
            <div>
              <dt className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
                Odhad hodnoty
              </dt>
              <dd className="mt-1">
                <MetricValue value={formatCzk(demo.estimatedValueRangeCzk.mid)} size="s" />
              </dd>
            </div>
            <div>
              <dt className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
                Hrubý výnos
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
                Cash flow / měs.
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

          <div className="mt-6 flex items-end justify-between border-t border-[var(--border-default)] pt-4">
            <div>
              <p className="text-caption uppercase tracking-wide text-[var(--text-muted)]">
                Majetio skóre
              </p>
              <p className="font-metric text-metric-xl text-[var(--text-primary)]">
                {demo.majetioScore}
                <span className="text-base font-normal text-[var(--text-muted)]">/100</span>
              </p>
            </div>
            <p className="max-w-[12rem] text-right text-xs leading-snug text-[var(--text-secondary)]">
              Riziko (demo): {demo.risks[0]}
            </p>
          </div>
        </aside>
      </Container>
    </section>
  );
}
