import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { InlineAlert } from "@/components/feedback/states";
import { YIELD_METHODOLOGY } from "@/content/yield-methodology";

export const metadata: Metadata = preparePageMeta({
  title: YIELD_METHODOLOGY.title,
  description:
    "Jak Majetio počítá hrubý a čistý výnos, NOI a cash flow — srozumitelně a bez falešných nul.",
  path: "/jak-pocitame-vynos",
});

export default function JakPocitameVynosPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title={YIELD_METHODOLOGY.title}
        description={YIELD_METHODOLOGY.lead}
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/metodika", label: "Metodika" },
          { label: "Jak počítáme výnos" },
        ]}
      />

      <InlineAlert tone="info" title="Orientační model">
        Výsledky kalkulaček a analýz slouží k porovnání scénářů. Nejde o příslib
        výnosu ani o daňové či investiční poradenství.
      </InlineAlert>

      <div className="mt-10 max-w-2xl space-y-10">
        {YIELD_METHODOLOGY.sections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-3">
            <h2 className="font-display text-xl text-[var(--text-primary)]">
              {section.title}
            </h2>
            {section.paragraphs.map((p) => (
              <p
                key={p.slice(0, 48)}
                className="text-sm leading-relaxed text-[var(--text-secondary)]"
              >
                {p}
              </p>
            ))}
          </section>
        ))}

        <nav aria-label="Související stránky" className="border-t border-[var(--border-default)] pt-8">
          <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">
            Související
          </p>
          <ul className="space-y-2 text-sm">
            {YIELD_METHODOLOGY.relatedLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[var(--text-link)] underline-offset-2 hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </StandardPageLayout>
  );
}
