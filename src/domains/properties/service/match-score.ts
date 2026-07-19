/**
 * Rule-based PropertyMatchScore (Prompt 8 Part 4).
 * Transparent scoring against Finanční pas / preferences — no ML.
 */

export type MatchProfile = {
  maxPriceCzk?: number | null;
  preferredCity?: string | null;
  regions?: string[];
  propertyTypes?: string[];
  dispositions?: string[];
  minAreaSqm?: number | null;
  maxAreaSqm?: number | null;
  strategies?: string[];
  /** CONSERVATIVE | BALANCED | DYNAMIC */
  riskTolerance?: string | null;
  /** OWN_HOME | INVESTMENT | RENOVATION | FLIP | EXPLORING */
  goal?: string | null;
  targetGrossYieldPct?: number | null;
};

export type MatchListing = {
  id: string;
  askingPrice?: number | null;
  locationCity?: string | null;
  locationDistrict?: string | null;
  locationRegion?: string | null;
  propertyType?: string | null;
  layout?: string | null;
  usableArea?: number | null;
  condition?: string | null;
  strategySlugs?: string[];
  tags?: string[];
  grossYieldPct?: number | null;
  risk?: string | null;
  dataQuality?: string | null;
};

export type MatchReasonTone = "positive" | "warning" | "neutral";

export type MatchReason = {
  code: string;
  tone: MatchReasonTone;
  /** Czech explanation shown in UI, e.g. "✓ Ve vašem rozpočtu" */
  label: string;
};

export type PropertyMatchScore = {
  /** 0–100 */
  score: number;
  reasons: MatchReason[];
  /** True when profile has enough fields to score meaningfully. */
  profileComplete: boolean;
};

const FOLD = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

export function isMatchProfileComplete(profile: MatchProfile | null | undefined): boolean {
  if (!profile) return false;
  const hasBudget = profile.maxPriceCzk != null && profile.maxPriceCzk > 0;
  const hasLocation =
    Boolean(profile.preferredCity?.trim()) || (profile.regions?.length ?? 0) > 0;
  const hasType = (profile.propertyTypes?.length ?? 0) > 0;
  return hasBudget || hasLocation || hasType;
}

/**
 * Compute explainable match score for one listing vs Finanční pas preferences.
 */
