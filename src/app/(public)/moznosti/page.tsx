import type { Metadata } from "next";
import Link from "next/link";

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
    text: "Spoluinvestoři, podíly, čekací listina — bez přijímání peněz bez právního modelu.",
  },
  {
    href: "/moznosti/castecna-koupe",
    title: "Částečná koupě a bydlení",
    text: "Podíl, nájem za nevlastněnou část, postupný odkup jako oddělené varianty.",
  },
  {
    href: "/moznosti/sdileny-najem",
    title: "Sdílený nájem",
    text: "Párování rozpočtů a preferencí spolubydlení.",
  },
  {
    href: "/moznosti/nabidnete-cenu",
    title: "Nabídněte cenu",
    text: "Neveřejný práh majitele a nezávazné nabídky.",
  },
  {
    href: "/moznosti/aukce",
    title: "Aukce",
    text: "Konfigurovatelný modul s atomickými příhozy.",
  },
  {
    href: "/moznosti/bydleni-za-vypomoc",
    title: "Bydlení za výpomoc",
    text: "Ubytování výměnou za pomoc — ověření bez falešných štítků.",
  },
  {
    href: "/moznosti/smena",
    title: "Směna",
    text: "Protinabídky včetně nepeněžních položek.",
  },
  {
    href: "/moznosti/zahranicni",
    title: "Zahraniční nemovitosti",
    text: "Země, měna, jednotky — kurz jen orientačně.",
  },
] as const;

export default function MoznostiPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Možnosti bydlení a investování"
        description="Složité cesty jsou seskupené zde — ne jako dvanáct stejně výrazných tlačítek v hlavním menu."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Možnosti" }]}
      />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-lg border border-[var(--border-default)] p-5 transition-colors hover:border-[var(--border-strong)]"
            >
              <h2 className="font-display text-xl text-[var(--text-primary)]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </StandardPageLayout>
  );
}
