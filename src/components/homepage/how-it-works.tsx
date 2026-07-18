import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/layout-primitives";
import { homepageContent } from "@/content/homepage";

/**
 * Four-step process — how Majetio turns a listing into a decision.
 */
export function HowItWorks() {
  const copy = homepageContent.howItWorks;

  return (
    <Section
      className="border-y border-[var(--border-default)] bg-[var(--surface-primary)]"
      aria-labelledby="how-it-works-heading"
    >
      <Container>
        <h2 id="how-it-works-heading" className="text-h2 text-[var(--text-primary)]">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">{copy.description}</p>

        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {copy.steps.map((step, index) => (
            <li key={step.title}>
              <p className="text-overline text-[var(--action-premium)]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 font-display text-xl text-[var(--text-primary)]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {step.text}
              </p>
            </li>
          ))}
        </ol>

        <ButtonLink href={copy.ctaHref} variant="secondary" className="mt-10">
          {copy.ctaLabel}
        </ButtonLink>
      </Container>
    </Section>
  );
}
