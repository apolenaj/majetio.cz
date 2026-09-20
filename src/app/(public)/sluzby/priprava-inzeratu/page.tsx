import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import { ServiceOfferPage } from "@/components/marketing/service-offer-page";
import { StandardPageLayout } from "@/components/layout/page-layouts";

export const metadata: Metadata = preparePageMeta({
  title: "Profesionální příprava inzerátu",
  description:
    "Text, struktura, pořadí fotografií a seznam chybějících podkladů. Zveřejnění se kupuje samostatně.",
  path: "/sluzby/priprava-inzeratu",
});

export default function PripravaInzeratuPage() {
  return (
    <>
      <ServiceOfferPage
        productKey="listing_prep"
        title="Profesionální příprava inzerátu"
        description="Připravíme text a strukturu nabídky z vašich podkladů. Fotografování a návštěva nejsou automaticky zahrnuté."
        forWhom={[
          "Majitelé, kteří chtějí kvalitní prezentaci",
          "Inzerenti bez času na copywriting",
          "Firmy, které dodají fotografie a fakta",
        ]}
        deliverables={[
          "Profesionální text a krátký popis",
          "Struktura parametrů",
          "Návrh pořadí dodaných fotografií",
          "Seznam chybějících podkladů",
          "Jedna revize",
        ]}
        inputs={[
          "Základní údaje o nemovitosti",
          "Fotografie (pokud je máte)",
          "Stav, vybavení a podmínky prohlídky",
        ]}
        timeline="Termín začíná po doplnění podkladů, ne po odeslání poptávky."
        revisions="Jedna revize je v ceně. Fotografování, zaměření a návštěva nejsou zahrnuté."
        ctaHref="/kontakt"
        ctaLabel="Nezávazně poptat přípravu"
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/cenik", label: "Ceník" },
          { label: "Příprava inzerátu" },
        ]}
      />
      <StandardPageLayout>
        <p className="pb-12 text-sm text-[var(--text-muted)]">
          Zveřejnění inzerátu kupujete samostatně na{" "}
          <Link href="/cenik#inzerce" className="underline underline-offset-2">
            ceníku
          </Link>{" "}
          nebo přes{" "}
          <Link href="/pridat-nemovitost" className="underline underline-offset-2">
            přidání nemovitosti
          </Link>
          .
        </p>
      </StandardPageLayout>
    </>
  );
}
