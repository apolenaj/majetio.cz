import { FaqDisclosure } from "@/components/homepage/faq-disclosure";
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
          {copy.items.map((item, index) => (
            <FaqDisclosure
              key={item.question}
              questionId={`faq-${index + 1}`}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
