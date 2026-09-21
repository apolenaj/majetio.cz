import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyIdentityGrid } from "@/components/property/property-identity-grid";
import { PropertyDecisionActions } from "@/components/property/property-decision-actions";
import { PropertyPriceBlock } from "@/components/property/property-price-block";
import { PropertyQuickSummary } from "@/components/property/property-quick-summary";
import { PropertyScorePanel } from "@/components/property/property-score-panel";
import { PropertyValuationCompare } from "@/components/property/property-valuation-compare";
import { PropertyValuationComparables } from "@/components/property/property-valuation-comparables";
import { PropertyValuationAdjustments } from "@/components/property/property-valuation-adjustments";
import { PropertyValuationDisclaimer } from "@/components/property/property-valuation-disclaimer";
import { MarketCapabilityNotice } from "@/components/markets/market-capability-notice";
import { isCapabilityUiAvailable } from "@/domains/markets";
import { PropertyInvestmentOverview } from "@/components/property/property-investment-overview";
import { ScenarioSwitcher } from "@/components/property/property-scenario-switcher";
import { FinancingSummary } from "@/components/financing/financing-summary";
import { PropertyDetailFinancing } from "@/components/property/property-detail-financing";
import { PropertyRenovationSection } from "@/components/property/property-renovation-section";
import { PropertyRisksSection } from "@/components/property/property-risks-section";
import { PropertyProvenanceSection } from "@/components/property/property-provenance-section";
import { PropertySimilarSection } from "@/components/property/property-similar-section";
import { PropertyDetailSectionNav } from "@/components/property/property-detail-section-nav";
import { PropertyDetailAnalytics } from "@/components/property/property-detail-analytics";
import { MobileDisclosure } from "@/components/property/mobile-disclosure";
import { PropertyNotesPanel } from "@/components/decision-workspace/property-notes-panel";
import { DecisionChecklistPanel } from "@/components/decision-workspace/decision-checklist-panel";
import {
  LazyPropertyLocationSection,
  LazyPropertyMarketHistorySection,
} from "@/components/property/property-detail-lazy";
import { InlineAlert } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { loadPropertyValuationBySlug } from "@/domains/valuation/service/valuation-loader";
import { PropertyValuationAnalytics } from "@/components/property/property-valuation-analytics";
import {
  buildPropertyDetailBreadcrumbs,
  loadPropertyDetailBySlug,
  propertyListingStatusTone,
} from "@/domains/properties/service/detail-loader";
import {
  buildPropertyDetailJsonLd,
  buildPropertyDetailMetadata,
} from "@/domains/properties/service/detail-seo";
import { resolveMatchProfile } from "@/components/property/search/discovery-listing";
import {
  computePropertyMatchScore,
  listingToMatchInput,
  mapPublicDtoToPropertyCard,
} from "@/domains/properties/service";
import { getPropertyFinancialDemo } from "@/content/demo-property-financial";
import { getPropertyContextDemo } from "@/content/demo-property-context";
import { getDemoPublicProperty } from "@/content/demo-canonical-properties";
import { resolveDaysOnMarket, daysBetweenIso } from "@/domains/properties/service/market-timing";
import { getCachedMortgageOffers } from "@/domains/financing/service/mortgage-rates";
import { mortgageLeadService } from "@/domains/leads";
import { loadFinancialPassport } from "@/lib/financial-passport/actions";
import { auth } from "@/lib/auth";
import { resolveLocationIntelligenceForProperty } from "@/domains/locations/integration";
import { PropertyInquiryForm } from "@/components/listings/property-inquiry-form";
import { CoPurchaseForm, PriceOfferForm } from "@/components/listings/negotiation-forms";
import { CatalogPropertyDetail } from "@/components/property/search/catalog-property-detail";
import { PropertyFeaturesPanel } from "@/components/property/property-features-panel";
import { AnalysisOfferCard } from "@/components/property/analysis-offer-card";
import { getSiteOrigin } from "@/domains/seo/site-origin";
import { catalogPropertyHref, findCatalogPropertyBySlug } from "@/lib/mock-properties";
import { formatCzk } from "@/lib/format";
import {
  buildPublicFeatureGroups,
  detailsFromJson,
  landUtilitiesFromDetailsJson,
} from "@/domains/properties/parameters";
import {
  areaLabel,
  conditionLabel,
  energyLabel,
  floorLabel,
  ownershipLabel,
  propertyTypeLabel,
} from "@/domains/properties/service/identity-labels";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const catalog = findCatalogPropertyBySlug(slug);
  if (catalog) {
    const sale = catalog.typ_transakce === "prodej";
    const kind = catalog.typ_nemovitosti === "byt" ? "bytu" : "nemovitosti";
    const title = `${sale ? "Prodej" : "Pronájem"} ${kind}${catalog.dispozice ? ` ${catalog.dispozice}` : ""}, ${catalog.plocha_m2} m², ${catalog.lokalita}`;
    const description = `${catalog.nazev}. ${formatCzk(catalog.cena)}${sale ? "" : " měsíčně"}, ${catalog.lokalita}. Ukázková nabídka, ne živý inzerát.`;
    const url = `${getSiteOrigin()}${catalogPropertyHref(catalog.id)}`;
    return {
      title,
      description,
      robots: { index: false, follow: false },
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "website" },
    };
  }
  const property = await loadPropertyDetailBySlug(slug);
  if (!property) {
    return { title: "Nemovitost nenalezena", robots: { index: false } };
  }
  return buildPropertyDetailMetadata(property);
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const catalog = findCatalogPropertyBySlug(slug);
  if (catalog) {
    return <CatalogPropertyDetail property={catalog} />;
  }
  const property = await loadPropertyDetailBySlug(slug);
  if (!property) notFound();

  // Listing analytics (136) — impressions only, no visitor PII
  void import("@/domains/listing-analytics/service")
    .then(({ recordListingMetric }) =>
      recordListingMetric({
        propertyId: property.id,
        metric: "impressions",
      }),
    )
    .catch(() => undefined);

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
  const context = getPropertyContextDemo(property.slug);
  const valuation = await loadPropertyValuationBySlug(property.slug);
  // Incomplete / non-valuable listings must still render identity + lifecycle —
  // never hard-404 solely because the estimate engine has nothing to say.

  const locationIntel = await resolveLocationIntelligenceForProperty({
    propertyType: property.propertyType,
    condition: property.condition,
    layout: property.layout,
    pricePerSqm: property.pricePerSqm,
    askingPrice: property.askingPrice,
    usableArea: property.usableArea,
    locationCity: property.location.city,
    locationDistrict: property.location.district,
  });

  const daysOnMarket = resolveDaysOnMarket({
    publishedAt: property.publishedAt,
    overrideDays: context?.market?.daysOnMarket ?? null,
  });
  const daysSinceVerified = daysBetweenIso(property.lastSeenAt);

  const similarItems = (context?.similar ?? [])
    .map((alt) => {
      const dto = getDemoPublicProperty(alt.slug);
      if (!dto || dto.slug === property.slug) return null;
      return {
        card: mapPublicDtoToPropertyCard(dto),
        reason: alt.reason,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .slice(0, 6);

  let passportState = null;
  let activeFinancingLead = null;
  const [{ offers, freshness }] = await Promise.all([
    getCachedMortgageOffers(),
  ]);

  const session = await auth();
  if (session?.user?.id) {
    const passport = await loadFinancialPassport();
    if (passport.ok) passportState = passport.state;
    activeFinancingLead = await mortgageLeadService.findActiveMortgageLeadForContext({
      userId: session.user.id,
      propertyId: property.id,
    });
  }

  const returnPath = `/nemovitosti/${property.slug}`;
  const jsonLd = buildPropertyDetailJsonLd(property);

  const valuationWithLocation =
    valuation &&
    valuation.kind === "public" &&
    locationIntel.valuationContext
      ? {
          ...valuation,
          locationMarketContext: {
            medianAskingPriceSqm:
              locationIntel.valuationContext.medianAskingPriceSqm,
            medianTransactionPriceSqm:
              locationIntel.valuationContext.medianTransactionPriceSqm,
            priceTrendYoYPct: locationIntel.valuationContext.priceTrendYoYPct,
            segmentLabel: locationIntel.valuationContext.segmentKey,
            period: locationIntel.valuationContext.period,
            methodologyHref: locationIntel.valuationContext.methodologyHref,
            disclaimer: locationIntel.valuationContext.disclaimer,
          },
        }
      : valuation;

  return (
    <>
      <JsonLd id="property-detail" data={jsonLd} />
      <PropertyDetailAnalytics
        slug={property.slug}
        isDemo={property.isDemo}
        hasAskingPrice={property.askingPrice != null}
        visibility={property.visibility}
      />
      {valuation ? (
        <PropertyValuationAnalytics
          slug={property.slug}
          status={valuation.status}
          confidenceLevel={valuation.confidenceLevel}
          isDemo={valuation.isDemo}
          hasEstimate={valuation.estimateMidCzk != null}
        />
      ) : null}
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

        <div className="mb-6 space-y-3">
          {property.isDemo ? (
            <InlineAlert tone="warning" title="Demonstrační nemovitost">
              Tato stránka ukazuje kanonická demo data Majetio. Nejde o reálnou
              nabídku k prodeji.
            </InlineAlert>
          ) : null}

          {statusTone === "unavailable" ? (
            <InlineAlert tone="error" title="Nabídka nemusí být dostupná">
              Stav nabídky je „nedostupná“, „prodáno“ nebo obdobný. Údaje zůstávají
              pro kontext, ale nemovitost už nemusí být na trhu.
            </InlineAlert>
          ) : null}

          {statusTone === "reserved" ? (
            <InlineAlert tone="warning" title="Rezervováno">
              Nabídka je ve stavu rezervace. Podmínky a dostupnost ověřte před
              rozhodnutím — nejde o potvrzený prodej.
            </InlineAlert>
          ) : null}

          {statusTone === "archived" ? (
            <InlineAlert tone="warning" title="Archivovaná nabídka">
              Tato nabídka je v archivu. Informace slouží jako historický záznam.
            </InlineAlert>
          ) : null}
        </div>

        <PropertyDetailSectionNav marketCode="CZ" locale="cs-CZ" />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-10">
            <section id="prehled" className="scroll-mt-28 space-y-10">
              <PropertyGallery media={property.media} title={property.title} />

              <div className="lg:hidden space-y-3">
                <PropertyPriceBlock
                  askingPrice={property.askingPrice}
                  pricePerSqm={property.pricePerSqm}
                  priceHistory={property.priceHistory}
                />
                {property.askingPrice != null && property.askingPrice > 0 ? (
                  <FinancingSummary
                    propertyPriceCzk={property.askingPrice}
                    propertyUrl={`${getSiteOrigin()}/nemovitosti/${property.slug}`}
                    variant="compact"
                    sourceContext="property_detail"
                  />
                ) : null}
              </div>

              <PropertyQuickSummary
                property={property}
                estimatedValueMidCzk={valuation?.estimateMidCzk ?? null}
              />

              <PropertyScorePanel
                majetioScore={property.majetioScore}
                matchScore={isAuthenticated ? matchScore : null}
                isAuthenticated={isAuthenticated}
              />
            </section>

            <section id="ekonomika" className="scroll-mt-28 space-y-10">
              <MarketCapabilityNotice
                marketCode={property.marketCode}
                capability="VALUATION"
              />
              {valuation &&
              isCapabilityUiAvailable({
                marketCode: property.marketCode,
                capability: "VALUATION",
              }) ? (
                <>
                  <PropertyValuationCompare valuation={valuationWithLocation} />
                  <PropertyValuationComparables
                    slug={property.slug}
                    valuation={valuation}
                  />
                  <PropertyValuationAdjustments valuation={valuation} />
                  <PropertyValuationDisclaimer
                    slug={property.slug}
                    valuation={valuation}
                  />
                </>
              ) : null}

              <PropertyInvestmentOverview
                investment={financial?.investment ?? null}
                fallbackGrossYieldPct={property.grossYieldPct}
                fallbackCashFlowMonthlyCzk={property.cashFlowMonthlyCzk}
                locationBenchmark={locationIntel.investmentBenchmark}
              />
            </section>

            <section id="scenare" className="scroll-mt-28">
              <ScenarioSwitcher
                scenarios={financial?.scenarios ?? []}
                isAuthenticated={isAuthenticated}
                returnPath={returnPath}
              />
            </section>

            <section id="financovani" className="scroll-mt-28 space-y-10">
              {property.askingPrice != null && property.askingPrice > 0 ? (
                <FinancingSummary
                  propertyPriceCzk={property.askingPrice}
                  propertyUrl={`${getSiteOrigin()}/nemovitosti/${property.slug}`}
                  variant="section"
                  sourceContext="property_detail"
                />
              ) : null}

              <PropertyDetailFinancing
                propertyId={property.id}
                propertySlug={property.slug}
                askingPriceCzk={property.askingPrice}
                valuationCzk={valuation?.estimateMidCzk ?? null}
                offers={offers}
                freshness={freshness}
                isAuthenticated={isAuthenticated}
                passportState={passportState}
                activeFinancingLead={activeFinancingLead}
              />

              <PropertyRenovationSection
                renovation={financial?.renovation ?? null}
              />
            </section>

            <section id="rizika" className="scroll-mt-28">
              <PropertyRisksSection
                risks={[
                  ...(context?.risks ?? []),
                  ...locationIntel.locationRisks.propertyRiskItems,
                ]}
                checklist={context?.checklist ?? []}
                dueDiligenceStatus={context?.dueDiligenceStatus ?? null}
                dueDiligenceNote={context?.dueDiligenceNote ?? null}
              />
            </section>

            <AnalysisOfferCard
              property={{
                id: property.id,
                slug: property.slug,
                title: property.title,
                canonicalUrl: `${getSiteOrigin()}/nemovitosti/${property.slug}`,
                locality:
                  locationLine ||
                  property.location.label ||
                  property.location.city ||
                  "Nutno ověřit",
                askingPrice: property.askingPrice,
                currency: property.currency,
                transactionType: property.transactionType,
                propertyType: property.propertyType,
                isDemo: property.isDemo,
                layout: property.layout,
                usableArea: property.usableArea,
              }}
            />

            <section id="lokalita" className="scroll-mt-28">
              <MobileDisclosure title="Lokalita a mapa (rozbalit)">
                <LazyPropertyLocationSection
                  location={property.location}
                  benchmark={context?.location ?? null}
                  segmentBenchmark={locationIntel.segmentBenchmark}
                  locationPageHref={locationIntel.locationPageHref}
                  opportunityInsight={locationIntel.opportunityInsight}
                  marketContext={locationIntel.marketContext}
                  strRegulatory={locationIntel.strRegulatory}
                  watchSlug={locationIntel.segmentBenchmark.locationSlug}
                />
              </MobileDisclosure>
            </section>

            <section id="historie" className="scroll-mt-28">
              <MobileDisclosure title="Historie ceny (rozbalit)">
                <LazyPropertyMarketHistorySection
                  points={property.priceHistory}
                  daysOnMarket={daysOnMarket}
                  relisted={context?.market?.relisted ?? false}
                  relistNote={context?.market?.relistNote ?? null}
                  publishedAt={property.publishedAt}
                />
              </MobileDisclosure>
            </section>

            <section id="zdroje" className="scroll-mt-28">
              <PropertyProvenanceSection
                sources={property.sources}
                lastSeenAt={property.lastSeenAt}
                freshness={property.freshness}
                fieldConflicts={property.fieldConflicts}
                daysSinceVerified={daysSinceVerified}
              />
            </section>

            <section id="rozhodnuti" className="scroll-mt-28 space-y-6">
              <PropertyNotesPanel
                propertyId={property.id}
                slug={property.slug}
                isAuthenticated={isAuthenticated}
                returnPath={returnPath}
              />
              <DecisionChecklistPanel
                propertyId={property.id}
                slug={property.slug}
                isAuthenticated={isAuthenticated}
                returnPath={returnPath}
                context={{
                  propertyType: property.propertyType,
                  condition: property.condition,
                  risk: property.risk ?? null,
                  tags: property.tags ?? [],
                  hasRenovationEstimate: Boolean(financial?.renovation?.costCzk),
                }}
              />
            </section>

            <section id="alternativa" className="scroll-mt-28">
              <PropertySimilarSection items={similarItems} />
            </section>

            <PropertyIdentityGrid property={property} />

            <PropertyFeaturesPanel
              basicRows={[
                { label: "Typ", value: propertyTypeLabel(property.propertyType) },
                { label: "Dispozice", value: property.layout ?? "Nutno ověřit" },
                {
                  label: "Užitná plocha",
                  value: areaLabel(property.usableArea, property.usableAreaDisplay),
                },
                { label: "Vlastnictví", value: ownershipLabel(property.ownershipType) },
                { label: "Stav", value: conditionLabel(property.condition) },
                {
                  label: "Patro",
                  value: floorLabel(property.floor, property.floorsTotal),
                },
                { label: "PENB", value: energyLabel(property.energyRating) },
              ]}
              groups={buildPublicFeatureGroups({
                propertyType: property.propertyType,
                answers: property.features ?? {},
                details: detailsFromJson(property.featureDetails),
                landUtilities: landUtilitiesFromDetailsJson(property.featureDetails),
              })}
            />

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

          <aside className="lg:sticky lg:top-28 lg:self-start space-y-6">
            <PropertyDecisionActions
              property={{
                id: property.id,
                slug: property.slug,
                title: property.title,
                askingPrice: property.askingPrice,
                pricePerSqm: property.pricePerSqm,
                priceHistory: property.priceHistory,
                locationLabel:
                  locationLine ||
                  property.location.label ||
                  "Lokalita neuvedena",
                isDemo: property.isDemo,
              }}
              activeFinancingLead={activeFinancingLead}
            />
            {!property.isDemo && property.status === "ACTIVE" ? (
              <section
                aria-labelledby="inquiry-heading"
                className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] p-4"
              >
                <h2
                  id="inquiry-heading"
                  className="font-display text-lg text-[var(--text-primary)]"
                >
                  Kontaktovat inzerenta
                </h2>
                <p className="mt-1 mb-4 text-sm text-[var(--text-muted)]">
                  Nezávazná poptávka — neznamená uzavření obchodu ani automatickou
                  odměnu.
                </p>
                <PropertyInquiryForm
                  propertyId={property.id}
                  defaultName={session?.user?.name}
                  defaultEmail={session?.user?.email}
                />
                <div className="mt-4 border-t border-[var(--border-default)] pt-3">
                  <AnalysisOfferCard
                    compact
                    property={{
                      id: property.id,
                      slug: property.slug,
                      title: property.title,
                      canonicalUrl: `${getSiteOrigin()}/nemovitosti/${property.slug}`,
                      locality:
                        locationLine ||
                        property.location.label ||
                        property.location.city ||
                        "Nutno ověřit",
                      askingPrice: property.askingPrice,
                      currency: property.currency,
                      transactionType: property.transactionType,
                      propertyType: property.propertyType,
                      isDemo: property.isDemo,
                      layout: property.layout,
                      usableArea: property.usableArea,
                    }}
                  />
                </div>
              </section>
            ) : null}
            {!property.isDemo && property.transactionType === "SALE" && property.status === "ACTIVE" && property.acceptsPriceOffers ? (
              <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] p-4">
                <h2 className="font-display text-lg text-[var(--text-primary)]">Navrhnout kupní cenu</h2>
                <PriceOfferForm
                  propertyId={property.id}
                  askingPrice={property.askingPrice}
                  currency={property.currency}
                  defaultName={session?.user?.name}
                  defaultEmail={session?.user?.email}
                />
              </section>
            ) : null}
            {!property.isDemo && property.transactionType === "SALE" && property.status !== "ACTIVE" && property.acceptsPriceOffers ? (
              <p className="text-sm text-[var(--text-muted)]">
                Na prodanou, archivovanou nebo jinak neaktivní nabídku nelze poslat nový cenový návrh.
              </p>
            ) : null}
            {!property.isDemo &&
            property.transactionType === "SALE" &&
            property.status === "ACTIVE" &&
            (property.acceptsCoPurchaseSeekPartner || property.acceptsCoPurchaseSellerRetains) ? (
              <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] p-4">
                <h2 className="font-display text-lg text-[var(--text-primary)]">Mám zájem o společnou koupi</h2>
                <CoPurchaseForm
                  propertyId={property.id}
                  askingPrice={property.askingPrice}
                  offeredOwnershipPercent={property.offeredOwnershipPercent}
                  allowSeekPartner={property.acceptsCoPurchaseSeekPartner}
                  allowSellerRetains={property.acceptsCoPurchaseSellerRetains}
                  defaultName={session?.user?.name}
                  defaultEmail={session?.user?.email}
                />
              </section>
            ) : !property.isDemo &&
              property.transactionType === "SALE" &&
              property.status !== "ACTIVE" &&
              (property.acceptsCoPurchaseSeekPartner || property.acceptsCoPurchaseSellerRetains) ? (
              <p className="text-sm text-[var(--text-muted)]">
                Na prodanou, archivovanou nebo jinak neaktivní nabídku nelze poslat novou poptávku společné koupě.
              </p>
            ) : null}
          </aside>
        </div>
      </Container>
    </>
  );
}
