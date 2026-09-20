import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import { ServiceOfferPage } from "@/components/marketing/service-offer-page";
import { PropertyAuditInquiryForm } from "@/components/marketing/property-audit-inquiry-form";
import { StandardPageLayout } from "@/components/layout/page-layouts";
import { prisma } from "@/lib/db";
import { getSiteOrigin } from "@/domains/seo/site-origin";
import { propertyTypeLabel } from "@/domains/properties/service/identity-labels";

export const metadata: Metadata = preparePageMeta({
  title: "Analýza nemovitosti před koupí",
  description:
    "Jednorázová analýza konkrétní nemovitosti: ekonomika, náklady, scénáře, rizika a doporučené další ověření.",
  path: "/sluzby/analyza-pred-koupi",
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function AnalyzaPredKoupiPage({ searchParams }: Props) {
  const params = await searchParams;
  const propertyId = first(params.propertyId);
  let prefill:
    | {
        propertyId: string;
        title: string;
        listingUrl: string;
        locality: string;
        propertyType: string;
        askingPrice: number | null;
        currency: string;
        transactionType: string;
        layout?: string;
        usableArea?: number | null;
        photoUrl?: string | null;
      }
    | undefined;

  if (propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        media: { where: { isPrimary: true }, take: 1 },
      },
    });
    if (property && !property.isDemo && property.status === "ACTIVE") {
      const priceFromQuery = first(params.price);
      const priceNum = priceFromQuery ? Number(priceFromQuery) : null;
      prefill = {
        propertyId: property.id,
        title: property.title,
        listingUrl: `${getSiteOrigin()}/nemovitosti/${property.slug}`,
        locality:
          property.publicLabel ||
          [property.publicDistrict, property.publicCity].filter(Boolean).join(", ") ||
          property.publicCity ||
          "Neuvedeno",
        propertyType: propertyTypeLabel(property.propertyType),
        askingPrice: property.askingPrice,
        currency: property.currency,
        transactionType: property.transactionType,
        layout: property.layout ?? undefined,
        usableArea: property.usableArea,
        photoUrl: property.media[0]?.url ?? null,
      };
      if (
        priceNum != null &&
        Number.isFinite(priceNum) &&
        property.askingPrice != null &&
        priceNum !== property.askingPrice
      ) {
        // Keep current listing price in summary; snapshot warning is handled server-side on submit.
      }
    }
  }

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
        sampleHref="/ukazky/byt-dlouhodoby-pronajem"
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
          <PropertyAuditInquiryForm id="analyza-poptavka" prefill={prefill} />
        </div>
      </StandardPageLayout>
    </>
  );
}
