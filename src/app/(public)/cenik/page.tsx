import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { formatCzk } from "@/components/marketing/format";
import { publicCustomerOffer } from "@/config/public-offer";
import { InlineAlert } from "@/components/feedback/states";
import {
  ACTOR_LABELS_CS,
  RENT_SUCCESS_FEE_PACKAGES,
  SALE_SUCCESS_FEE_RATES,
  SUCCESS_FEE_BILLING_ENABLED,
  TIER_LABELS_CS,
  formatRatePct,
} from "@/config/success-fee-packages";
import { SuccessFeeEngageForm } from "@/components/marketplace/success-fee-engage-form";

export const metadata: Metadata = preparePageMeta({
  title: "Ceník",
  description:
    "Success-fee balíčky pro inzerenty a doplňková analýza nemovitosti pro kupující.",
  path: "/cenik",
});

export default function CenikPage() {
  const offer = publicCustomerOffer;

  return (
    <StandardPageLayout>
      <PageHeader
        title="Ceník"
        description="Inzertní odměny po úspěchu (dle zadání) a doplňková analýza pro kupující. Automatické účtování success-fee je vypnuté."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Ceník" }]}
      />

      <InlineAlert tone="warning" title="Otevřené obchodní otázky" className="mb-8">
        Dokument neuvádí základ odměny u pronájmu, DPH, splatnost, attribution ani storno.
        Detaily: docs/SUCCESS_FEE_OPEN_QUESTIONS.md. Billing enabled:{" "}
        {SUCCESS_FEE_BILLING_ENABLED ? "ano" : "ne"}.
      </InlineAlert>

      <section id="success-fee" className="scroll-mt-24">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">
          Prodej — success fee
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">{TIER_LABELS_CS.basic}</th>
                <th className="py-2 pr-4">{TIER_LABELS_CS.plus}</th>
                <th className="py-2">{TIER_LABELS_CS.premium}</th>
              </tr>
            </thead>
            <tbody>
              {(
                ["private", "broker", "agency", "developer", "company"] as const
              ).map((actor) => {
                const rows = SALE_SUCCESS_FEE_RATES.filter((r) => r.actor === actor);
                const cell = (tier: "basic" | "plus" | "premium") =>
                  formatRatePct(rows.find((r) => r.tier === tier)!);
                return (
                  <tr
                    key={actor}
                    className="border-b border-[var(--border-default)]"
                  >
                    <td className="py-2 pr-4">{ACTOR_LABELS_CS[actor]}</td>
                    <td className="py-2 pr-4">{cell("basic")}</td>
                    <td className="py-2 pr-4">{cell("plus")}</td>
                    <td className="py-2">{cell("premium")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 font-display text-2xl text-[var(--text-primary)]">
          Pronájem
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
          {RENT_SUCCESS_FEE_PACKAGES.map((p) => (
            <li key={p.tier}>
              <strong className="text-[var(--text-primary)]">{p.labelCs}</strong>
              : {formatRatePct(p)} — {p.noteCs}
            </li>
          ))}
        </ul>

        <div className="mt-8 max-w-lg">
          <h3 className="font-medium text-[var(--text-primary)]">
            Nezávazné sjednání balíčku
          </h3>
          <SuccessFeeEngageForm />
        </div>
      </section>

      <article className="mt-14 max-w-3xl rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Doplněk pro kupující
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
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
            Modelové studie
          </Link>
        </div>
      </article>
    </StandardPageLayout>
  );
}
