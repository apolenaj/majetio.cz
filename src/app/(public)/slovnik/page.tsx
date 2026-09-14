import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { GLOSSARY_TERMS } from "@/content/trust";

export const metadata: Metadata = preparePageMeta({
  title: "Slovník pojmů",
  description:
    "LTV, RPSN, NOI, IRR, ARV a další termíny prostou češtinou — bez zbytečného žargonu.",
  path: "/slovnik",
});

export default function SlovnikPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Slovník pojmů"
        description="Krátká vysvětlení investičních a hypotečních zkratek. Orientační — nenahrazují smlouvu ani radu banky."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Slovník" },
        ]}
      />

      <nav
        aria-label="Rejstřík pojmů"
        className="mt-8 flex flex-wrap gap-2 text-sm"
      >
        {GLOSSARY_TERMS.map((t) => (
          <a
            key={t.slug}
            href={`#${t.slug}`}
            className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--background-secondary)] px-2.5 py-1 text-[var(--text-link)] hover:underline"
          >
            {t.term}
          </a>
        ))}
      </nav>

      <div className="mt-12 max-w-2xl space-y-12">
        {GLOSSARY_TERMS.map((t) => (
          <article
            key={t.slug}
            id={t.slug}
            className="scroll-mt-24 space-y-2 border-b border-[var(--border-default)] pb-10 last:border-b-0"
          >
            <h2 className="font-display text-h2 text-[var(--text-primary)]">
              {t.term}
            </h2>
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              {t.short}
            </p>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {t.plain}
            </p>
            {t.relatedHref ? (
              <p className="pt-1 text-sm">
                <Link
                  href={t.relatedHref}
                  className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
                >
                  {t.relatedLabel ?? "Související"} →
                </Link>
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <p className="mt-10 text-sm text-[var(--text-muted)]">
        Další kontext:{" "}
        <Link
          href="/metodika"
          className="text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          metodika
        </Link>
        {" · "}
        <Link
          href="/duvera-a-bezpecnost"
          className="text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          důvěra a bezpečnost
        </Link>
      </p>
    </StandardPageLayout>
  );
}
