import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/layout-primitives";
import { homepageContent } from "@/content/homepage";

/**
 * FAQ with native disclosure widgets — no fake testimonials.
 */
export function HomepageFaq() {
  const copy = homepageContent.faq;

  return (
    <Section aria-labelledby="faq-heading">
      <Container width="article">
        <h2 id="faq-heading" className="text-h2 text-[var(--text-primary)]">
          {copy.title}
        </h2>
        <p className="mt-3 text-[var(--text-secondary)]">{copy.description}</p>

        <div className="mt-8 divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
          {copy.items.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="cursor-pointer list-none font-display text-lg text-[var(--text-primary)] marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-4">
                  {item.question}
                  <span
                    aria-hidden
                    className="mt-1 shrink-0 text-[var(--text-muted)] transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}
