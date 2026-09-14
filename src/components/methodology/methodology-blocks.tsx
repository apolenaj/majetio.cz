import Link from "next/link";

import { MethodologyLink } from "@/components/trust";
import type { MethodologySection } from "@/content/methodology/hub";
import { cn } from "@/lib/utils";

export function MethodologyToc({
  sections,
  className,
}: {
  sections: Array<{ slug: string; title: string }>;
  className?: string;
}) {
  return (
    <nav
      aria-label="Obsah metodiky"
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] p-4 sm:p-5",
        className,
      )}
    >
      <p className="text-[var(--text-label-s)] font-medium tracking-wide text-[var(--text-muted)] uppercase">
        Obsah
      </p>
      <ol className="mt-3 space-y-2 text-sm">
        {sections.map((s, i) => (
          <li key={s.slug}>
            <Link
              href={`/metodika/${s.slug}`}
              className="text-[var(--text-link)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <span className="text-[var(--text-muted)] tabular-nums">
                {i + 1}.
              </span>{" "}
              {s.title}
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-4 border-t border-[var(--border-default)] pt-3 text-[var(--text-caption)] text-[var(--text-muted)]">
        Související:{" "}
        <MethodologyLink topic="data-sources" className="text-[var(--text-caption)]" />
      </p>
    </nav>
  );
}

export function MethodologySectionBody({
  section,
  headingLevel = "h2",
  omitTitle = false,
  showLead = true,
}: {
  section: MethodologySection;
  headingLevel?: "h1" | "h2";
  /** When PageHeader already renders the section title as H1. */
  omitTitle?: boolean;
  showLead?: boolean;
}) {
  const Heading = headingLevel;

  return (
    <article className="max-w-2xl space-y-8">
      {omitTitle && !showLead ? null : (
        <header className="space-y-3">
          {omitTitle ? null : (
            <Heading className="font-display text-h2 text-[var(--text-primary)]">
              {section.title}
            </Heading>
          )}
          {showLead ? (
            <p className="text-base leading-relaxed text-[var(--text-secondary)]">
              {section.lead}
            </p>
          ) : null}
        </header>
      )}

      <section aria-labelledby={`${section.slug}-definition`} className="space-y-2">
        <h3
          id={`${section.slug}-definition`}
          className="text-h4 font-medium text-[var(--text-primary)]"
        >
          Definice
        </h3>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {section.blocks.definition}
        </p>
      </section>

      <section aria-labelledby={`${section.slug}-inputs`} className="space-y-2">
        <h3
          id={`${section.slug}-inputs`}
          className="text-h4 font-medium text-[var(--text-primary)]"
        >
          Vstupy
        </h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
          {section.blocks.inputs.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`${section.slug}-sources`} className="space-y-2">
        <h3
          id={`${section.slug}-sources`}
          className="text-h4 font-medium text-[var(--text-primary)]"
        >
          Zdroje
        </h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
          {section.blocks.sources.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`${section.slug}-limits`} className="space-y-2">
        <h3
          id={`${section.slug}-limits`}
          className="text-h4 font-medium text-[var(--text-primary)]"
        >
          Limity
        </h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
          {section.blocks.limits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {section.subsections?.map((sub) => (
        <section
          key={sub.id}
          id={sub.id}
          aria-labelledby={`${section.slug}-${sub.id}`}
          className="space-y-2 border-t border-[var(--border-subtle)] pt-6"
        >
          <h3
            id={`${section.slug}-${sub.id}`}
            className="text-h4 font-medium text-[var(--text-primary)]"
          >
            {sub.title}
          </h3>
          {sub.paragraphs.map((p) => (
            <p
              key={p.slice(0, 40)}
              className="text-sm leading-relaxed text-[var(--text-secondary)]"
            >
              {p}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
