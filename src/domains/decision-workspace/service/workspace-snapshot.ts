/**
 * Decision Workspace snapshot for /ucet dashboard.
 */

import { LeadType } from "@prisma/client";

import { listFavouritesForUser } from "@/domains/favourites/service/favourite-service";
import { parseSavedSearchFilters } from "@/domains/saved-searches/service/filters-version";
import {
  buildPropertySearchHref,
  type PropertyUrlFilterState,
} from "@/domains/properties/search/url-state";
import {
  syncAllSavedSearchesForUser,
} from "@/domains/saved-searches/service/match-service";
import {
  buildPropertyDecisionTimeline,
  listRecentDecisionChanges,
  type DecisionTimelineEvent,
} from "@/domains/decision-workspace/service/timeline";
import { mortgageLeadService } from "@/domains/leads";
import type { MortgageLeadListItemDto } from "@/domains/leads/schemas/mortgage-lead";
import { prisma } from "@/lib/db";
import {
  loadFinancialPassport,
} from "@/lib/financial-passport/actions";

export type DecisionNextStep = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

export type SavedSearchCardDto = {
  id: string;
  name: string;
  href: string;
  filterSummary: string;
  alertFrequency: string;
  alertFrequencyLabel: string;
  matchCount: number;
  newMatchCount: number;
  lastCheckedAt: string | null;
  createdAt: string;
  state: PropertyUrlFilterState;
};

export type DecisionWorkspaceSnapshot = {
  displayName: string;
  nextStep: DecisionNextStep | null;
  shortlist: Array<{
    favouriteId: string;
    propertyId: string;
    title: string;
    slug: string;
    href: string;
    location: string;
    askingPrice: number | null;
    statusLabel: string;
    timeline: DecisionTimelineEvent[];
  }>;
  activeComparisons: Array<{
    id: string;
    name: string | null;
    itemCount: number;
    href: string;
    updatedAt: string;
  }>;
  recentChanges: DecisionTimelineEvent[];
  openTasks: Array<{
    id: string;
    title: string;
    propertyId: string;
    propertyTitle: string | null;
    propertySlug: string | null;
    href: string | null;
    dueDate: string | null;
  }>;
  analyses: Array<{
    id: string;
    status: string;
    majetioScore: number | null;
    propertyTitle: string | null;
    href: string;
    updatedAt: string;
  }>;
  financing: {
    count: number;
    leads: MortgageLeadListItemDto[];
  };
  savedSearches: SavedSearchCardDto[];
  counts: {
    shortlist: number;
    favourites: number;
    comparisons: number;
    openTasks: number;
    analyses: number;
    savedSearches: number;
    unreadAlerts: number;
  };
};

const ALERT_FREQUENCY_LABELS: Record<string, string> = {
  OFF: "Vypnuto",
  INSTANT: "Okamžitě",
  DAILY: "Denně",
  WEEKLY: "Týdně",
};

function summarizeFilters(state: PropertyUrlFilterState): string {
  const parts: string[] = [];
  if (state.lokalita) parts.push(state.lokalita);
  if (state.cenaDo != null) {
    parts.push(`do ${Math.round(state.cenaDo / 1_000_000)} mil. Kč`);
  }
  if (state.typ.length) parts.push(state.typ.join(", "));
  if (state.dispozice.length) parts.push(state.dispozice.join(", "));
  if (parts.length === 0) return "Bez filtrů (všechny nabídky)";
  return parts.join(" · ");
}

function pickNextStep(input: {
  shortlistCount: number;
  favouritesCount: number;
  comparisonsCount: number;
  openTasksCount: number;
  analysesCount: number;
  passportPercent: number;
  newSearchMatches: number;
  unreadAlerts: number;
}): DecisionNextStep | null {
  if (input.passportPercent < 40) {
    return {
      id: "passport",
      title: "Doplňte Finanční pas",
      body: "Bez základního profilu neumíme dobře odhadnout financovatelnost výběru.",
      href: "/ucet/financni-profil",
      cta: "Otevřít Finanční pas",
    };
  }
  if (input.newSearchMatches > 0) {
    return {
      id: "saved-search",
      title: `${input.newSearchMatches} nových nabídek k uloženému hledání`,
      body: "Projděte nové výsledky a rozhodněte, co uložit do shortlistu.",
      href: "/ucet#ulozena-hledani",
      cta: "Zobrazit hledání",
    };
  }
  if (input.unreadAlerts > 0) {
    return {
      id: "alerts",
      title: "Máte nepřečtená upozornění",
      body: "Změny cen nebo stavů u uložených nemovitostí čekají na kontrolu.",
      href: "/ucet/upozorneni",
      cta: "Otevřít schránku",
    };
  }
  if (input.openTasksCount > 0) {
    return {
      id: "tasks",
      title: "Úkoly k ověření",
      body: `Máte ${input.openTasksCount} otevřených úkolů u nemovitostí ve výběru.`,
      href: "/ucet#ukoly",
      cta: "Zobrazit úkoly",
    };
  }
  if (input.shortlistCount >= 2 && input.comparisonsCount === 0) {
    return {
      id: "compare",
      title: "Porovnejte shortlist",
      body: "Máte více nemovitostí ve výběru — spusťte porovnání vedle sebe.",
      href: "/porovnani",
      cta: "Spustit porovnání",
    };
  }
  if (input.shortlistCount > 0 && input.analysesCount === 0) {
    return {
      id: "analyze",
      title: "Spusťte analýzu výběru",
      body: "U shortlistu ještě chybí investiční / výnosová analýza.",
      href: "/analyza",
      cta: "Analyzovat",
    };
  }
  if (input.favouritesCount === 0) {
    return {
      id: "browse",
      title: "Začněte ukládat tipy",
      body: "Procházejte katalog a uložte nemovitosti, které vážně zvažujete.",
      href: "/nemovitosti",
      cta: "Procházet nemovitosti",
    };
  }
  return {
    id: "shortlist",
    title: "Pokračujte ve výběru",
    body: "Zpřesněte shortlist, doplňte úkoly a připravte financování.",
    href: "/ucet/oblibene",
    cta: "Otevřít oblíbené",
  };
}

