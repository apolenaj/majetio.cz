import { ExternalLink } from "lucide-react";

import { MetricCard } from "@/components/data-display/metric-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/layout-primitives";
import { homepageContent } from "@/content/homepage";
import { homepageDemoAnalysis } from "@/data/demo/homepage-analysis";
import { createHypotekaJasneClient } from "@/integrations/hypotekajasne";
import { formatCzk, formatPercentPoints } from "@/lib/format";

/**
 * Clear separation: Majetio = property economics; HypotekaJasne = financing & client.
 */
export async function FinancingIntegration() {
  const copy = homepageContent.financing;
  const demo = homepageDemoAnalysis;
  const client = createHypotekaJasneClient();
  const preview = await client.getFinancingPreview({
    propertyPriceCzk: demo.financing.propertyPriceCzk,
    availableEquityCzk: demo.financing.availableEquityCzk,
    termYears: demo.financing.termYears,
  });

  return (
    <Section
      className="border-y border-[var(--border-default)] bg-[var(--surface-inverse)] text-[var(--text-inverse)]"
      aria-labelledby="financing-heading"
    >
      <Container>
        <h2 id="financing-heading" className="font-display text-2xl sm:text-3xl">
          {copy.title}
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-white/75 sm:text-base">{copy.description}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-white/15 bg-white/5 p-4">
            <p className="text-overline text-[var(--action-premium)]">Majetio</p>
            <p className="mt-2 text-sm text-white/85">{copy.majetioRole}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-white/15 bg-white/5 p-4">
            <p className="text-overline text-[var(--action-premium)]">HypotekaJasne</p>
            <p className="mt-2 text-sm text-white/85">{copy.hjRole}</p>
          </div>
        </div>

        <div className="mt-8" data-demo="true">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone="premium">Demo odhad</Badge>
            {preview.isMock ? <Badge tone="neutral">Mock API</Badge> : null}
          </div>
          <p className="mb-4 text-sm text-white/70">{copy.demoNote}</p>
          <p className="mb-4 text-xs text-white/55">{preview.disclaimer}</p>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              title="Odhad splátky / měs."
              value={formatCzk(preview.estimatedMonthlyPaymentCzk)}
              source="HypotekaJasne mock"
              className="bg-[var(--surface-primary)] text-[var(--text-primary)]"
            />
            <MetricCard
              title="Orientační sazba"
              value={formatPercentPoints(preview.estimatedRatePct)}
              source="HypotekaJasne mock"
              className="bg-[var(--surface-primary)] text-[var(--text-primary)]"
            />
            <MetricCard
              title="Výše úvěru"
              value={formatCzk(preview.loanAmountCzk)}
              explanation={`Vlastní zdroje (demo): ${formatCzk(demo.financing.availableEquityCzk)}`}
              source="HypotekaJasne mock"
              className="bg-[var(--surface-primary)] text-[var(--text-primary)]"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink
            href={copy.ctaHref}
            className="bg-[var(--background-primary)] text-[var(--text-primary)] hover:bg-white"
          >
            {copy.ctaLabel}
          </ButtonLink>
          <a
            href={copy.externalHref}
            className="inline-flex items-center gap-1.5 self-center text-sm font-medium text-[var(--action-premium)] underline-offset-2 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            {copy.externalLabel}
            <ExternalLink className="size-3.5" aria-hidden />
            <span className="sr-only">(otevře se v novém okně)</span>
          </a>
        </div>
      </Container>
    </Section>
  );
}
