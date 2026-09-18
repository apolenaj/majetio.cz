import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { InlineAlert } from "@/components/feedback/states";
import { ModeInterestForm } from "@/components/marketplace/mode-interest-form";

const PAGES: Record<
  string,
  { title: string; description: string; mode: string; alert: string; amount?: boolean }
> = {
  "sdileny-najem": {
    title: "Sdílený nájem",
    description:
      "Lokalita, rozpočet (s/bez služeb), termín, počet osob — párování bez zveřejnění kontaktů.",
    mode: "SHARED_RENT",
    alert: "Součet rozpočtů musí pokrývat jasně definované náklady. Nájem bez služeb ≠ celkový rozpočet.",
  },
  "nabidnete-cenu": {
    title: "Nabídněte cenu",
    description:
      "Majitel musí režim výslovně aktivovat. Neveřejný práh není ve veřejném API.",
    mode: "OFFER_PRICE",
    alert: "Automatické odmítnutí nižší nabídky nesmí prozradit práh ani vytvořit závaznou koupi.",
    amount: true,
  },
  aukce: {
    title: "Aukce",
    description:
      "Konfigurovatelný modul s atomickými příhozy a serverovým časem. Ostrá aktivace po právních pravidlech.",
    mode: "AUCTION",
    alert: "Nejvyšší příhoz ≠ převod nemovitosti. Závaznost příhozů je otevřená otázka.",
    amount: true,
  },
  "bydleni-za-vypomoc": {
    title: "Bydlení za výpomoc",
    description:
      "Popis výpomoci, hodin, ubytování, délky a podmínek. Poplatek 1000 Kč — plátce a okamžik vzniku nevyjasněn.",
    mode: "HOUSING_HELP",
    alert: "Ověření není falešný automatický štítek. Platba 1000 Kč není aktivní, dokud není jasný plátce.",
  },
  smena: {
    title: "Směna",
    description:
      "Ochota ke směně, protinabídky včetně nepeněžních položek — přijetí = pokračování v jednání.",
    mode: "SWAP",
    alert: "Nepeněžní položky nemusí být nemovitosti. Nepřenášejte na ně nemovitostní datový model.",
  },
  zahranicni: {
    title: "Zahraniční nemovitosti",
    description:
      "Země, adresa, měna, jednotky. Přepočet kurzu jen orientačně se zdrojem a datem.",
    mode: "FOREIGN_INFO",
    alert: "Nevkládejte univerzální české podmínky koupě do zahraničních nabídek.",
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) {
    return { title: "Možnost nenalezena" };
  }
  return preparePageMeta({
    title: page.title,
    description: page.description,
    path: `/moznosti/${slug}`,
  });
}

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export default async function MoznostSlugPage({ params }: Props) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) {
    return (
      <StandardPageLayout>
        <PageHeader title="Nenalezeno" description="Tato možnost neexistuje." />
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout>
      <PageHeader
        title={page.title}
        description={page.description}
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/moznosti", label: "Možnosti" },
          { label: page.title },
        ]}
      />
      <InlineAlert tone="info" title="Stav implementace" className="mb-6">
        {page.alert}
      </InlineAlert>
      <ModeInterestForm
        mode={page.mode}
        showAmount={page.amount}
        extraFields={
          <label className="block text-sm font-medium">
            ID nabídky (volitelné)
            <input
              name="propertyId"
              className="mt-1 w-full rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm"
            />
          </label>
        }
      />
    </StandardPageLayout>
  );
}
