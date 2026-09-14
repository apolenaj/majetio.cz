"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/auth/audit";
import { prisma } from "@/lib/db";
import { FAVOURITE_STATUSES } from "../status";
import {
  listFavouritePropertyIds,
  mergeGuestFavourites,
  moveFavouriteToShortlist,
  removeFavourite,
  saveFavourite,
  toggleFavouriteForUser,
  updateFavouriteMeta,
  updateFavouriteNote,
  updateFavouriteStatus,
  archiveFavourite,
  unarchiveFavourite,
} from "../service/favourite-service";
import { assertFavouriteMutationAllowed } from "../service/rate-limit";
import { SAVE_FAILURE_MESSAGE } from "../types";

function revalidateFavourites() {
  revalidatePath("/ucet/oblibene");
  revalidatePath("/ucet");
}

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function auditFavourite(input: {
  userId: string;
  action: string;
  propertyId: string;
  status?: string;
}) {
  await writeAuditLog({
    actorId: input.userId,
    action: input.action,
    entity: "Property",
    entityId: input.propertyId,
    meta: {
      propertyId: input.propertyId,
      ...(input.status ? { status: input.status } : {}),
    },
  }).catch(() => undefined);
}

const saveSchema = z.object({
  propertyId: z.string().min(1).max(64),
  slug: z.string().min(1).max(160).optional(),
  priceCzk: z.number().int().nonnegative().nullable().optional(),
  status: z.enum(FAVOURITE_STATUSES).optional(),
});

export async function listFavouritesAction(input?: {
  status?: (typeof FAVOURITE_STATUSES)[number];
  page?: number;
  pageSize?: number;
  sort?:
    | "recently_saved"
    | "activity"
    | "price_asc"
    | "price_desc"
    | "price_drop"
    | "status"
    | "match";
  archivedOnly?: boolean;
  includeArchived?: boolean;
  excludeRejected?: boolean;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };

  const { listFavouritesPageForUser, countFavouritesByTab } = await import(
    "../service/favourite-service"
  );
  const { listFavouriteCollectionsForUser } = await import(
    "../service/collections"
  );

  const [page, counts, collections] = await Promise.all([
    listFavouritesPageForUser(userId, {
      status: input?.status,
      page: input?.page ?? 1,
      pageSize: input?.pageSize,
      sort: input?.sort ?? "recently_saved",
      archivedOnly: input?.archivedOnly,
      includeArchived: input?.includeArchived,
      excludeRejected:
        input?.excludeRejected ??
        (!input?.status && !input?.archivedOnly),
    }),
    countFavouritesByTab(userId),
    listFavouriteCollectionsForUser(userId),
  ]);

  return {
    ok: true as const,
    items: page.items,
    page: page.page,
    pageSize: page.pageSize,
    total: page.total,
    totalPages: page.totalPages,
    hasMore: page.hasMore,
    sort: page.sort,
    counts,
    collections,
  };
}

export async function listFavouriteIdsAction() {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, ids: [] as string[] };
  const ids = await listFavouritePropertyIds(userId);
  return { ok: true as const, ids };
}

export async function toggleFavouriteAction(input: {
  propertyId: string;
  slug?: string;
  priceCzk?: number | null;
}) {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false as const, error: "unauthorized" as const };
  }

  const limited = await assertFavouriteMutationAllowed(userId, "save");
  if (!limited.ok) {
    return { ok: false as const, error: limited.error };
  }

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: SAVE_FAILURE_MESSAGE };
  }

  let propertyId = parsed.data.propertyId;
  if (parsed.data.slug) {
    const bySlug = await prisma.property.findFirst({
      where: {
        OR: [{ id: propertyId }, { slug: parsed.data.slug }],
      },
      select: { id: true },
    });
    if (!bySlug) {
      return { ok: false as const, error: SAVE_FAILURE_MESSAGE };
    }
    propertyId = bySlug.id;
  }

  const result = await toggleFavouriteForUser({
    userId,
    propertyId,
    priceAtSave: parsed.data.priceCzk,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error || SAVE_FAILURE_MESSAGE };
  }

  await auditFavourite({
    userId,
    action: result.added ? "favourite.save" : "favourite.remove",
    propertyId,
    status: result.added ? "CONSIDERING" : undefined,
  });

  const { track } = await import("@/lib/analytics/events");
  const { observeFunnelStep, recordDecisionMetric } = await import(
    "@/lib/analytics/decision-metrics"
  );
  const prop = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { isDemo: true },
  });
  track({
    name: "property_favorited",
    props: {
      action: result.added ? "add" : "remove",
      is_demo: Boolean(prop?.isDemo),
      status: result.added ? "CONSIDERING" : undefined,
    },
  });
  track({
    name: "property_saved",
    props: {
      action: result.added ? "add" : "remove",
      is_demo: Boolean(prop?.isDemo),
    },
  });
  if (result.added) {
    observeFunnelStep("saved");
    recordDecisionMetric("property_saved");
  }

  revalidateFavourites();
  return { ok: true as const, added: result.added };
}

