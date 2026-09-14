import type { Metadata } from "next";

import { LocationComparisonClient } from "@/components/locations";
import { preparePageMeta } from "@/components/content/page-helpers";
import { ComparisonLayout, PageHeader } from "@/components/layout/page-layouts";
import { InlineAlert } from "@/components/feedback/states";
import { resolveMatchProfile } from "@/components/property/search/discovery-listing";
import { LOCATION_DEMO_PROFILES } from "@/domains/locations/content/demo-profiles";
import {
  loadLocationComparison,
  listComparableLocationSlugs,
  loadLocationPageProfile,
} from "@/domains/locations/service/location-page-service";
import { createLocationScoreService } from "@/domains/locations/service/location-score-service";
import { locationHref } from "@/domains/locations/seo/location-urls";

export const metadata: Metadata = preparePageMeta({
  title: "Porovnání lokalit",
  description:
    "Srovnejte 2–3 lokality vedle sebe — ceny, nájmy, likvidita a doprava. Vždy ve stejném segmentu.",
  path: "/lokality/porovnani",
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseSlugs(params: Record<string, string | string[] | undefined>): string[] {
  const raw = params.l;
  if (!raw) return ["praha", "brno"];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 3);
}

function goalLabel(goal: string | null | undefined): string | null {
  if (!goal) return null;
  const map: Record<string, string> = {
    OWN_HOME: "vlastní bydlení",
    INVESTMENT: "investice / pronájem",
    RENOVATION: "rekonstrukce",
    FLIP: "flip",
    EXPLORING: "průzkum trhu",
  };
  return map[goal] ?? goal;
}

export default async function LokalityPorovnaniPage({ searchParams }: Props) {
  const params = await searchParams;
  const slugs = parseSlugs(params);
  const segmentKey =
    (Array.isArray(params.segment) ? params.segment[0] : params.segment) ??
    LOCATION_DEMO_PROFILES.praha?.defaultSegmentKey ??
    "";

  const comparison = await loadLocationComparison({ slugs, segmentKey });
  const availableSlugs = listComparableLocationSlugs().map((slug) => ({
    slug,
    name: LOCATION_DEMO_PROFILES[slug]?.location.name ?? slug,
    href: locationHref(slug),
  }));
  const segments =
    LOCATION_DEMO_PROFILES[slugs[0] ?? "praha"]?.segments ??
    LOCATION_DEMO_PROFILES.praha!.segments;

  const { matchProfile, profileComplete } = await resolveMatchProfile();
  const scoreService = createLocationScoreService();
  const matchScores: Record<string, number> = {};

  if (profileComplete && matchProfile) {
    for (const slug of comparison?.locations.map((l) => l.slug) ?? slugs) {
      const profile = await loadLocationPageProfile(slug);
      if (!profile) continue;
      const match = scoreService.computeMatchScore({
        profile,
        matchProfile,
      });
      if (match.score != null) matchScores[slug] = match.score;
    }
  }

  return (
    <ComparisonLayout
      header={
        <>
          <PageHeader
            title="Porovnání lokalit"
            description="Srovnání metrik ve stejném segmentu — byty s byty, domy s domy. Období a metodika uvedeny u tabulky."
            breadcrumbs={[
              { href: "/", label: "Domů" },
              { href: "/lokality", label: "Lokality" },
              { label: "Porovnání" },
            ]}
          />
          <InlineAlert tone="info" title="Normalizované srovnání" className="mt-6">
            Metriky nelze směšovat mezi segmenty. Vyberte stejný typ nemovitosti a dispozici pro
            obě lokality. Asking a transakční ceny jsou v tabulce oddělené řádky.
          </InlineAlert>
        </>
      }
    >
      <LocationComparisonClient
        availableSlugs={availableSlugs}
        initialSlugs={slugs}
        initialSegmentKey={segmentKey || segments[0]!.key}
        segments={segments}
        comparison={comparison}
        matchScores={Object.keys(matchScores).length > 0 ? matchScores : null}
        passportGoalLabel={
          profileComplete ? goalLabel(matchProfile?.goal) : null
        }
      />
    </ComparisonLayout>
  );
}
