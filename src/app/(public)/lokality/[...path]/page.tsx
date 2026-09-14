import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import {
  LocationAvailableProperties,
  LocationDevelopmentSection,
  LocationHero,
  LocationInvestmentMetrics,
  LocationMarketSummary,
  LocationMethodologyBanner,
  LocationNeighbors,
  LocationPriceTrends,
  LocationRisksSection,
  LocationSection,
  LocationSupplyDemand,
  LocationTransportAmenities,
} from "@/components/locations";
import {
  LocationPageAnalytics,
  LocationSectionAnalytics,
} from "@/components/locations/location-analytics";
import { LocationDynamicSummary } from "@/components/locations/location-dynamic-summary";
import { LocationInternalLinks } from "@/components/locations/location-internal-links";
import { LocationMapSection } from "@/components/locations/maps/location-map-section";
import { WatchLocationButton } from "@/components/locations/watch-location-button";
import { preparePageMeta } from "@/components/content/page-helpers";
import { InlineAlert } from "@/components/feedback/states";
import {
  buildDiscoveryCards,
  resolveMatchProfile,
} from "@/components/property/search/discovery-listing";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { INDEXABLE_LOCATION_SLUGS } from "@/domains/locations/content/demo-profiles";
import { buildDynamicMarketSummary } from "@/domains/locations/seo/dynamic-summary";
import { buildLocationSeoJsonLd } from "@/domains/locations/seo/json-ld";
import {
  buildLocationBreadcrumbs,
  isLocationPageIndexable,
  listIndexableCanonicalPaths,
  resolveLocationPathSegments,
} from "@/domains/locations/seo/location-urls";
import { buildDemoMapCells } from "@/domains/locations/maps/geohash-grid";
import { loadLocationPageProfile } from "@/domains/locations/service/location-page-service";
import { EMPTY_PROPERTY_URL_STATE } from "@/domains/properties/search/url-state";

type Props = { params: Promise<{ path: string[] }> };

const CENTROIDS: Record<string, { lat: number; lon: number }> = {
  praha: { lat: 50.0755, lon: 14.4378 },
  brno: { lat: 49.1951, lon: 16.6068 },
  "praha-vinohrady": { lat: 50.075, lon: 14.447 },
};