export async function saveFavouriteAction(input: {
  propertyId: string;
  slug?: string;
  priceCzk?: number | null;
  status?: (typeof FAVOURITE_STATUSES)[number];
}) {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false as const, error: "unauthorized" as const };
  }

  const limited = await assertFavouriteMutationAllowed(userId, "save");
  if (!limited.ok) {
    return { ok: false as const, error: limited.error };
  }

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: SAVE_FAILURE_MESSAGE };
  }

  let propertyId = parsed.data.propertyId;
  if (parsed.data.slug) {
    const bySlug = await prisma.property.findFirst({
      where: {
        OR: [{ id: propertyId }, { slug: parsed.data.slug }],
      },
      select: { id: true },
    });
    if (!bySlug) {
      return { ok: false as const, error: SAVE_FAILURE_MESSAGE };
    }
    propertyId = bySlug.id;
  }

  const result = await saveFavourite({
    userId,
    propertyId,
    status: parsed.data.status,
    priceAtSave: parsed.data.priceCzk,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error || SAVE_FAILURE_MESSAGE };
  }

  if (result.added) {
    await auditFavourite({
      userId,
      action: "favourite.save",
      propertyId,
      status: parsed.data.status ?? "CONSIDERING",
    });
  }

  revalidateFavourites();
  return { ok: true as const, added: result.added };
}

export async function removeFavouriteAction(input: {
  favouriteId?: string;
  propertyId?: string;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "unauthorized" as const };

  const limited = await assertFavouriteMutationAllowed(userId, "remove");
  if (!limited.ok) {
    return { ok: false as const, error: limited.error };
  }

  let propertyId = input.propertyId ?? null;
  if (!propertyId && input.favouriteId) {
    const row = await prisma.favourite.findFirst({
      where: { id: input.favouriteId, userId },
      select: { propertyId: true },
    });
    propertyId = row?.propertyId ?? null;
  }

  const result = await removeFavourite({
    userId,
    favouriteId: input.favouriteId,
    propertyId: input.propertyId,
  });
  if (!result.ok) return { ok: false as const, error: result.error };

  if (propertyId) {
    await auditFavourite({
      userId,
      action: "favourite.remove",
      propertyId,
    });
  }

  revalidateFavourites();
  return { ok: true as const };
}

export async function moveToShortlistAction(input: { favouriteId: string }) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };

  const fav = await prisma.favourite.findFirst({
    where: { id: input.favouriteId, userId },
    select: { propertyId: true },
  });

  const result = await moveFavouriteToShortlist({
    userId,
    favouriteId: input.favouriteId,
  });
  if (!result.ok) return { ok: false as const, error: result.error };

  if (fav) {
    await auditFavourite({
      userId,
      action: "favourite.shortlist",
      propertyId: fav.propertyId,
      status: "FAVORITE",
    });
    const { track } = await import("@/lib/analytics/events");
    const { observeFunnelStep, recordDecisionMetric } = await import(
      "@/lib/analytics/decision-metrics"
    );
    const prop = await prisma.property.findUnique({
      where: { id: fav.propertyId },
      select: { isDemo: true },
    });
    track({
      name: "property_shortlisted",
      props: { is_demo: Boolean(prop?.isDemo) },
    });
    observeFunnelStep("shortlisted");
    recordDecisionMetric("property_shortlisted");
  }

  revalidateFavourites();
  return { ok: true as const };
}

