import { LegalPage, preparePageMeta } from "@/components/content/page-helpers";
import type { LegalDocumentRecord } from "@/domains/privacy/consent-record";
import { MethodologyLink } from "@/components/trust";
import Link from "next/link";

/** Minimal markdown-ish renderer for legal content (## headings + paragraphs + tables lite). */
export function LegalDocumentView({ doc }: { doc: LegalDocumentRecord }) {
  const blocks = doc.content.split(/\n\n+/);

  return (
    <LegalPage title={doc.title} description={doc.summary ?? doc.title}>
      <p className="text-[var(--text-caption)] text-[var(--text-muted)]">
        Verze {doc.version}
        {doc.effectiveFrom
          ? ` · účinnost od ${doc.effectiveFrom.slice(0, 10)}`
          : null}
        {doc.status === "PUBLISHED" ? null : ` · status ${doc.status}`}
      </p>

      <div className="mt-8 space-y-5">
        {blocks.map((block) => {
          const trimmed = block.trim();
          if (trimmed.startsWith("## ")) {
            return (
              <h2
                key={trimmed.slice(0, 48)}
                className="font-display text-h3 text-[var(--text-primary)]"
              >
                {trimmed.replace(/^##\s+/, "")}
              </h2>
            );
          }
          if (trimmed.startsWith("|")) {
            return (
              <pre
                key={trimmed.slice(0, 48)}
                className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] p-3 text-xs leading-relaxed text-[var(--text-secondary)]"
              >
                {trimmed}
              </pre>
            );
          }
          return (
            <p
              key={trimmed.slice(0, 48)}
              className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap"
            >
              {trimmed}
            </p>
          );
        })}
      </div>

      <nav
        aria-label="Související právní dokumenty"
        className="mt-10 flex flex-wrap gap-4 border-t border-[var(--border-default)] pt-6 text-sm"
      >
        <Link
          href="/podminky"
          className="text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          Podmínky
        </Link>
        <Link
          href="/ochrana-soukromi"
          className="text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          Ochrana soukromí
        </Link>
        <Link
          href="/cookies"
          className="text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          Cookies
        </Link>
        <Link
          href="/duvera-a-bezpecnost"
          className="text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          Důvěra a bezpečnost
        </Link>
        <Link
          href="/ucet/soukromi"
          className="text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          Privacy Center
        </Link>
        <MethodologyLink topic="data-sources" />
      </nav>
    </LegalPage>
  );
}

export { preparePageMeta };