export function computePropertyMatchScore(
  listing: MatchListing,
  profile: MatchProfile | null | undefined,
): PropertyMatchScore {
  if (!isMatchProfileComplete(profile)) {
    return {
      score: 0,
      reasons: [
        {
          code: "PROFILE_INCOMPLETE",
          tone: "neutral",
          label: "Doplňte Finanční pas pro personalizované doporučení",
        },
      ],
      profileComplete: false,
    };
  }

  const p = profile!;
  const reasons: MatchReason[] = [];
  let points = 0;
  let maxPoints = 0;

  // Budget (weight 30)
  maxPoints += 30;
  if (p.maxPriceCzk != null && p.maxPriceCzk > 0) {
    const price = listing.askingPrice ?? null;
    if (price == null) {
      reasons.push({
        code: "BUDGET_UNKNOWN",
        tone: "neutral",
        label: "Cena není uvedená — nelze ověřit rozpočet",
      });
      points += 10;
    } else if (price <= p.maxPriceCzk) {
      const headroom = (p.maxPriceCzk - price) / p.maxPriceCzk;
      points += headroom > 0.15 ? 30 : 24;
      reasons.push({
        code: "BUDGET_OK",
        tone: "positive",
        label: "✓ Ve vašem rozpočtu",
      });
    } else if (price <= p.maxPriceCzk * 1.1) {
      points += 12;
      reasons.push({
        code: "BUDGET_SLIGHTLY_OVER",
        tone: "warning",
        label: "! Mírně nad rozpočtem (do +10 %)",
      });
    } else {
      reasons.push({
        code: "BUDGET_OVER",
        tone: "warning",
        label: "! Nad vaším maximálním rozpočtem",
      });
    }
  }

  // Location (weight 25)
  maxPoints += 25;
  const city = listing.locationCity ? FOLD(listing.locationCity) : "";
  const district = listing.locationDistrict ? FOLD(listing.locationDistrict) : "";
  const region = listing.locationRegion ? FOLD(listing.locationRegion) : "";
  const preferred = p.preferredCity ? FOLD(p.preferredCity) : "";
  const regions = (p.regions ?? []).map(FOLD);

  if (preferred || regions.length) {
    if (preferred && (city.includes(preferred) || preferred.includes(city) || district.includes(preferred))) {
      points += 25;
      reasons.push({
        code: "LOCATION_CITY",
        tone: "positive",
        label: `✓ Lokalita odpovídá preferenci (${p.preferredCity})`,
      });
    } else if (regions.some((r) => region.includes(r) || city.includes(r))) {
      points += 18;
      reasons.push({
        code: "LOCATION_REGION",
        tone: "positive",
        label: "✓ V preferovaném regionu",
      });
    } else {
      reasons.push({
        code: "LOCATION_MISS",
        tone: "warning",
        label: "! Mimo preferovanou lokalitu",
      });
    }
  }

  // Property type (weight 15)
  maxPoints += 15;
  if ((p.propertyTypes?.length ?? 0) > 0) {
    if (listing.propertyType && p.propertyTypes!.includes(listing.propertyType)) {
      points += 15;
      reasons.push({
        code: "TYPE_OK",
        tone: "positive",
        label: "✓ Typ nemovitosti odpovídá",
      });
    } else {
      reasons.push({
        code: "TYPE_MISS",
        tone: "warning",
        label: "! Jiný typ nemovitosti než v preferencích",
      });
    }
  }

  // Disposition / area (weight 15)
  maxPoints += 15;
  let layoutAreaPoints = 0;
  if ((p.dispositions?.length ?? 0) > 0 && listing.layout) {
    const layout = listing.layout.toLowerCase();
    if (p.dispositions!.some((d) => d.toLowerCase() === layout)) {
      layoutAreaPoints += 8;
      reasons.push({
        code: "LAYOUT_OK",
        tone: "positive",
        label: `✓ Dispozice ${listing.layout}`,
      });
    } else {
      reasons.push({
        code: "LAYOUT_MISS",
        tone: "neutral",
        label: `Dispozice ${listing.layout} není v preferencích`,
      });
    }
  }
  if (listing.usableArea != null && (p.minAreaSqm != null || p.maxAreaSqm != null)) {
    const min = p.minAreaSqm ?? 0;
    const max = p.maxAreaSqm ?? Number.POSITIVE_INFINITY;
    if (listing.usableArea >= min && listing.usableArea <= max) {
      layoutAreaPoints += 7;
      reasons.push({
        code: "AREA_OK",
        tone: "positive",
        label: "✓ Plocha v požadovaném rozmezí",
      });
    } else {
      reasons.push({
        code: "AREA_MISS",
        tone: "warning",
        label: "! Plocha mimo preferované rozmezí",
      });
    }
  }
  points += Math.min(15, layoutAreaPoints || (p.dispositions?.length || p.minAreaSqm || p.maxAreaSqm ? 0 : 8));

  // Goal / strategy / condition (weight 15)
  maxPoints += 15;
  const condition = listing.condition ?? "";
  const needsReno = condition === "NEEDS_RENOVATION" || condition === "SHELL";
  const strategies = p.strategies ?? [];
  const listingStrategies = listing.strategySlugs ?? [];
  const tags = (listing.tags ?? []).map((t) => t.toLowerCase());

  if (p.goal === "RENOVATION" || strategies.includes("rekonstrukce")) {
    if (needsReno) {
      points += 15;
      reasons.push({
        code: "RENO_FIT",
        tone: "positive",
        label: "✓ Vhodné k rekonstrukci (odpovídá cíli)",
      });
    } else {
      points += 6;
      reasons.push({
        code: "RENO_SOFT",
        tone: "neutral",
        label: "Nemovitost nevyžaduje větší rekonstrukci",
      });
    }
  } else if (needsReno) {
    if (p.riskTolerance === "CONSERVATIVE") {
      points += 2;
      reasons.push({
        code: "RENO_VS_CONSERVATIVE",
        tone: "warning",
        label: "! Nutná rekonstrukce je vyšší než preference rizika",
      });
    } else {
      points += 5;
      reasons.push({
        code: "RENO_NOTE",
        tone: "warning",
        label: "! Nutná rekonstrukce — zvažte capex",
      });
    }
  } else {
    points += 10;
  }

  if (strategies.length > 0) {
    const strategyHit =
      listingStrategies.some((s) => strategies.includes(s)) ||
      (strategies.some((s) => s.includes("pronajem")) &&
        tags.some((t) => t.includes("pronájem") || t.includes("pronajem")));
    if (strategyHit) {
      points = Math.min(maxPoints, points + 5);
      reasons.push({
        code: "STRATEGY_OK",
        tone: "positive",
        label: "✓ Sedí k vybrané investiční strategii",
      });
    }
  }

  // Yield vs target (bonus within weight already allocated — soft)
  if (p.targetGrossYieldPct != null && listing.grossYieldPct != null) {
    if (listing.grossYieldPct >= p.targetGrossYieldPct) {
      points = Math.min(maxPoints, points + 3);
      reasons.push({
        code: "YIELD_OK",
        tone: "positive",
        label: "✓ Hrubý výnos plní cíl",
      });
    } else {
      reasons.push({
        code: "YIELD_LOW",
        tone: "neutral",
        label: "Hrubý výnos pod cílovou hodnotou",
      });
    }
  }

  const score =
    maxPoints === 0 ? 0 : Math.round(Math.min(100, Math.max(0, (points / maxPoints) * 100)));

  // Prefer a mix of ✓ and ! so users see both fits and caveats
  const positives = reasons.filter((r) => r.tone === "positive");
  const warnings = reasons.filter((r) => r.tone === "warning");
  const neutrals = reasons.filter((r) => r.tone === "neutral");
  const selected = [
    ...positives.slice(0, 3),
    ...warnings.slice(0, 2),
    ...neutrals.slice(0, 1),
  ].slice(0, 5);

  return {
    score,
    reasons: selected.length > 0 ? selected : reasons.slice(0, 5),
    profileComplete: true,
  };
}

export function sortByMatchScore<T extends { id: string }>(
  items: T[],
  scores: Map<string, PropertyMatchScore>,
): T[] {
  return [...items].sort((a, b) => {
    const sa = scores.get(a.id)?.score ?? 0;
    const sb = scores.get(b.id)?.score ?? 0;
    return sb - sa;
  });
}
