import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import { ServiceOfferPage } from "@/components/marketing/service-offer-page";
import { PropertyAuditInquiryForm } from "@/components/marketing/property-audit-inquiry-form";
import { StandardPageLayout } from "@/components/layout/page-layouts";

export const metadata: Metadata = preparePageMeta({
  title: "Hledání nemovitosti na zadání",
  description:
    "30denní projekt hledání podle schváleného zadání. Posoudíme až pět kandidátů a dodáme průběžný výstup.",
  path: "/sluzby/hledani-na-zadani",
});

export default function HledaniNaZadaniPage() {
  return (
    <>
      <ServiceOfferPage
        productKey="property_search_project"
        title="Hledání nemovitosti na zadání"
        description="Společně schválíme zadání, hledáme v dostupných nabídkách a posoudíme omezený počet kandidátů."
        forWhom={[
          "Kupující s jasným rozpočtem a lokalitou",
          "Lidé, kteří nemají čas procházet katalog sami",
          "Zájemci, kteří chtějí strukturovaný výstup, ne náhodné tipy",
        ]}
        deliverables={[
          "Schválené zadání",
          "30denní období projektu",
          "Posouzení až pěti kandidátů",
          "Průběžný výstup a doporučení dalšího postupu",
        ]}
        inputs={[
          "Lokalita a typ nemovitosti",
          "Rozpočet a financování",
          "Musí mít / nesmí mít",
          "Termín a ochota ke kompromisům",
        ]}
        timeline="Období začíná po schválení zadání. Pokud vhodná nabídka není, dodáme shrnutí a doporučení."
        revisions="Rozsah kandidátů je omezený na pět posouzení v základní ceně."
        ctaHref="#poptavka"
        ctaLabel="Nezávazně poptat hledání"
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/cenik", label: "Ceník" },
          { label: "Hledání na zadání" },
        ]}
      />
      <StandardPageLayout>
        <div id="poptavka" className="scroll-mt-24 pb-16">
          <h2 className="font-display text-2xl">Nezávazná poptávka</h2>
          <p className="mt-2 mb-6 max-w-2xl text-sm text-[var(--text-secondary)]">
            Popište lokalitu, rozpočet a požadavky. Odeslání není závaznou objednávkou.
          </p>
          <PropertyAuditInquiryForm id="hledani-poptavka" />
        </div>
      </StandardPageLayout>
    </>
  );
}
