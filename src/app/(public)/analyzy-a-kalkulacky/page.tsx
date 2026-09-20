import type { Metadata } from "next";
import Link from "next/link";
import {
  Calculator,
  Landmark,
  LineChart,
  Sparkles,
  Wrench,
} from "lucide-react";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { MEGA_KALKULACKY } from "@/config/navigation";
import { formatCzk } from "@/components/marketing/format";
import {
  publicCheckoutMode,
  publicCustomerOffer,
} from "@/config/public-offer";

export const metadata: Metadata = preparePageMeta({
  title: "Analýzy a kalkulačky",
  description:
    "Doplňkové nástroje k inzertní platformě — modelové studie, kalkulačky a analýza konkrétní nemovitosti.",
  path: "/analyzy-a-kalkulacky",
});

const FEATURED = [
  {
    href: "/kalkulacky/investicni-vynos",
    title: "Výnos a cash flow",
    text: "Modelujte nájem, náklady a měsíční bilanci.",
    icon: LineChart,
  },
  {
    href: "/kalkulacky/rekonstrukce",
    title: "Náklady rekonstrukce",
    text: "Orientujte se v rozsahu prací a rezervě.",
    icon: Wrench,
  },
  {
    href: "/kalkulacky/financovani",
    title: "Financování",
    text: "Spočítejte splátku a potřebu vlastních prostředků.",
    icon: Landmark,
  },
  {
    href: "/ukazky",
    title: "Modelové studie",
    text: "Prohlédněte ověřené ukázky metodiky analýzy.",
    icon: Sparkles,
  },
] as const;

export default function AnalyzyAKalkulackyPage() {
  const inquiry = publicCheckoutMode() === "inquiry";
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

      <section className="mt-10 rounded-[var(--radius-card)] bg-[var(--surface-inverse)] p-6 text-white sm:p-8">
        <h2 className="font-display text-2xl sm:text-3xl">
          {publicCustomerOffer.nameCs}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          {publicCustomerOffer.summaryCs}
        </p>
        <p className="mt-4 font-metric text-2xl">
          {formatCzk(publicCustomerOffer.priceGrossCzk)}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={
              inquiry
                ? "/sluzby/analyza-pred-koupi#poptavka"
                : "/checkout?product=deep_analysis"
            }
            className="inline-flex h-11 items-center rounded-[var(--radius-lg)] bg-[var(--action-accent)] px-5 text-sm font-semibold text-white"
          >
            {inquiry ? "Poptat analýzu" : "Objednat analýzu"}
          </Link>
          <Link
            href="/ukazky/byt-dlouhodoby-pronajem"
            className="inline-flex h-11 items-center rounded-[var(--radius-lg)] border border-white/40 px-5 text-sm font-medium"
          >
            Prohlédnout ukázku
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-[var(--text-primary)]">
          Hlavní nástroje
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-raised)]"
            >
              <tool.icon className="size-6 text-[var(--action-accent)]" aria-hidden />
              <h3 className="mt-4 font-medium text-[var(--text-primary)]">{tool.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{tool.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl text-[var(--text-primary)]">
          Všechny kalkulačky
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {MEGA_KALKULACKY.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--action-accent)]"
              >
                <Calculator className="size-4 text-[var(--action-accent)]" aria-hidden />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </StandardPageLayout>
  );
}
