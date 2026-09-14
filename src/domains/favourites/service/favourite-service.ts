import type {
  FavouriteRejectionReason,
  FavouriteStatus,
  Prisma,
  PropertyStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  favouriteStatusLabel,
  normalizeFavouriteStatus,
  rejectionReasonLabel,
  SHORTLIST_STATUS,
  type FavouriteRejectionReasonValue,
  type FavouriteStatusValue,
} from "@/domains/favourites/status";
import type { FavouriteListItemDto, FavouriteListPage, FavouriteSaveInput } from "@/domains/favourites/types";
import {
  sanitizeFavouriteFolder,
  sanitizeFavouriteNote,
} from "@/domains/favourites/service/sanitize";
import {
  clampFavouritePageSize,
  FAVOURITES_DEFAULT_PAGE_SIZE,
  sortFavouriteSlimRows,
  type FavouriteListSort,
  type FavouriteSlimSortRow,
} from "@/domains/favourites/service/sort-favourites";

function locationOf(p: {
  publicLabel: string | null;
  publicCity: string | null;
  publicDistrict: string | null;
  city: string | null;
}): string {
  return (
    p.publicLabel ||
    [p.publicDistrict, p.publicCity ?? p.city].filter(Boolean).join(", ") ||
    "Lokalita neuvedena"
  );
}

function primaryImageUrl(
  media: Array<{ url: string; isPrimary: boolean; isPlaceholder: boolean }>,
): string | null {
  const primary = media.find((m) => m.isPrimary && m.url && !m.isPlaceholder);
  if (primary) return primary.url;
  const any = media.find((m) => m.url && !m.isPlaceholder);
  return any?.url ?? null;
}

/** BOD 120–122: keep favourite; surface lifecycle badge. */
export function listingLifecycleFromStatus(
  status: PropertyStatus | string | null | undefined,
): FavouriteListItemDto["listingLifecycle"] {
  if (status === "SOLD") {
    return {
      kind: "sold",
      label: "Prodáno",
      keepForCompare: true,
    };
  }
  if (
    status === "UNAVAILABLE" ||
    status === "WITHDRAWN" ||
    status === "ARCHIVED"
  ) {
    return {
      kind: "inactive",
      label: "Nabídka již není aktivní",
      keepForCompare: true,
    };
  }
  if (status === "RESERVED") {
    return {
      kind: "reserved",
      label: "Rezervováno",
      keepForCompare: true,
    };
  }
  return {
    kind: "active",
    label: null,
    keepForCompare: true,
  };
}

function toDto(row: {
  id: string;
  propertyId: string;
  status: FavouriteStatus;
  rejectionReason: FavouriteRejectionReason | null;
  folder: string | null;
  collectionId: string | null;
  priority: number | null;
  note: string | null;
  priceAtSave: number | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  matchScore?: number | null;
  collection?: { name: string } | null;
  property: {
    id: string;
    slug: string;
    title: string;
    status: PropertyStatus;
    askingPrice: number | null;
    priceCzk: number | null;
    publicLabel: string | null;
    publicCity: string | null;
    publicDistrict: string | null;
    city: string | null;
    layout: string | null;
    usableArea: number | null;
    isDemo: boolean;
    media: Array<{ url: string; isPrimary: boolean; isPlaceholder: boolean }>;
  };
}): FavouriteListItemDto {
  const asking =
    row.property.askingPrice ?? row.property.priceCzk ?? null;
  const priceAtSave = row.priceAtSave;
  let priceChangeCzk: number | null = null;
  let priceChangePct: number | null = null;
  if (asking != null && priceAtSave != null && priceAtSave > 0) {
    priceChangeCzk = asking - priceAtSave;
    priceChangePct = (priceChangeCzk / priceAtSave) * 100;
  }

  const status = normalizeFavouriteStatus(row.status);
  const rejectionReason = row.rejectionReason as
    | FavouriteRejectionReasonValue
    | null;

  return {
    id: row.id,
    propertyId: row.propertyId,
    status,
    statusLabel: favouriteStatusLabel(status),
    rejectionReason,
    rejectionReasonLabel: rejectionReasonLabel(rejectionReason),
    folder: row.folder,
    collectionId: row.collectionId,
    collectionName: row.collection?.name ?? null,
    priority: row.priority,
    note: row.note,
    priceAtSave,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    matchScore: row.matchScore ?? null,
    listingLifecycle: listingLifecycleFromStatus(row.property.status),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    property: {
      id: row.property.id,
      slug: row.property.slug,
      title: row.property.title,
      href: `/nemovitosti/${row.property.slug}`,
      location: locationOf(row.property),
      askingPrice: asking,
      priceChangeCzk,
      priceChangePct,
      imageUrl: primaryImageUrl(row.property.media),
      layout: row.property.layout,
      usableArea: row.property.usableArea,
      isDemo: row.property.isDemo,
      listingStatus: row.property.status,
    },
  };
}

