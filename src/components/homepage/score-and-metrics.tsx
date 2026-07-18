import { MajetioScore, MetricCard } from "@/components/data-display/metric-card";
import { InlineAlert } from "@/components/feedback/states";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/layout-primitives";
import { homepageContent } from "@/content/homepage";
import { homepageDemoAnalysis } from "@/data/demo/homepage-analysis";
import { formatCzk, formatPercentPoints } from "@/lib/format";

/**
 * Explains Majetio score composition and the difference between price, yield and cash flow.
 */
export function ScoreAndMetrics() {
  const copy = homepageContent.scoreAndMetrics;
  const demo = homepageDemoAnalysis;

  return (
    <Section aria-labelledby="score-metrics-heading">
      <Container>
        <h2 id="score-metrics-heading" className="text-h2 text-[var(--text-primary)]">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">{copy.description}</p>

        <InlineAlert tone="warning" title="Důležitý princip" className="mt-6 max-w-3xl">
          {copy.principle}
        </InlineAlert>

        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <div data-demo="true">
              <MajetioScore
                score={demo.majetioScore}
                categories={[...demo.scoreCategories]}
              />
            </div>
            <ButtonLink
              href={copy.scoreLinkHref}
              variant="link"
              className="mt-4"
            >
              {copy.scoreLinkLabel}
            </ButtonLink>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            <MetricCard
              title="Nabídka"
              value={formatCzk(demo.askingPriceCzk)}
              explanation={copy.metrics[0].text}
              quality="estimated"
              source="Demo"
            />
            <MetricCard
              title="Odhad (střed)"
              value={formatCzk(demo.estimatedValueRangeCzk.mid)}
              explanation={copy.metrics[1].text}
              quality="estimated"
              source="Demo"
            />
            <MetricCard
              title="Hrubý výnos"
              value={formatPercentPoints(demo.grossYieldPct)}
              tone="positive"
              explanation={copy.metrics[2].text}
              quality="estimated"
              source="Demo"
            />
            <MetricCard
              title="Čistý výnos"
              value={formatPercentPoints(demo.netYieldPct)}
              explanation={copy.metrics[3].text}
              quality="estimated"
              source="Demo"
            />
            <MetricCard
              className="sm:col-span-2"
              title="Cash flow / měs."
              value={formatCzk(demo.monthlyCashFlowCzk, { signed: true })}
              tone="negative"
              explanation={copy.metrics[4].text}
              quality="estimated"
              source="Demo"
              changeLabel="Příklad: hrubý výnos 5,4 % při záporném cash flow"
            />
          </div>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {copy.metrics.map((metric) => (
            <li key={metric.id} className="border-t border-[var(--border-default)] pt-4">
              <h3 className="font-display text-lg text-[var(--text-primary)]">{metric.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{metric.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
