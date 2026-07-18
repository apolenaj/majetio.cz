import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/layout-primitives";
import { homepageContent } from "@/content/homepage";

/**
 * Trust through methodology transparency — no fake social proof.
 */
export function MethodologyTrust() {
  const copy = homepageContent.methodology;

  return (
    <Section
      className="border-t border-[var(--border-default)] bg-[var(--background-secondary)]"
      aria-labelledby="methodology-heading"
    >
      <Container>
        <h2 id="methodology-heading" className="text-h2 text-[var(--text-primary)]">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">{copy.description}</p>

        <ul className="mt-8 grid gap-6 sm:grid-cols-3">
          {copy.points.map((point) => (
            <li key={point.title} className="border-t border-[var(--border-default)] pt-4">
              <h3 className="font-display text-lg text-[var(--text-primary)]">{point.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{point.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          {copy.links.map((link, index) => (
            <ButtonLink
              key={link.href}
              href={link.href}
              variant={index === 0 ? "secondary" : index === 1 ? "outline" : "ghost"}
            >
              {link.label}
            </ButtonLink>
          ))}
        </div>
      </Container>
    </Section>
  );
}
