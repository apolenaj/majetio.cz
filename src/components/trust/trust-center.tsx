import Link from "next/link";

import type { TrustCenterSection } from "@/content/trust";
import { cn } from "@/lib/utils";

export function TrustCenterNav({
  sections,
  className,
}: {
  sections: TrustCenterSection[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Obsah centra důvěry"
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] p-4",
        className,
      )}
    >
      <p className="text-[var(--text-label-s)] font-medium tracking-wide text-[var(--text-muted)] uppercase">
        Obsah
      </p>
      <ol className="mt-3 space-y-2 text-sm">
        {sections.map((s, i) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="text-[var(--text-link)] underline-offset-2 hover:underline"
            >
              <span className="text-[var(--text-muted)] tabular-nums">
                {i + 1}.
              </span>{" "}
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function TrustCenterSectionBlock({
  section,
}: {
  section: TrustCenterSection;
}) {
  return (
    <section
      id={section.id}
      aria-labelledby={`trust-${section.id}`}
      className="scroll-mt-24 space-y-3 border-b border-[var(--border-default)] pb-10 last:border-b-0"
    >
      <h2
        id={`trust-${section.id}`}
        className="font-display text-h2 text-[var(--text-primary)]"
      >
        {section.title}
      </h2>
      <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
        {section.lead}
      </p>
      <ul className="max-w-2xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
        {section.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {section.href && section.hrefLabel ? (
        <p className="pt-1">
          <Link
            href={section.href}
            className="text-sm font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
          >
            {section.hrefLabel} →
          </Link>
        </p>
      ) : null}
    </section>
  );
}
