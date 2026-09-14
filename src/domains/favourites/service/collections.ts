/**
 * FavouriteCollection helpers — data model ready; full UI optional.
 */

import { prisma } from "@/lib/db";
import type { FavouriteCollectionDto } from "@/domains/favourites/types";
import { sanitizeFavouriteFolder } from "@/domains/favourites/service/sanitize";

function slugifyCollectionName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "kolekce";
}

export async function listFavouriteCollectionsForUser(
  userId: string,
): Promise<FavouriteCollectionDto[]> {
  const rows = await prisma.favouriteCollection.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      sortOrder: true,
      _count: { select: { favourites: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    sortOrder: r.sortOrder,
    itemCount: r._count.favourites,
  }));
}

export async function ensureFavouriteCollection(input: {
  userId: string;
  name: string;
}): Promise<{ ok: true; collection: FavouriteCollectionDto } | { ok: false; error: string }> {
  const name = sanitizeFavouriteFolder(input.name);
  if (!name) return { ok: false, error: "Název kolekce je povinný." };

  let slug = slugifyCollectionName(name);
  const existing = await prisma.favouriteCollection.findUnique({
    where: { userId_slug: { userId: input.userId, slug } },
    select: {
      id: true,
      name: true,
      slug: true,
      sortOrder: true,
      _count: { select: { favourites: true } },
    },
  });
  if (existing) {
    return {
      ok: true,
      collection: {
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        sortOrder: existing.sortOrder,
        itemCount: existing._count.favourites,
      },
    };
  }

  // Avoid rare slug collisions by appending short suffix
  const clash = await prisma.favouriteCollection.findFirst({
    where: { userId: input.userId, slug },
    select: { id: true },
  });
  if (clash) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const created = await prisma.favouriteCollection.create({
    data: {
      userId: input.userId,
      name,
      slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      sortOrder: true,
    },
  });
  return {
    ok: true,
    collection: {
      id: created.id,
      name: created.name,
      slug: created.slug,
      sortOrder: created.sortOrder,
      itemCount: 0,
    },
  };
}

export async function assignFavouriteToCollection(input: {
  userId: string;
  favouriteId: string;
  collectionId: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const fav = await prisma.favourite.findFirst({
    where: { id: input.favouriteId, userId: input.userId },
    select: { id: true },
  });
  if (!fav) return { ok: false, error: "Položka nenalezena." };

  if (input.collectionId) {
    const col = await prisma.favouriteCollection.findFirst({
      where: { id: input.collectionId, userId: input.userId },
      select: { id: true, name: true },
    });
    if (!col) return { ok: false, error: "Kolekce nenalezena." };
    await prisma.favourite.update({
      where: { id: fav.id },
      data: {
        collectionId: col.id,
        folder: col.name,
      },
    });
  } else {
    await prisma.favourite.update({
      where: { id: fav.id },
      data: { collectionId: null },
    });
  }
  return { ok: true };
}
