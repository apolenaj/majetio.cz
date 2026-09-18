import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { MEGA_KALKULACKY } from "@/config/navigation";
import { formatCzk } from "@/components/marketing/format";
import { publicCustomerOffer } from "@/config/public-offer";

export const metadata: Metadata = preparePageMeta({
  title: "Analýzy a kalkulačky",
  description:
    "Doplňkové nástroje k inzertní platformě — modelové studie, kalkulačky a analýza konkrétní nemovitosti.",
  path: "/analyzy-a-kalkulacky",
});

export default function AnalyzyAKalkulackyPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Analýzy a kalkulačky"
        description="Tyto nástroje doplňují katalog — nenahrazují inzertní platformu."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Analýzy a kalkulačky" },
        ]}
      />

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-xl">Analýza nemovitosti</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {publicCustomerOffer.nameCs} — {formatCzk(publicCustomerOffer.priceGrossCzk)}.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/#posoudit-form"
            className="inline-flex h-10 items-center rounded-lg bg-[var(--action-primary)] px-4 text-sm font-medium text-white"
          >
            Nezávazná poptávka
          </Link>
          <Link
            href="/ukazky"
            className="inline-flex h-10 items-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-medium"
          >
            Modelové studie
          </Link>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-xl">Kalkulačky</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {MEGA_KALKULACKY.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm underline underline-offset-2"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </StandardPageLayout>
  );
}
