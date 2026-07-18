import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/layout-primitives";
import { homepageContent } from "@/content/homepage";

/**
 * Closing CTA — strong but calm, no urgency tactics.
 */
export function FinalCta() {
  const copy = homepageContent.finalCta;

  return (
    <Section className="bg-[var(--surface-inverse)] py-16 text-[var(--text-inverse)] sm:py-20">
      <Container className="max-w-3xl text-center">
        <h2 className="font-display text-2xl sm:text-3xl">{copy.title}</h2>
        <p className="mt-4 text-sm text-white/75 sm:text-base">{copy.description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink
            href={copy.primaryHref}
            className="bg-[var(--background-primary)] text-[var(--text-primary)] hover:bg-white"
          >
            {copy.primaryLabel}
          </ButtonLink>
          <ButtonLink
            href={copy.secondaryHref}
            variant="ghost"
            className="text-[var(--text-inverse)] hover:bg-white/10"
          >
            {copy.secondaryLabel}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