export async function generateStaticParams() {
  return INDEXABLE_LOCATION_SLUGS.map((slug) => {
    const profilePath =
      resolveLocationPathSegments(slug.split("-")) ??
      resolveLocationPathSegments([slug]);
    const segments =
      profilePath?.profile.location.pathSegments ?? slug.split("/");
    return { path: segments };
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path } = await params;
  const resolved = resolveLocationPathSegments(path);
  if (!resolved) {
    return preparePageMeta({
      title: "Lokalita nenalezena",
      description: "Profil lokality není k dispozici.",
      path: `/lokality/${path.join("/")}`,
      noIndex: true,
    });
  }

  const profile =
    (await loadLocationPageProfile(resolved.profile.location.slug)) ??
    resolved.profile;
  const indexable = isLocationPageIndexable(profile);
  const summary = buildDynamicMarketSummary(profile);

  return preparePageMeta({
    title: `${profile.location.publicLabel} — tržní profil`,
    description: (summary || profile.heroSummary).slice(0, 155),
    path: profile.location.canonicalPath,
    noIndex: !indexable,
  });
}

export default async function LokalitaDetailPage({ params }: Props) {
  const { path } = await params;
  const resolved = resolveLocationPathSegments(path);
  if (!resolved) notFound();

  if (resolved.needsCanonicalRedirect) {
    permanentRedirect(resolved.canonicalPath);
  }

  const profile =
    (await loadLocationPageProfile(resolved.profile.location.slug)) ??
    resolved.profile;

  const indexable = isLocationPageIndexable(profile);
  const marketSummaryText = buildDynamicMarketSummary(profile);
  const jsonLd = buildLocationSeoJsonLd(profile);
  const breadcrumbs = buildLocationBreadcrumbs(profile);

  const { matchProfile, profileComplete } = await resolveMatchProfile();
  const searchState = {
    ...EMPTY_PROPERTY_URL_STATE,
    lokalita: profile.location.searchLokalita,
    razeni: "newest" as const,
  };
  const { cards } = buildDiscoveryCards(searchState, matchProfile, profileComplete);

  const centroid = CENTROIDS[profile.location.slug] ?? CENTROIDS.praha!;
  const asking =
    profile.summary.find((m) => m.key === "property_market.median_asking_price_sqm")
      ?.value ?? 100_000;
  const rent =
    profile.summary.find((m) => m.key === "rental_market.median_asking_rent_sqm")
      ?.value ?? 300;
  const yieldPct =
    (profile.summary.find((m) => m.key === "investment.gross_rental_yield")?.value ??
      3.5) * 100;
  const supply = profile.supplyDemand.activeListings.value ?? 100;

  const mapLayers = {
    price: buildDemoMapCells({
      centroidLat: centroid.lat,
      centroidLon: centroid.lon,
      layer: "price",
      baseValue: asking,
    }),
    rent: buildDemoMapCells({
      centroidLat: centroid.lat,
      centroidLon: centroid.lon,
      layer: "rent",
      baseValue: rent,
    }),
    yield: buildDemoMapCells({
      centroidLat: centroid.lat,
      centroidLon: centroid.lon,
      layer: "yield",
      baseValue: yieldPct,
    }),
    supply: buildDemoMapCells({
      centroidLat: centroid.lat,
      centroidLon: centroid.lon,
      layer: "supply",
      baseValue: Math.max(8, Math.round(supply / 40)),
    }),
  };

  return (
    <Container className="py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LocationPageAnalytics
        locationSlug={profile.location.slug}
        pathDepth={profile.location.pathSegments.length}
        isDemo={profile.isDemo}
        indexable={indexable}
      />

      <nav className="mb-6 text-sm text-[var(--text-muted)]" aria-label="Drobečková navigace">
        <ol className="flex flex-wrap gap-1">
          {breadcrumbs.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {i > 0 ? <span aria-hidden>/</span> : null}
              {c.href ? (
                <a href={c.href} className="text-[var(--text-link)] hover:underline">
                  {c.label}
                </a>
              ) : (
                <span className="text-[var(--text-primary)]">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {!indexable ? (
        <InlineAlert tone="warning" title="Stránka není indexována" className="mb-6">
          Pro tuto lokalitu zatím není dostatek agregovaných metrik. Zobrazení je dostupné,
          ale robots: noindex.
        </InlineAlert>
      ) : null}

      {profile.isDemo ? (
        <InlineAlert tone="info" title="Demonstrační tržní data" className="mb-6">
          Metriky slouží k ověření datového produktu a UX. Po napojení produkčních zdrojů se
          nahradí agregací z Location Engine.
        </InlineAlert>
      ) : null}

      <div className="space-y-12">
        <LocationHero
          name={profile.location.publicLabel}
          hierarchyLabel={profile.location.hierarchyLabel}
          summary={profile.heroSummary}
          periodLabel={profile.periodLabel}
          isDemo={profile.isDemo}
          strategySlugs={profile.strategySlugs}
        />

        <div className="flex flex-wrap gap-3">
          <WatchLocationButton locationSlug={profile.location.slug} />
        </div>

        <LocationMethodologyBanner
          periodLabel={profile.periodLabel}
          source={profile.source}
          updatedAt={profile.updatedAt}
          methodologyHref={profile.methodologyHref}
          isDemo={profile.isDemo}
        />

        <LocationDynamicSummary text={marketSummaryText} />

        <LocationSection
          id="prehled-trhu"
          title="Rychlý přehled trhu"
          description="Klíčové metriky pro zvolenou lokalitu — mediány, nikoli průměry přes nesourodé segmenty."
          period={profile.periodLabel}
          methodologyHref={profile.methodologyHref}
        >
          <LocationSectionAnalytics
            locationSlug={profile.location.slug}
            event={{
              name: "location_metric_viewed",
              metric_key: "summary_block",
            }}
          />
          <LocationMarketSummary
            metrics={profile.summary}
            periodLabel={profile.periodLabel}
            source={profile.source}
            updatedAt={profile.updatedAt}
          />
        </LocationSection>

        <LocationSection
          id="mapa"
          title="Mapové vrstvy trhu"
          description="Agregace do geohash buněk — cena, nájem, výnos, nabídka. Mapa není jediný způsob čtení dat."
          period={profile.periodLabel}
          methodologyHref={profile.methodologyHref}
        >
          <LocationMapSection
            locationSlug={profile.location.slug}
            locationLabel={profile.location.publicLabel}
            layers={mapLayers}
            periodLabel={profile.periodLabel}
            isDemo={profile.isDemo}
          />
        </LocationSection>

        <LocationSection
          id="ceny-najmy"
          title="Ceny a nájmy v čase"
          description="Vývoj nabídkových a transakčních cen za m² a nájemného. Přepínač segmentů zajišťuje srovnatelnost."
          period={profile.periodLabel}
          methodologyHref={profile.methodologyHref}
        >
          <LocationSectionAnalytics
            locationSlug={profile.location.slug}
            event={{ name: "location_chart_viewed", chart: "dual" }}
          />
          <LocationPriceTrends
            segments={profile.segments}
            defaultSegmentKey={profile.defaultSegmentKey}
            priceHistoryBySegment={profile.priceHistoryBySegment}
            rentHistoryBySegment={profile.rentHistoryBySegment}
            periodLabel={profile.periodLabel}
            source={profile.source}
            updatedAt={profile.updatedAt}
            methodologyHref={profile.methodologyHref}
          />
        </LocationSection>

        <LocationSection
          id="nabidka-poptavka"
          title="Nabídka, poptávka a likvidita"
          description="Proxy metriky: aktivní inzeráty, days on market (oříznuté outlierů) a podíl slev."
          period={profile.periodLabel}
          methodologyHref={profile.methodologyHref}
        >
          <LocationSupplyDemand
            data={profile.supplyDemand}
            periodLabel={profile.periodLabel}
          />
        </LocationSection>

        <LocationSection
          id="investice"
          title="Investiční metriky"
          description="Hrubý výnos a kontext — bez zjednodušených slibů."
          period={profile.periodLabel}
          methodologyHref={profile.methodologyHref}
        >
          <LocationInvestmentMetrics
            data={profile.investment}
            periodLabel={profile.periodLabel}
            methodologyHref={profile.methodologyHref}
          />
        </LocationSection>

        <LocationSection
          id="doprava"
          title="Doprava a občanská vybavenost"
          period={profile.periodLabel}
          methodologyHref={profile.methodologyHref}
        >
          <LocationTransportAmenities
            data={profile.transport}
            periodLabel={profile.periodLabel}
          />
        </LocationSection>

        <LocationSection
          id="vystavba"
          title="Výstavba a development"
          period={profile.periodLabel}
          methodologyHref={profile.methodologyHref}
        >
          <LocationDevelopmentSection
            data={profile.development}
            periodLabel={profile.periodLabel}
          />
        </LocationSection>

        <LocationSection
          id="rizika"
          title="Rizika lokality"
          description="Kvalitativní rizika doplněná o tržní kontext — nejsou investičním doporučením."
        >
          <LocationRisksSection risks={profile.risks} />
        </LocationSection>

        <LocationSection
          id="dostupne-nemovitosti"
          title="Dostupné nemovitosti"
          description="Stejný vyhledávač jako v katalogu — filtry se předávají přes URL."
        >
          <LocationAvailableProperties
            searchLokalita={profile.location.searchLokalita}
            cards={cards}
            totalCount={cards.length}
          />
        </LocationSection>

        {profile.neighbors.length > 0 ? (
          <LocationSection
            id="sousedni-lokality"
            title="Sousední lokality"
            description="Geograficky blízké oblasti pro další průzkum trhu."
          >
            <LocationNeighbors
              neighbors={profile.neighbors}
              currentSlug={profile.location.slug}
            />
          </LocationSection>
        ) : null}

        <LocationInternalLinks
          locationSlug={profile.location.slug}
          searchLokalita={profile.location.searchLokalita}
          strategySlugs={profile.strategySlugs}
          guideSlugs={profile.guideSlugs}
          compareWithSlug={
            profile.location.slug === "brno" ? "praha" : "brno"
          }
        />
      </div>

      <div className="mt-12 flex flex-wrap gap-3 border-t border-[var(--border-default)] pt-8">
        <ButtonLink
          href={`/lokality/porovnani?l=${profile.location.slug}&l=brno`}
        >
          Porovnat s jinou lokalitou
        </ButtonLink>
        <ButtonLink href="/metodika#lokality" variant="secondary">
          Metodika lokality
        </ButtonLink>
      </div>
    </Container>
  );
}

/** Keep sitemap helpers discoverable from route module. */
export { listIndexableCanonicalPaths };
