import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { formatCzk } from "@/components/marketing/format";
import { publicCustomerOffer } from "@/config/public-offer";

export const metadata: Metadata = preparePageMeta({
  title: "Ceník",
  description:
    "Analýza nemovitosti před koupí za 4 990 Kč — rozsah výstupu a nezávazná poptávka.",
  path: "/cenik",
});

export default function CenikPage() {
  const offer = publicCustomerOffer;

  return (
    <StandardPageLayout>
      <PageHeader
        title="Ceník"
        description="Aktuálně nabízíme jednu službu pro kupující: analýzu konkrétní nemovitosti před koupí."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Ceník" }]}
      />

      <article className="mt-10 max-w-3xl rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-[var(--text-primary)]">
              {offer.nameCs}
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {offer.billingCs} · {offer.vatNoteCs}
            </p>
          </div>
          <p className="font-display text-4xl text-[var(--text-primary)]">
            {formatCzk(offer.priceGrossCzk)}
          </p>
        </div>

        <p className="mt-6 text-base leading-relaxed text-[var(--text-secondary)]">
          {offer.summaryCs}
        </p>

        <h3 className="mt-8 font-medium text-[var(--text-primary)]">
          Co dostanete
        </h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
          {offer.includesCs.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="mt-8 font-medium text-[var(--text-primary)]">
          Jak to probíhá
        </h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
          {offer.processCs.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>

        <p className="mt-6 text-sm text-[var(--text-muted)]">
          {offer.nonBindingNoteCs}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={offer.ctaHref}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--action-primary)] px-5 text-sm font-medium text-white hover:bg-[var(--action-primary-hover)]"
          >
            {offer.ctaLabelCs}
          </Link>
          <Link
            href="/ukazky"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--border-strong)] px-5 text-sm font-medium text-[var(--text-primary)]"
          >
            Prohlédnout ukázkové analýzy
          </Link>
        </div>
      </article>
    </StandardPageLayout>
  );
}
