import { MajetioScore, MetricCard } from "@/components/data-display/metric-card";
import { PropertyCard } from "@/components/property/property-card";
import { Badge, RiskBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/layout-primitives";
import { homepageContent } from "@/content/homepage";
import { DEMO_PROPERTIES } from "@/content/demo-properties";
import { homepageDemoAnalysis } from "@/data/demo/homepage-analysis";
import { formatCzk, formatPercentPoints, formatRangeCzk } from "@/lib/format";

/**
 * Dominant sample analysis — clearly labelled demo with mix of positives, risks, uncertainties.
 */
export function SampleAnalysis() {
  const copy = homepageContent.sampleAnalysis;
  const demo = homepageDemoAnalysis;
  const property = {
    ...DEMO_PROPERTIES[0]!,
    title: demo.propertyTitle,
    location: demo.locationLabel,
    priceCzk: demo.askingPriceCzk,
    pricePerSqmCzk: Math.round(demo.askingPriceCzk / demo.areaSqm),
    grossYieldPct: demo.grossYieldPct,
    cashFlowMonthlyCzk: demo.monthlyCashFlowCzk,
    majetioScore: demo.majetioScore,
    risk: demo.risk,
    dataQuality: demo.dataQuality,
    isDemo: true as const,
  };

  return (
    <Section
      className="border-b border-[var(--border-default)] bg-[var(--background-secondary)]"
      aria-labelledby="sample-analysis-heading"
    >
      <Container>
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="sample-analysis-heading" className="text-h2 text-[var(--text-primary)]">
            {copy.title}
          </h2>
          <Badge tone="premium">{copy.demoBadge}</Badge>
        </div>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">{copy.description}</p>
        <p className="mt-2 text-xs text-[var(--text-muted)]" data-demo="true">
          {demo.label}. Údaje jsou ilustrativní.
        </p>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-6 lg:col-span-5">
            <PropertyCard property={property} />

            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">{copy.positivesTitle}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--text-secondary)]">
                  {demo.positives.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">{copy.risksTitle}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--text-secondary)]">
                  {demo.risks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">
                  {copy.uncertaintiesTitle}
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--text-secondary)]">
                  {demo.uncertainties.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <ButtonLink href={copy.ctaHref}>{copy.ctaLabel}</ButtonLink>
          </div>

          <div className="space-y-4 lg:col-span-7" data-demo="true">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge level={demo.risk} />
              <Badge tone="neutral">Strategie: {demo.strategy}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                title="Nabídková cena"
                value={formatCzk(demo.askingPriceCzk)}
                quality="estimated"
                explanation="Inzerovaná cena. Nemusí odpovídat odhadu hodnoty."
                source="Demo"
              />
              <MetricCard
                title="Odhad hodnoty"
                value={formatRangeCzk(
                  demo.estimatedValueRangeCzk.low,
                  demo.estimatedValueRangeCzk.high,
                )}
                quality="estimated"
                explanation="Orientační pásmo podle demonstračních předpokladů."
                source="Demo"
              />
              <MetricCard
                title="Hrubý výnos"
                value={formatPercentPoints(demo.grossYieldPct)}
                tone="positive"
                quality="estimated"
                explanation="Roční nájemné / kupní cena — před náklady a splátkami."
                source="Demo"
              />
              <MetricCard
                title="Cash flow / měs."
                value={formatCzk(demo.monthlyCashFlowCzk, { signed: true })}
                tone="negative"
                quality="estimated"
                explanation="Po nákladech a modelovém financování. Vysoký výnos ≠ kladné cash flow."
                source="Demo"
              />
            </div>

            <MajetioScore
              score={demo.majetioScore}
              variant="ring"
              categories={[...demo.scoreCategories]}
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