const listInclude = {
  collection: { select: { name: true } },
  property: {
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      askingPrice: true,
      priceCzk: true,
      publicLabel: true,
      publicCity: true,
      publicDistrict: true,
      city: true,
      layout: true,
      usableArea: true,
      isDemo: true,
      media: {
        where: { type: "PHOTO" as const },
        orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
        take: 3,
        select: { url: true, isPrimary: true, isPlaceholder: true },
      },
    },
  },
} satisfies Prisma.FavouriteInclude;

export type FavouriteListOptions = {
  status?: FavouriteStatusValue;
  folder?: string;
  collectionId?: string;
  /** When true, include user-archived rows. Default false. */
  includeArchived?: boolean;
  /** When true, only user-archived rows. */
  archivedOnly?: boolean;
  /** Default for “Vše” tab — hide REJECTED. */
  excludeRejected?: boolean;
  page?: number;
  pageSize?: number;
  sort?: FavouriteListSort;
};

function buildFavouriteWhere(
  userId: string,
  options?: FavouriteListOptions,
): Prisma.FavouriteWhereInput {
  return {
    userId,
    ...(options?.status ? { status: options.status } : {}),
    ...(options?.excludeRejected && !options?.status
      ? { status: { not: "REJECTED" } }
      : {}),
    ...(options?.folder ? { folder: options.folder } : {}),
    ...(options?.collectionId ? { collectionId: options.collectionId } : {}),
    ...(options?.archivedOnly
      ? { archivedAt: { not: null } }
      : options?.includeArchived
        ? {}
        : { archivedAt: null }),
  };
}

/**
 * Paginated favourites — slim sort pass, then hydrate page with media (max 3).
 * Never loads hundreds of full property graphs at once.
 */
