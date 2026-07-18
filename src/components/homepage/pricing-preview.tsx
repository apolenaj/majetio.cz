import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Grid, Section } from "@/components/ui/layout-primitives";
import { commerceConfig } from "@/config/commerce";
import { homepageContent } from "@/content/homepage";
import { formatCzk } from "@/lib/format";

/**
 * Pricing preview from central commerce config — no hardcoded product prices.
 */
export function PricingPreview() {
  const copy = homepageContent.pricing;
  const basic = commerceConfig.products.basicAnalysis;
  const pro = commerceConfig.products.fullAnalysis;

  return (
    <Section aria-labelledby="pricing-heading">
      <Container>
        <h2 id="pricing-heading" className="text-h2 text-[var(--text-primary)]">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">{copy.description}</p>

        <Grid cols={2} className="mt-8">
          <Card as="article">
            <h3 className="font-display text-xl text-[var(--text-primary)]">{basic.name}</h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--investment-positive)]">
              Zdarma
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
              {copy.basicFeatures.map((feature) => (
                <li key={feature}>· {feature}</li>
              ))}
            </ul>
            <ButtonLink href={copy.basicHref} variant="secondary" className="mt-6">
              {copy.basicCta}
            </ButtonLink>
          </Card>

          <Card as="article" elevation="raised">
            <h3 className="font-display text-xl text-[var(--text-primary)]">{pro.name}</h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {formatCzk(pro.priceCzk)}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
              {copy.proFeatures.map((feature) => (
                <li key={feature}>· {feature}</li>
              ))}
            </ul>
            <ButtonLink href={copy.proHref} className="mt-6">
              {copy.proCta}
            </ButtonLink>
          </Card>
        </Grid>
      </Container>
    </Section>
  );
}