export async function loadDecisionWorkspace(
  userId: string,
): Promise<DecisionWorkspaceSnapshot> {
  // Refresh saved-search matches (baseline-safe; no fake badges)
  await syncAllSavedSearchesForUser(userId).catch(() => undefined);

  const [
    user,
    shortlistItems,
    favouritesCount,
    comparisons,
    openTasks,
    analyses,
    mortgageLeads,
    mortgageLeadsCount,
    savedSearches,
    recentChanges,
    unreadAlerts,
    passportResult,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    }),
    listFavouritesForUser(userId, {
      status: "FAVORITE",
      pageSize: 24,
      sort: "recently_saved",
    }),
    prisma.favourite.count({
      where: { userId, status: { not: "REJECTED" } },
    }),
    prisma.comparison.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { _count: { select: { properties: true } } },
    }),
    prisma.propertyDecisionTask.findMany({
      where: {
        userId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      take: 8,
      include: {
        property: { select: { title: true, slug: true } },
      },
    }),
    prisma.propertyAnalysis.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { property: { select: { title: true } } },
    }),
    mortgageLeadService.listMortgageLeadsForUser({ userId, limit: 4 }),
    prisma.lead.count({
      where: {
        userId,
        type: LeadType.FINANCING,
        partner: "hypotekajasne",
        mortgageProfile: { isNot: null },
      },
    }),
    prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
        matches: {
          where: { notifiedAt: null },
          select: { id: true },
        },
      },
    }),
    listRecentDecisionChanges({ userId, limit: 10 }),
    prisma.propertyAlert.count({
      where: {
        userId,
        channel: "IN_APP",
        status: { not: "SUPPRESSED" },
        readAt: null,
        NOT: { title: "match-marker" },
      },
    }),
    loadFinancialPassport(),
  ]);

  const shortlistWithTimeline = await Promise.all(
    shortlistItems.slice(0, 6).map(async (item) => ({
      favouriteId: item.id,
      propertyId: item.propertyId,
      title: item.property.title,
      slug: item.property.slug,
      href: item.property.href,
      location: item.property.location,
      askingPrice: item.property.askingPrice,
      statusLabel: item.statusLabel,
      timeline: await buildPropertyDecisionTimeline({
        userId,
        propertyId: item.propertyId,
        propertySlug: item.property.slug,
        limit: 6,
      }),
    })),
  );

  const savedSearchCards: SavedSearchCardDto[] = savedSearches.map((s) => {
    const parsed = parseSavedSearchFilters(s.filters);
    return {
      id: s.id,
      name: s.name,
      href: buildPropertySearchHref(parsed.state),
      filterSummary: summarizeFilters(parsed.state),
      alertFrequency: s.alertFrequency,
      alertFrequencyLabel:
        ALERT_FREQUENCY_LABELS[s.alertFrequency] ?? s.alertFrequency,
      matchCount: s._count.matches,
      newMatchCount: s.matches.length,
      lastCheckedAt: s.lastCheckedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      state: parsed.state,
    };
  });

  const newSearchMatches = savedSearchCards.reduce(
    (sum, s) => sum + s.newMatchCount,
    0,
  );

  const passportPercent =
    passportResult.ok
      ? passportResult.progress.percent
      : 0;

  const email = user?.email ?? "";
  const displayName =
    user?.name?.trim() || email.split("@")[0] || "uživateli";

  return {
    displayName,
    nextStep: pickNextStep({
      shortlistCount: shortlistItems.length,
      favouritesCount,
      comparisonsCount: comparisons.length,
      openTasksCount: openTasks.length,
      analysesCount: analyses.length,
      passportPercent,
      newSearchMatches,
      unreadAlerts,
    }),
    shortlist: shortlistWithTimeline,
    activeComparisons: comparisons.map((c) => ({
      id: c.id,
      name: c.name,
      itemCount: c._count.properties,
      href: `/porovnani/${c.id}`,
      updatedAt: c.updatedAt.toISOString(),
    })),
    recentChanges,
    openTasks: openTasks.map((t) => ({
      id: t.id,
      title: t.title,
      propertyId: t.propertyId,
      propertyTitle: t.property?.title ?? null,
      propertySlug: t.property?.slug ?? null,
      href: t.property?.slug ? `/nemovitosti/${t.property.slug}#rozhodnuti` : null,
      dueDate: t.dueDate?.toISOString() ?? null,
    })),
    analyses: analyses.map((a) => ({
      id: a.id,
      status: a.status,
      majetioScore: a.majetioScore,
      propertyTitle: a.property?.title ?? null,
      href: `/analyza/${a.id}`,
      updatedAt: a.updatedAt.toISOString(),
    })),
    financing: {
      count: mortgageLeadsCount,
      leads: mortgageLeads,
    },
    savedSearches: savedSearchCards,
    counts: {
      shortlist: shortlistItems.length,
      favourites: favouritesCount,
      comparisons: comparisons.length,
      openTasks: openTasks.length,
      analyses: analyses.length,
      savedSearches: savedSearches.length,
      unreadAlerts,
    },
  };
}
