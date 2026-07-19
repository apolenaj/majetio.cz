import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyIdentityGrid } from "@/components/property/property-identity-grid";
import { PropertyDecisionActions } from "@/components/property/property-decision-actions";
import { PropertyPriceBlock } from "@/components/property/property-price-block";
import { PropertyQuickSummary } from "@/components/property/property-quick-summary";
import { PropertyScorePanel } from "@/components/property/property-score-panel";
import { PropertyValuationCompare } from "@/components/property/property-valuation-compare";
import { PropertyInvestmentOverview } from "@/components/property/property-investment-overview";
import { ScenarioSwitcher } from "@/components/property/property-scenario-switcher";
import { PropertyFinancingSection } from "@/components/property/property-financing-section";
import { PropertyRenovationSection } from "@/components/property/property-renovation-section";
import { InlineAlert } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import {
  buildPropertyDetailBreadcrumbs,
  loadPropertyDetailBySlug,
  propertyListingStatusTone,
} from "@/domains/properties/service/detail-loader";
import { resolveMatchProfile } from "@/components/property/search/discovery-listing";
import {
  computePropertyMatchScore,
  listingToMatchInput,
} from "@/domains/properties/service";
import { getPropertyFinancialDemo } from "@/content/demo-property-financial";
import { loadFinancialPassport } from "@/lib/financial-passport/actions";
import {
  loadHypotekaHandoffPreview,
  type HandoffPreviewData,
} from "@/lib/financing/handoff-actions";
import { createHypotekaJasneClient } from "@/integrations/hypotekajasne";
import type { FinancingPreviewResponse } from "@/integrations/hypotekajasne";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await loadPropertyDetailBySlug(slug);
  if (!property) {
    return { title: "Nemovitost nenalezena", robots: { index: false } };
  }
  const place =
    property.location.label ??
    property.location.city ??
    "Demonstrační detail Majetio";
  return {
    title: property.title,
    description: `${place} — detail nemovitosti Majetio.`,
    robots: { index: false, follow: true },
    alternates: { canonical: `/nemovitosti/${property.slug}` },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const property = await loadPropertyDetailBySlug(slug);
  if (!property) notFound();

  const statusTone = propertyListingStatusTone(property.status);
  const locationLine = [
    property.location.addressLine,
    property.location.district,
    property.location.city,
  ]
    .filter(Boolean)
    .join(", ");

  const { isAuthenticated, matchProfile } = await resolveMatchProfile();
  const matchScore = computePropertyMatchScore(
    listingToMatchInput({
      id: property.id,
      askingPrice: property.askingPrice,
      location: property.location,
      propertyType: property.propertyType,
      layout: property.layout,
      usableArea: property.usableArea,
      condition: property.condition,
      tags: property.tags,
      grossYieldPct: property.grossYieldPct,
      risk: property.risk,
      dataQuality: property.dataQuality,
    }),
    matchProfile,
  );

  const financial = getPropertyFinancialDemo(property.slug);

  let equityUsedCzk: number | null = null;
  let equitySource: "passport" | "demo" | "none" = "none";
  let financingPreview: FinancingPreviewResponse | null = null;
  let handoffPreview: HandoffPreviewData | null = null;

  if (isAuthenticated) {
    const passport = await loadFinancialPassport();
    if (passport.ok && passport.state.availableEquityCzk != null) {
      equityUsedCzk = passport.state.availableEquityCzk;
      equitySource = "passport";
    }
    const handoff = await loadHypotekaHandoffPreview();
    if (handoff.ok) handoffPreview = handoff.data;
  }

  if (equityUsedCzk == null) {
    const demoEquity =
      financial?.scenarios.find((s) => s.assumptionDefaults?.equityCzk != null)
        ?.assumptionDefaults?.equityCzk ?? null;
    if (demoEquity != null) {
      equityUsedCzk = demoEquity;
      equitySource = "demo";
    }
  }

  if (property.askingPrice != null && equityUsedCzk != null) {
    const client = createHypotekaJasneClient();
    financingPreview = await client.getFinancingPreview({
      propertyPriceCzk: property.askingPrice,
      availableEquityCzk: equityUsedCzk,
      termYears: 30,
    });
  }

  const returnPath = `/nemovitosti/${property.slug}`;

  return (
    <>
      <Container className="overflow-x-hidden py-10 sm:py-14 pb-28 lg:pb-14">
        <PageHeader
          title={property.title}
          description={
            property.location.precision === "HIDDEN"
              ? property.location.city
                ? `${property.location.city} — přesná adresa je skrytá`
                : "Přesná adresa je skrytá"
              : locationLine || property.location.label || undefined
          }
          breadcrumbs={buildPropertyDetailBreadcrumbs(property)}
          badge={
            property.isDemo ? <Badge tone="premium">Demo</Badge> : undefined
          }
        />

        <div className="mb-8 space-y-3">
          {property.isDemo ? (
            <InlineAlert tone="warning" title="Demonstrační nemovitost">
              Tato stránka ukazuje kanonická demo data Majetio. Nejde o reálnou
              nabídku k prodeji.
            </InlineAlert>
          ) : null}

          {statusTone === "unavailable" ? (
            <InlineAlert tone="error" title="Nabídka nemusí být dostupná">
              Stav nabídky je „nedostupná“. Údaje zůstávají pro kontext, ale
              nemovitost už nemusí být na trhu.
            </InlineAlert>
          ) : null}

          {statusTone === "archived" ? (
            <InlineAlert tone="warning" title="Archivovaná nabídka">
              Tato nabídka je v archivu. Informace slouží jako historický záznam.
            </InlineAlert>
          ) : null}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-10">
            <PropertyGallery media={property.media} title={property.title} />

            <div className="lg:hidden">
              <PropertyPriceBlock
                askingPrice={property.askingPrice}
                pricePerSqm={property.pricePerSqm}
                priceHistory={property.priceHistory}
              />
            </div>

            <PropertyQuickSummary
              property={property}
              estimatedValueMidCzk={financial?.valuation?.midCzk ?? null}
            />

            <PropertyScorePanel
              majetioScore={property.majetioScore}
              matchScore={isAuthenticated ? matchScore : null}
              isAuthenticated={isAuthenticated}
            />

            <PropertyValuationCompare
              askingPrice={property.askingPrice}
              valuation={financial?.valuation ?? null}
            />

            <PropertyInvestmentOverview
              investment={financial?.investment ?? null}
              fallbackGrossYieldPct={property.grossYieldPct}
              fallbackCashFlowMonthlyCzk={property.cashFlowMonthlyCzk}
            />

            <ScenarioSwitcher
              scenarios={financial?.scenarios ?? []}
              isAuthenticated={isAuthenticated}
              returnPath={returnPath}
            />

            <PropertyFinancingSection
              askingPrice={property.askingPrice}
              equityUsedCzk={equityUsedCzk}
              equitySource={equitySource}
              preview={financingPreview}
              handoffPreview={handoffPreview}
              isAuthenticated={isAuthenticated}
              returnPath={returnPath}
            />

            <PropertyRenovationSection
              renovation={financial?.renovation ?? null}
            />

            <PropertyIdentityGrid property={property} />

            {property.description ? (
              <section aria-labelledby="property-desc-heading">
                <h2
                  id="property-desc-heading"
                  className="font-display text-xl text-[var(--text-primary)]"
                >
                  Popis
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {property.description}
                </p>
              </section>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <PropertyDecisionActions
              property={{
                id: property.id,
                slug: property.slug,
                title: property.title,
                askingPrice: property.askingPrice,
                pricePerSqm: property.pricePerSqm,
                priceHistory: property.priceHistory,
                locationLabel:
                  locationLine || property.location.label || "Lokalita neuvedena",
                isDemo: property.isDemo,
              }}
            />
          </aside>
        </div>
      </Container>
    </>
  );
}
