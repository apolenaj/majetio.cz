"use server";

import { SavedSearchAlertFrequency, type Prisma } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import {
  buildSavedSearchFilters,
  parseSavedSearchFilters,
  SAVED_SEARCH_FILTERS_VERSION,
} from "@/domains/saved-searches/service/filters-version";
import { syncAlertSubscriptionsForSavedSearch } from "@/domains/notifications/service/property-alerts";
import { syncSavedSearchMatches } from "@/domains/saved-searches/service/match-service";
import {
  buildPropertySearchHref,
  countActiveFilters,
  EMPTY_PROPERTY_URL_STATE,
  type PropertyUrlFilterState,
} from "@/domains/properties/search/url-state";
import { track } from "@/lib/analytics/events";

export type SavedSearchDto = {
  id: string;
  name: string;
  sort: string | null;
  filtersVersion: number;
  alertFrequency: SavedSearchAlertFrequency;
  href: string;
  createdAt: string;
  updatedAt: string;
  state: PropertyUrlFilterState;
  matchCount: number;
  newMatchCount: number;
  lastCheckedAt: string | null;
  filterSummary: string;
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

function toDto(
  row: {
    id: string;
    name: string;
    sort: string | null;
    filtersVersion: number;
    alertFrequency: SavedSearchAlertFrequency;
    filters: unknown;
    createdAt: Date;
    updatedAt: Date;
    lastCheckedAt?: Date | null;
  },
  stats?: { matchCount: number; newMatchCount: number },
): SavedSearchDto {
  const parsed = parseSavedSearchFilters(row.filters);
  return {
    id: row.id,
    name: row.name,
    sort: row.sort,
    filtersVersion: row.filtersVersion,
    alertFrequency: row.alertFrequency,
    href: buildPropertySearchHref(parsed.state),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    state: parsed.state,
    matchCount: stats?.matchCount ?? 0,
    newMatchCount: stats?.newMatchCount ?? 0,
    lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
    filterSummary: summarizeFilters(parsed.state),
  };
}

export async function listSavedSearches(): Promise<
  { ok: true; items: SavedSearchDto[] } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Přihlášení je povinné." };

  const rows = await prisma.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { matches: true } },
      matches: {
        where: { notifiedAt: null },
        select: { id: true },
      },
    },
  });
  return {
    ok: true,
    items: rows.map((row) =>
      toDto(row, {
        matchCount: row._count.matches,
        newMatchCount: row.matches.length,
      }),
    ),
  };
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  state: z.record(z.string(), z.unknown()).optional(),
  sort: z.string().max(40).nullable().optional(),
  alertFrequency: z.nativeEnum(SavedSearchAlertFrequency).optional(),
});

export async function createSavedSearch(input: {
  name: string;
  state: PropertyUrlFilterState;
  sort?: string | null;
  alertFrequency?: SavedSearchAlertFrequency;
}): Promise<{ ok: true; item: SavedSearchDto } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Přihlášení je povinné." };

  const parsed = createSchema.safeParse({
    name: input.name,
    sort: input.sort,
    alertFrequency: input.alertFrequency,
  });
  if (!parsed.success) return { ok: false, error: "Neplatný název hledání." };

  const filters = buildSavedSearchFilters(input.state ?? EMPTY_PROPERTY_URL_STATE);
  const frequency = parsed.data.alertFrequency ?? SavedSearchAlertFrequency.OFF;

  const row = await prisma.savedSearch.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      filters: filters as unknown as Prisma.InputJsonValue,
      filtersVersion: SAVED_SEARCH_FILTERS_VERSION,
      sort: parsed.data.sort ?? input.state.razeni ?? "newest",
      alertFrequency: frequency,
      criteria: filters as unknown as Prisma.InputJsonValue,
    },
  });

  await syncAlertSubscriptionsForSavedSearch(prisma, {
    userId: session.user.id,
    savedSearchId: row.id,
    alertFrequency: frequency,
  });

  // Baseline sync — current catalog matches are not "new"
  await syncSavedSearchMatches({
    savedSearchId: row.id,
    baseline: true,
    notify: false,
  }).catch(() => undefined);

  const refreshed = await prisma.savedSearch.findUnique({
    where: { id: row.id },
    include: {
      _count: { select: { matches: true } },
      matches: { where: { notifiedAt: null }, select: { id: true } },
    },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: "saved_search.create",
    entity: "SavedSearch",
    entityId: row.id,
  });

  track({
    name: "saved_search_created",
    props: {
      filter_count: countActiveFilters(input.state),
      sort: parsed.data.sort ?? input.state.razeni ?? "newest",
      alert_frequency: frequency,
    },
  });

  revalidatePath("/ucet/ulozena-hledani");
  revalidatePath("/ucet");
  const dtoSource = refreshed ?? row;
  return {
    ok: true,
    item: toDto(dtoSource, {
      matchCount: refreshed?._count.matches ?? 0,
      newMatchCount: refreshed?.matches.length ?? 0,
    }),
  };
}

const renameSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(80),
});

export async function renameSavedSearch(input: {
  id: string;
  name: string;
}): Promise<{ ok: true; item: SavedSearchDto } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Přihlášení je povinné." };
  const parsed = renameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Neplatný název." };

  const existing = await prisma.savedSearch.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
  });
  if (!existing) return { ok: false, error: "Hledání nenalezeno." };

  const row = await prisma.savedSearch.update({
    where: { id: existing.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/ucet/ulozena-hledani");
  revalidatePath("/ucet");
  return { ok: true, item: toDto(row) };
}

export async function deleteSavedSearch(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Přihlášení je povinné." };

  const existing = await prisma.savedSearch.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return { ok: false, error: "Hledání nenalezeno." };

  await prisma.savedSearch.delete({ where: { id: existing.id } });
  await writeAuditLog({
    actorId: session.user.id,
    action: "saved_search.delete",
    entity: "SavedSearch",
    entityId: id,
  });
  revalidatePath("/ucet/ulozena-hledani");
  revalidatePath("/ucet");
  return { ok: true };
}

const alertSchema = z.object({
  id: z.string().min(1),
  alertFrequency: z.nativeEnum(SavedSearchAlertFrequency),
});

export async function setSavedSearchAlertFrequency(input: {
  id: string;
  alertFrequency: SavedSearchAlertFrequency;
}): Promise<{ ok: true; item: SavedSearchDto } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Přihlášení je povinné." };
  const parsed = alertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Neplatná frekvence." };

  const existing = await prisma.savedSearch.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
  });
  if (!existing) return { ok: false, error: "Hledání nenalezeno." };

  const row = await prisma.savedSearch.update({
    where: { id: existing.id },
    data: { alertFrequency: parsed.data.alertFrequency },
  });

  await syncAlertSubscriptionsForSavedSearch(prisma, {
    userId: session.user.id,
    savedSearchId: row.id,
    alertFrequency: parsed.data.alertFrequency,
  });

  track({
    name: "saved_search_alert_updated",
    props: { alert_frequency: parsed.data.alertFrequency },
  });

  revalidatePath("/ucet/ulozena-hledani");
  revalidatePath("/ucet");
  return { ok: true, item: toDto(row) };
}
