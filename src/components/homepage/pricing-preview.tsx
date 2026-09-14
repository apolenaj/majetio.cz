import { TrackedAnchor, TrackedButtonLink } from "@/components/homepage/tracked";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Grid, Section } from "@/components/ui/layout-primitives";
import { formatCzkFromMinor } from "@/config/commerce";
import { getCatalogProductByKey } from "@/config/pricing-architecture";
import { homepageContent } from "@/content/homepage";

/**
 * Pricing preview from canonical catalog — no hardcoded product prices.
 */
export function PricingPreview() {
  const copy = homepageContent.pricing;
  const basic = getCatalogProductByKey("basic_analysis");
  const pro = getCatalogProductByKey("full_analysis");

  return (
    <Section aria-labelledby="pricing-heading">
      <Container>
        <h2 id="pricing-heading" className="text-h2 text-[var(--text-primary)]">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">{copy.description}</p>

        <Grid cols={2} className="mt-8">
          <Card as="article">
            <h3 className="font-display text-xl text-[var(--text-primary)]">
              {basic?.nameCs ?? "Základní analýza"}
            </h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--investment-positive)]">
              Zdarma
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
              {copy.basicFeatures.map((feature) => (
                <li key={feature}>· {feature}</li>
              ))}
            </ul>
            <TrackedButtonLink
              href={copy.basicHref}
              variant="secondary"
              className="mt-6"
              event={{
                name: "pricing_cta_clicked",
                props: { product: "basic", href: copy.basicHref },
              }}
            >
              {copy.basicCta}
            </TrackedButtonLink>
          </Card>

          <Card as="article" elevation="raised">
            <h3 className="font-display text-xl text-[var(--text-primary)]">
              {pro?.nameCs ?? "Kompletní analýza"}
            </h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {pro?.priceGrossMinor != null
                ? formatCzkFromMinor(pro.priceGrossMinor)
                : "—"}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
              {copy.proFeatures.map((feature) => (
                <li key={feature}>· {feature}</li>
              ))}
            </ul>
            <TrackedButtonLink
              href={copy.proHref}
              className="mt-6"
              event={{
                name: "pricing_cta_clicked",
                props: { product: "full", href: copy.proHref },
              }}
            >
              {copy.proCta}
            </TrackedButtonLink>
          </Card>
        </Grid>

        <p className="mt-6 text-sm text-[var(--text-muted)]">
          Kompletní ceník podle segmentů:{" "}
          <TrackedAnchor
            href="/cenik"
            className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            event={{
              name: "pricing_cta_clicked",
              props: { product: "cenik", href: "/cenik" },
            }}
          >
            /cenik
          </TrackedAnchor>
        </p>
      </Container>
    </Section>
  );
}
