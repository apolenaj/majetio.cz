import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { InlineAlert } from "@/components/feedback/states";
import {
  ACTOR_LABELS_CS,
  SALE_SUCCESS_FEE_RATES,
  TIER_LABELS_CS,
  formatRatePct,
} from "@/config/success-fee-packages";

export const metadata: Metadata = preparePageMeta({
  title: "Pro inzerenty",
  description:
    "Vkládejte nabídky bez platby předem. Odměna po úspěchu podle sjednaného balíčku — ne automaticky při poptávce.",
  path: "/pro-inzerenty",
});

export default function ProInzerentyPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Pro inzerenty"
        description="Soukromí uživatelé, makléři, realitní kanceláře, developeři a firmy — jeden účet, role podle oprávnění."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Pro inzerenty" },
        ]}
      />

      <InlineAlert tone="info" title="Bez platby předem ≠ zdarma" className="mb-8">
        Publikace nevyžaduje platbu předem. Success-fee se sjednává nezávazně; automatické
        účtování je vypnuté, dokud nebudou rozhodnuty obchodní otázky (DPH, okamžik vzniku
        odměny, attribution).
      </InlineAlert>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/pridat-nemovitost"
          className="inline-flex h-11 items-center rounded-lg bg-[var(--action-primary)] px-5 text-sm font-medium text-white"
        >
          Přidat nemovitost
        </Link>
        <Link
          href="/registrace"
          className="inline-flex h-11 items-center rounded-lg border border-[var(--border-strong)] px-5 text-sm font-medium"
        >
          Vytvořit účet
        </Link>
        <Link
          href="/cenik#success-fee"
          className="inline-flex h-11 items-center rounded-lg border border-[var(--border-default)] px-5 text-sm font-medium"
        >
          Balíčky odměn
        </Link>
      </div>

      <h2 className="mt-12 font-display text-2xl">Prodejní % (výchozí ze zadání)</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Základní</th>
              <th className="py-2 pr-4">Plus</th>
              <th className="py-2">Premium</th>
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
                <tr key={actor} className="border-b border-[var(--border-default)]">
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
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Tier labels: {Object.values(TIER_LABELS_CS).join(" · ")}. Detaily a otevřené otázky
        na ceníku.
      </p>
    </StandardPageLayout>
  );
}