export async function updateFavouriteStatusAction(input: {
  favouriteId: string;
  status: (typeof FAVOURITE_STATUSES)[number];
  rejectionReason?: string | null;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };

  const { assertFavouriteMutationAllowed } = await import(
    "../service/rate-limit"
  );
  const limited = await assertFavouriteMutationAllowed(userId, "status");
  if (!limited.ok) return { ok: false as const, error: limited.error };

  const fav = await prisma.favourite.findFirst({
    where: { id: input.favouriteId, userId },
    select: { propertyId: true },
  });

  const { isFavouriteRejectionReason } = await import("../status");
  const rejectionReason = isFavouriteRejectionReason(input.rejectionReason)
    ? input.rejectionReason
    : null;

  const result = await updateFavouriteStatus({
    userId,
    favouriteId: input.favouriteId,
    status: input.status,
    rejectionReason,
  });
  if (!result.ok) return { ok: false as const, error: result.error };

  if (fav) {
    await auditFavourite({
      userId,
      action:
        input.status === "FAVORITE"
          ? "favourite.shortlist"
          : "favourite.status_change",
      propertyId: fav.propertyId,
      status: input.status,
    });
  }

  revalidateFavourites();
  return { ok: true as const };
}

export async function updateFavouriteNoteAction(input: {
  favouriteId: string;
  note: string | null;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };

  const limited = await assertFavouriteMutationAllowed(userId, "note");
  if (!limited.ok) return { ok: false as const, error: limited.error };

  const result = await updateFavouriteNote({
    userId,
    favouriteId: input.favouriteId,
    note: input.note,
  });
  if (!result.ok) return { ok: false as const, error: result.error };
  revalidateFavourites();
  return { ok: true as const };
}

export async function updateFavouriteMetaAction(input: {
  favouriteId: string;
  folder?: string | null;
  priority?: number | null;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };

  const limited = await assertFavouriteMutationAllowed(userId, "meta");
  if (!limited.ok) return { ok: false as const, error: limited.error };

  const result = await updateFavouriteMeta({
    userId,
    favouriteId: input.favouriteId,
    folder: input.folder,
    priority: input.priority,
  });
  if (!result.ok) return { ok: false as const, error: result.error };
  revalidateFavourites();
  return { ok: true as const };
}

export async function archiveFavouriteAction(input: { favouriteId: string }) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };

  const result = await archiveFavourite({
    userId,
    favouriteId: input.favouriteId,
  });
  if (!result.ok) return { ok: false as const, error: result.error };
  revalidateFavourites();
  return { ok: true as const };
}

export async function unarchiveFavouriteAction(input: { favouriteId: string }) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };

  const result = await unarchiveFavourite({
    userId,
    favouriteId: input.favouriteId,
  });
  if (!result.ok) return { ok: false as const, error: result.error };
  revalidateFavourites();
  return { ok: true as const };
}

const mergeItemSchema = z.object({
  propertyId: z.string().min(1).max(64),
  slug: z.string().min(1).max(160),
  title: z.string().min(1).max(200),
  href: z.string().min(1).max(300),
  priceCzk: z.number().int().nonnegative().nullable().optional(),
  status: z.enum(FAVOURITE_STATUSES).optional(),
});

export async function mergeGuestFavouritesAction(input: {
  items: z.infer<typeof mergeItemSchema>[];
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };

  const items = z.array(mergeItemSchema).max(50).safeParse(input.items);
  if (!items.success) {
    return { ok: false as const, error: "Neplatná data k přenosu." };
  }

  const result = await mergeGuestFavourites({
    userId,
    items: items.data,
  });
  if (!result.ok) return { ok: false as const, error: result.error };

  revalidateFavourites();
  return {
    ok: true as const,
    merged: result.merged,
    skipped: result.skipped,
  };
}