export async function listFavouritesPageForUser(
  userId: string,
  options?: FavouriteListOptions,
): Promise<FavouriteListPage> {
  const page = Math.max(1, Math.floor(options?.page ?? 1));
  const pageSize = clampFavouritePageSize(
    options?.pageSize ?? FAVOURITES_DEFAULT_PAGE_SIZE,
  );
  const sort: FavouriteListSort = options?.sort ?? "recently_saved";
  const where = buildFavouriteWhere(userId, options);

  const slimRows = await prisma.favourite.findMany({
    where,
    select: {
      id: true,
      propertyId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      priority: true,
      priceAtSave: true,
      property: {
        select: { askingPrice: true, priceCzk: true },
      },
    },
  });

  const total = slimRows.length;
  if (total === 0) {
    return {
      items: [],
      page,
      pageSize,
      total: 0,
      totalPages: 0,
      hasMore: false,
      sort,
    };
  }

  const matchByProperty = new Map<string, number>();
  if (sort === "match") {
    const propertyIds = [...new Set(slimRows.map((r) => r.propertyId))];
    const analyses = await prisma.propertyAnalysis.findMany({
      where: {
        userId,
        propertyId: { in: propertyIds },
        majetioScore: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      select: { propertyId: true, majetioScore: true },
    });
    for (const a of analyses) {
      if (a.propertyId == null || a.majetioScore == null) continue;
      if (!matchByProperty.has(a.propertyId)) {
        matchByProperty.set(a.propertyId, a.majetioScore);
      }
    }
  }

  const sortInput: Array<FavouriteSlimSortRow & { id: string }> = slimRows.map(
    (r) => ({
      id: r.id,
      status: normalizeFavouriteStatus(r.status),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      priority: r.priority,
      priceAtSave: r.priceAtSave,
      askingPrice: r.property.askingPrice ?? r.property.priceCzk,
      matchScore: matchByProperty.get(r.propertyId) ?? null,
    }),
  );

  const orderedIds = sortFavouriteSlimRows(sortInput, sort).map((r) => r.id);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageIds = orderedIds.slice(start, start + pageSize);

  const hydrated = await prisma.favourite.findMany({
    where: { id: { in: pageIds }, userId },
    include: listInclude,
  });
  const byId = new Map(hydrated.map((r) => [r.id, r]));
  const items = pageIds
    .map((id) => {
      const row = byId.get(id);
      if (!row) return null;
      const matchScore =
        matchByProperty.get(row.propertyId) ??
        null;
      return toDto({ ...row, matchScore });
    })
    .filter((x): x is FavouriteListItemDto => x != null);

  return {
    items,
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasMore: safePage < totalPages,
    sort,
  };
}

/**
 * Convenience wrapper — returns items only (shortlist / dashboard).
 * Caps at one page of MAX size to avoid accidental full-table hydrate.
 */
export async function listFavouritesForUser(
  userId: string,
  options?: FavouriteListOptions,
): Promise<FavouriteListItemDto[]> {
  const page = await listFavouritesPageForUser(userId, {
    ...options,
    page: 1,
    pageSize: options?.pageSize ?? FAVOURITES_DEFAULT_PAGE_SIZE,
    sort: options?.sort ?? "recently_saved",
  });
  return page.items;
}

/** Counts for filter tabs — cheap aggregation, no media. */
export async function countFavouritesByTab(userId: string): Promise<{
  all: number;
  considering: number;
  viewing: number;
  shortlist: number;
  rejected: number;
  archived: number;
}> {
  const [all, considering, viewing, shortlist, rejected, archived] =
    await Promise.all([
      prisma.favourite.count({
        where: { userId, archivedAt: null, status: { not: "REJECTED" } },
      }),
      prisma.favourite.count({
        where: { userId, archivedAt: null, status: "CONSIDERING" },
      }),
      prisma.favourite.count({
        where: { userId, archivedAt: null, status: "VIEWING" },
      }),
      prisma.favourite.count({
        where: { userId, archivedAt: null, status: "FAVORITE" },
      }),
      prisma.favourite.count({
        where: { userId, archivedAt: null, status: "REJECTED" },
      }),
      prisma.favourite.count({
        where: { userId, archivedAt: { not: null } },
      }),
    ]);
  return { all, considering, viewing, shortlist, rejected, archived };
}


export async function listFavouritePropertyIds(
  userId: string,
): Promise<string[]> {
  const rows = await prisma.favourite.findMany({
    where: { userId },
    select: { propertyId: true },
  });
  return rows.map((r) => r.propertyId);
}

export async function isPropertyFavourited(
  userId: string,
  propertyId: string,
): Promise<boolean> {
  const row = await prisma.favourite.findUnique({
    where: { userId_propertyId: { userId, propertyId } },
    select: { id: true },
  });
  return Boolean(row);
}

/**
 * IDOR-safe load: returns null when favouriteId is not owned by userId.
 */
export async function getFavouriteOwnedByUser(input: {
  userId: string;
  favouriteId: string;
}): Promise<FavouriteListItemDto | null> {
  const row = await prisma.favourite.findFirst({
    where: { id: input.favouriteId, userId: input.userId },
    include: listInclude,
  });
  return row ? toDto(row) : null;
}

export async function saveFavourite(input: {
  userId: string;
  propertyId: string;
  status?: FavouriteStatusValue;
  priceAtSave?: number | null;
}): Promise<{ ok: true; added: boolean; id: string } | { ok: false; error: string }> {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: { id: true, askingPrice: true, priceCzk: true },
  });
  if (!property) return { ok: false, error: "Nemovitost nenalezena." };

  const status = normalizeFavouriteStatus(
    input.status ?? "CONSIDERING",
  ) as FavouriteStatus;
  const priceAtSave =
    input.priceAtSave ?? property.askingPrice ?? property.priceCzk ?? null;

  const existing = await prisma.favourite.findUnique({
    where: {
      userId_propertyId: { userId: input.userId, propertyId: property.id },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.favourite.update({
      where: { id: existing.id },
      data: {
        status,
        updatedAt: new Date(),
        ...(status !== "REJECTED" ? { rejectionReason: null } : {}),
      },
    });
    return { ok: true, added: false, id: existing.id };
  }

  const count = await prisma.favourite.count({ where: { userId: input.userId } });
  const MAX_USER_FAVOURITES = 200;
  if (count >= MAX_USER_FAVOURITES) {
    return {
      ok: false,
      error: `Dosáhli jste limitu ${MAX_USER_FAVOURITES} uložených nemovitostí.`,
    };
  }

  try {
    const created = await prisma.favourite.create({
      data: {
        userId: input.userId,
        propertyId: property.id,
        status,
        priceAtSave,
      },
      select: { id: true },
    });

    // Listing analytics (136) — no userId in metrics payload
    void import("@/domains/listing-analytics/service")
      .then(({ recordListingMetric }) =>
        recordListingMetric({ propertyId: property.id, metric: "saves" }),
      )
      .catch(() => undefined);

    return { ok: true, added: true, id: created.id };
  } catch (err) {
    // Concurrent create race — unique (userId, propertyId)
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "";
    if (code === "P2002") {
      const row = await prisma.favourite.findUnique({
        where: {
          userId_propertyId: {
            userId: input.userId,
            propertyId: property.id,
          },
        },
        select: { id: true },
      });
      if (row) return { ok: true, added: false, id: row.id };
    }
    throw err;
  }
}

export async function toggleFavouriteForUser(input: {
  userId: string;
  propertyId: string;
  priceAtSave?: number | null;
}): Promise<
  | { ok: true; added: boolean; id: string | null }
  | { ok: false; error: string }
> {
  const existing = await prisma.favourite.findUnique({
    where: {
      userId_propertyId: {
        userId: input.userId,
        propertyId: input.propertyId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.favourite.delete({ where: { id: existing.id } });
    return { ok: true, added: false, id: null };
  }

  return saveFavourite({
    userId: input.userId,
    propertyId: input.propertyId,
    status: "CONSIDERING",
    priceAtSave: input.priceAtSave,
  });
}

export async function removeFavourite(input: {
  userId: string;
  favouriteId?: string;
  propertyId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.favouriteId) {
    const row = await prisma.favourite.findFirst({
      where: { id: input.favouriteId, userId: input.userId },
      select: { id: true },
    });
    if (!row) return { ok: false, error: "Položka nenalezena." };
    await prisma.favourite.delete({ where: { id: row.id } });
    return { ok: true };
  }
  if (input.propertyId) {
    await prisma.favourite.deleteMany({
      where: { userId: input.userId, propertyId: input.propertyId },
    });
    return { ok: true };
  }
  return { ok: false, error: "Chybí identifikátor." };
}

export async function updateFavouriteStatus(input: {
  userId: string;
  favouriteId: string;
  status: FavouriteStatusValue;
  rejectionReason?: FavouriteRejectionReasonValue | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.favourite.findFirst({
    where: { id: input.favouriteId, userId: input.userId },
    select: { id: true },
  });
  if (!row) return { ok: false, error: "Položka nenalezena." };

  const status = normalizeFavouriteStatus(input.status) as FavouriteStatus;
  const rejectionReason =
    status === "REJECTED"
      ? ((input.rejectionReason ?? null) as FavouriteRejectionReason | null)
      : null;

  await prisma.favourite.update({
    where: { id: row.id },
    data: {
      status,
      rejectionReason,
    },
  });
  return { ok: true };
}

export async function moveFavouriteToShortlist(input: {
  userId: string;
  favouriteId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return updateFavouriteStatus({
    userId: input.userId,
    favouriteId: input.favouriteId,
    status: SHORTLIST_STATUS,
  });
}

export async function updateFavouriteNote(input: {
  userId: string;
  favouriteId: string;
  note: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.favourite.findFirst({
    where: { id: input.favouriteId, userId: input.userId },
    select: { id: true },
  });
  if (!row) return { ok: false, error: "Položka nenalezena." };
  const note = sanitizeFavouriteNote(input.note);
  await prisma.favourite.update({
    where: { id: row.id },
    data: { note },
  });
  return { ok: true };
}

export async function updateFavouriteMeta(input: {
  userId: string;
  favouriteId: string;
  folder?: string | null;
  priority?: number | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.favourite.findFirst({
    where: { id: input.favouriteId, userId: input.userId },
    select: { id: true },
  });
  if (!row) return { ok: false, error: "Položka nenalezena." };
  await prisma.favourite.update({
    where: { id: row.id },
    data: {
      ...(input.folder !== undefined
        ? { folder: sanitizeFavouriteFolder(input.folder) }
        : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
    },
  });
  return { ok: true };
}

/** Archive a SOLD favourite (BOD 121) — does not delete history/analysis. */
export async function archiveFavourite(input: {
  userId: string;
  favouriteId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.favourite.findFirst({
    where: { id: input.favouriteId, userId: input.userId },
    select: { id: true },
  });
  if (!row) return { ok: false, error: "Položka nenalezena." };
  await prisma.favourite.update({
    where: { id: row.id },
    data: { archivedAt: new Date() },
  });
  return { ok: true };
}

export async function unarchiveFavourite(input: {
  userId: string;
  favouriteId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.favourite.findFirst({
    where: { id: input.favouriteId, userId: input.userId },
    select: { id: true },
  });
  if (!row) return { ok: false, error: "Položka nenalezena." };
  await prisma.favourite.update({
    where: { id: row.id },
    data: { archivedAt: null },
  });
  return { ok: true };
}

/**
 * Merge guest favourites into account. Existing DB rows keep status unless
 * guest is FAVORITE (upgrade). Never invent properties. REJECTED stays rejected.
 */
export async function mergeGuestFavourites(input: {
  userId: string;
  items: FavouriteSaveInput[];
}): Promise<{ ok: true; merged: number; skipped: number } | { ok: false; error: string }> {
  let merged = 0;
  let skipped = 0;

  for (const item of input.items.slice(0, 50)) {
    const property = await prisma.property.findFirst({
      where: {
        OR: [{ id: item.propertyId }, { slug: item.slug }],
      },
      select: { id: true, askingPrice: true, priceCzk: true },
    });
    if (!property) {
      skipped += 1;
      continue;
    }

    const status = normalizeFavouriteStatus(
      item.status ?? "CONSIDERING",
    ) as FavouriteStatus;
    const existing = await prisma.favourite.findUnique({
      where: {
        userId_propertyId: { userId: input.userId, propertyId: property.id },
      },
      select: { id: true, status: true },
    });

    if (existing) {
      if (
        status === "FAVORITE" &&
        existing.status !== "FAVORITE" &&
        existing.status !== "REJECTED"
      ) {
        await prisma.favourite.update({
          where: { id: existing.id },
          data: { status: "FAVORITE" },
        });
        merged += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    await prisma.favourite.create({
      data: {
        userId: input.userId,
        propertyId: property.id,
        status,
        priceAtSave: item.priceCzk ?? property.askingPrice ?? property.priceCzk,
      },
    });
    merged += 1;
  }

  return { ok: true, merged, skipped };
}
