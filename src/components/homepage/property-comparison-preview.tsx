import { PropertyCard } from "@/components/property/property-card";
import { InlineAlert } from "@/components/feedback/states";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { Grid, Section } from "@/components/ui/layout-primitives";
import { homepageContent } from "@/content/homepage";
import { homepageComparisonProperties } from "@/data/demo/homepage-analysis";

/**
 * Side-by-side demo comparison — cheapest is not always best.
 */
export function PropertyComparisonPreview() {
  const copy = homepageContent.comparison;
  const properties = homepageComparisonProperties;

  return (
    <Section
      className="border-y border-[var(--border-default)] bg-[var(--background-secondary)]"
      aria-labelledby="comparison-heading"
    >
      <Container>
        <h2 id="comparison-heading" className="text-h2 text-[var(--text-primary)]">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">{copy.description}</p>

        <InlineAlert tone="info" title="Ukázkové srovnání" className="mt-6 max-w-3xl">
          {copy.insight}
        </InlineAlert>

        <Grid cols={3} className="mt-8">
          {properties.map((property) => (
            <PropertyCard
              key={property.href}
              property={{
                ...property,
                isDemo: true,
              }}
            />
          ))}
        </Grid>

        <ButtonLink href={copy.ctaHref} className="mt-8">
          {copy.ctaLabel}
        </ButtonLink>
      </Container>
    </Section>
  );
}
