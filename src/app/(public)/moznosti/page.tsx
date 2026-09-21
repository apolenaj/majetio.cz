import type { Metadata } from "next";
import Link from "next/link";
import {
  Gavel,
  Home,
  KeyRound,
  MapPinned,
  PiggyBank,
  RefreshCw,
  Scale,
  Users,
} from "lucide-react";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";

export const metadata: Metadata = preparePageMeta({
  title: "Možnosti bydlení a investování",
  description:
    "Alternativní režimy vedle klasického prodeje a pronájmu — sdílená investice, částečná koupě, aukce a další.",
  path: "/moznosti",
});

const ITEMS = [
  {
    href: "/moznosti/sdilena-investice",
    title: "Sdílená investice",
    text: "Hledejte spoluinvestory k konkrétní nabídce.",
    icon: Users,
  },
  {
    href: "/moznosti/castecna-koupe",
    title: "Částečná koupě",
    text: "Kupte podíl a zbytek řešte nájem nebo postupný odkup.",
    icon: Scale,
  },
  {
    href: "/moznosti/sdileny-najem",
    title: "Sdílený nájem",
    text: "Spojte rozpočty pro společné bydlení.",
    icon: Home,
  },
  {
    href: "/moznosti/nabidnete-cenu",
    title: "Nabídněte cenu",
    text: "Pošlete nabídku pod inzerovanou cenu.",
    icon: PiggyBank,
  },
  {
    href: "/moznosti/aukce",
    title: "Aukce",
    text: "Připravovaná aukční cesta — zatím poptávka, ne ostrý prodej.",
    icon: Gavel,
  },
  {
    href: "/moznosti/bydleni-za-vypomoc",
    title: "Bydlení za výpomoc",
    text: "Ubytování výměnou za domluvenou pomoc.",
    icon: KeyRound,
  },
  {
    href: "/moznosti/smena",
    title: "Směna nemovitostí",
    text: "Nabídněte protinávrh včetně nepeněžních položek.",
    icon: RefreshCw,
  },
  {
    href: "/zahranicni-nemovitosti",
    title: "Zahraniční nemovitosti",
    text: "Nabídky mimo ČR s jasnou měnou a lokalitou.",
    icon: MapPinned,
  },
] as const;

export default function MoznostiPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Možnosti bydlení a investování"
        description="Alternativy ke klasickému prodeji a pronájmu. Každá cesta má vlastní pravidla — kliknutí není převod vlastnictví."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Možnosti bydlení" },
        ]}
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-raised)] transition-colors hover:border-[var(--action-accent)]"
          >
            <item.icon className="size-5 text-[var(--action-accent)]" aria-hidden />
            <h2 className="mt-3 font-medium text-[var(--text-primary)]">{item.title}</h2>
            <p className="mt-1.5 text-sm text-[var(--text-muted)]">{item.text}</p>
          </Link>
        ))}
      </div>
    </StandardPageLayout>
  );
}
