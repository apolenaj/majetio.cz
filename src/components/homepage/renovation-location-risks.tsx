import { MapPin } from "lucide-react";

import { MetricCard } from "@/components/data-display/metric-card";
import { RiskBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/layout-primitives";
import { homepageContent } from "@/content/homepage";
import { homepageDemoAnalysis } from "@/data/demo/homepage-analysis";
import { formatCzk, formatPercentPoints } from "@/lib/format";

/**
 * Renovation max-offer logic, location placeholder, and transparent risk examples.
 */
export function RenovationLocationRisks() {
  const copy = homepageContent.renovationLocationRisks;
  const demo = homepageDemoAnalysis;
  const reno = demo.renovation;

  return (
    <Section aria-labelledby="reno-location-risks-heading">
      <Container>
        <h2 id="reno-location-risks-heading" className="sr-only">
          Rekonstrukce, lokalita a rizika
        </h2>

        <div className="grid gap-12 lg:gap-16">
          <div data-demo="true">
            <h3 className="text-h2 text-[var(--text-primary)]">{copy.renovation.title}</h3>
            <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
              {copy.renovation.description}
            </p>
            <p className="mt-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-3 font-metric text-sm text-[var(--text-primary)] sm:text-base">
              {copy.renovation.formula}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Hodnota po rekonstrukci"
                value={formatCzk(reno.valueAfterCzk)}
                quality="estimated"
                source="Demo"
              />
              <MetricCard
                title="Náklady"
                value={formatCzk(reno.costCzk)}
                tone="negative"
                quality="estimated"
                source="Demo"
              />
              <MetricCard
                title="Rezerva"
                value={formatCzk(reno.reserveCzk)}
                quality="estimated"
                source="Demo"
              />
              <MetricCard
                title="Max. nabídková cena"
                value={formatCzk(reno.maxOfferCzk)}
                tone="positive"
                explanation="Hodnota po rekonstrukci − náklady − rezerva"
                quality="estimated"
                source="Demo"
              />
            </div>
            <ButtonLink href={copy.renovation.ctaHref} variant="secondary" className="mt-6">
              {copy.renovation.ctaLabel}
            </ButtonLink>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:items-start" data-demo="true">
            <div>
              <h3 className="text-h2 text-[var(--text-primary)]">{copy.location.title}</h3>
              <p className="mt-3 text-[var(--text-secondary)]">{copy.location.description}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <MetricCard
                  title="Nájemní index (demo)"
                  value={formatPercentPoints(demo.location.rentIndexPct)}
                  quality="estimated"
                  source="Demo"
                />
                <MetricCard
                  title="Tempo ceny (5 let, demo)"
                  value={formatPercentPoints(demo.location.priceTrendPct)}
                  quality="estimated"
                  source="Demo"
                />
              </div>
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                Dojezd do centra (demo): {demo.location.commuteMinutes} min ·{" "}
                {demo.location.vacancyNote}
              </p>
              <ButtonLink href={copy.location.ctaHref} variant="secondary" className="mt-6">
                {copy.location.ctaLabel}
              </ButtonLink>
            </div>

            <div
              className="flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--border-strong)] bg-[var(--background-secondary)] p-6 text-center"
              role="img"
              aria-label={copy.location.mapLabel}
            >
              <MapPin className="size-8 text-[var(--text-muted)]" aria-hidden />
              <p className="font-medium text-[var(--text-primary)]">{copy.location.mapLabel}</p>
              <p className="max-w-xs text-sm text-[var(--text-secondary)]">
                Interaktivní mapa lokality se připravuje. Zatím ukazujeme lokální metriky.
              </p>
            </div>
          </div>

          <div data-demo="true">
            <h3 className="text-h2 text-[var(--text-primary)]">{copy.risks.title}</h3>
            <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">{copy.risks.description}</p>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {demo.riskItems.map((item) => (
                <li key={item.id}>
                  <Card as="article" variant="muted">
                    <RiskBadge level={item.level} />
                    <h4 className="mt-3 font-display text-lg text-[var(--text-primary)]">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.text}</p>
                  </Card>
                </li>
              ))}
            </ul>
            <ButtonLink href={copy.risks.ctaHref} variant="outline" className="mt-6">
              {copy.risks.ctaLabel}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
