import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import { ServiceOfferPage } from "@/components/marketing/service-offer-page";
import { PropertyAuditInquiryForm } from "@/components/marketing/property-audit-inquiry-form";
import { StandardPageLayout } from "@/components/layout/page-layouts";

export const metadata: Metadata = preparePageMeta({
  title: "Analýza nemovitosti před koupí",
  description:
    "Jednorázová analýza konkrétní nemovitosti: ekonomika, náklady, scénáře, rizika a doporučené další ověření.",
  path: "/sluzby/analyza-pred-koupi",
});

export default function AnalyzaPredKoupiPage() {
  return (
    <>
      <ServiceOfferPage
        productKey="deep_analysis"
        title="Analýza nemovitosti před koupí"
        description="Prověříme dostupná data k nabídce a připravíme srozumitelný rozbor před rozhodnutím."
        forWhom={[
          "Kupující, kteří zvažují konkrétní byt nebo dům",
          "Investoři před nabídkou",
          "Lidé, kteří chtějí oddělit fakta od domněnek",
        ]}
        deliverables={[
          "Ekonomika koupě a celkové náklady",
          "Provozní náklady vlastníka",
          "Scénáře a financování",
          "Rizika a chybějící podklady",
          "Doporučené další ověření před podpisem",
        ]}
        inputs={[
          "Odkaz na inzerát (i mimo Majetio) nebo základní údaje",
          "Účel koupě (bydlení / investice)",
          "Známé náklady, rekonstrukce a vlastní zdroje, pokud je máte",
        ]}
        timeline="Termín dodání potvrdíme po přijetí podkladů. Nezačíná odesláním formuláře."
        revisions="Jedna konzultace k výsledku je součástí. Další rozsah domluvíme individuálně."
        sampleHref="/ukazky"
        ctaHref="#poptavka"
        ctaLabel="Nezávazně poptat analýzu"
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/cenik", label: "Ceník" },
          { label: "Analýza před koupí" },
        ]}
      />
      <StandardPageLayout>
        <div id="poptavka" className="scroll-mt-24 pb-16">
          <h2 className="font-display text-2xl">Nezávazná poptávka</h2>
          <p className="mt-2 mb-6 max-w-2xl text-sm text-[var(--text-secondary)]">
            Odeslání není objednávkou ani platbou. Automatické stahování cizích inzerátů
            neprovádíme, pokud to není oprávněně a technicky dostupné.
          </p>
          <PropertyAuditInquiryForm id="analyza-poptavka" />
        </div>
      </StandardPageLayout>
    </>
  );
}
