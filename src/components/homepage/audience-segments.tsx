import { RiskBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Grid, Section } from "@/components/ui/layout-primitives";
import { homepageContent } from "@/content/homepage";

/**
 * Audience segments with primary metric, risk and CTA per segment.
 */
export function AudienceSegments() {
  const copy = homepageContent.audiences;

  return (
    <Section
      className="border-y border-[var(--border-default)] bg-[var(--background-secondary)]"
      aria-labelledby="audiences-heading"
    >
      <Container>
        <h2 id="audiences-heading" className="text-h2 text-[var(--text-primary)]">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">{copy.description}</p>

        <Grid cols={2} className="mt-8">
          {copy.segments.map((segment) => (
            <Card key={segment.id} variant="muted" as="article">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-display text-xl text-[var(--text-primary)]">
                  {segment.title}
                </h3>
                <RiskBadge level={segment.risk} />
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{segment.text}</p>
              <p className="mt-4 text-caption uppercase tracking-wide text-[var(--text-muted)]">
                {segment.metricLabel}
              </p>
              <p className="font-metric text-lg font-semibold text-[var(--text-primary)]">
                {segment.metricValue}
              </p>
              <ButtonLink href={segment.ctaHref} variant="secondary" className="mt-4">
                {segment.ctaLabel}
              </ButtonLink>
            </Card>
          ))}
        </Grid>
      </Container>
    </Section>
  );
}
