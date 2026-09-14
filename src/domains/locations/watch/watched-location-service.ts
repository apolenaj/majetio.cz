/**
 * Watched locations — foundation for dashboard + location alerts.
 * Reuses Notification / PropertyAlertEvent patterns (no email workers yet).
 */

import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/db";
import { locationHref } from "@/domains/locations/seo/location-urls";
import { LOCATION_DEMO_PROFILES } from "@/domains/locations/content/demo-profiles";

export type WatchedLocationDto = {
  id: string;
  locationSlug: string;
  locationLabel: string;
  canonicalPath: string;
  alertEnabled: boolean;
  createdAt: string;
};

export type WatchLocationResult =
  | { ok: true; item: WatchedLocationDto }
  | { ok: false; error: string };

function labelForSlug(slug: string): string {
  return LOCATION_DEMO_PROFILES[slug]?.location.publicLabel ?? slug;
}

function toDto(row: {
  id: string;
  locationSlug: string;
  locationLabel: string | null;
  alertEnabled: boolean;
  createdAt: Date;
}): WatchedLocationDto {
  return {
    id: row.id,
    locationSlug: row.locationSlug,
    locationLabel: row.locationLabel || labelForSlug(row.locationSlug),
    canonicalPath: locationHref(row.locationSlug),
    alertEnabled: row.alertEnabled,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listWatchedLocations(
  userId: string,
  db: PrismaClient = prisma,
): Promise<WatchedLocationDto[]> {
  const rows = await db.watchedLocation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDto);
}

/**
 * Persist watch + enqueue typed alert event foundation (in-app later).
 */
export async function watchLocation(input: {
  userId: string;
  locationSlug: string;
  alertEnabled?: boolean;
  db?: PrismaClient;
}): Promise<WatchLocationResult> {
  const db = input.db ?? prisma;
  const slug = input.locationSlug.trim().toLowerCase();
  if (!slug) return { ok: false, error: "Chybí slug lokality." };

  const label = labelForSlug(slug);
  const row = await db.watchedLocation.upsert({
    where: {
      userId_locationSlug: { userId: input.userId, locationSlug: slug },
    },
    create: {
      userId: input.userId,
      locationSlug: slug,
      locationLabel: label,
      alertEnabled: input.alertEnabled ?? true,
    },
    update: {
      locationLabel: label,
      ...(input.alertEnabled != null ? { alertEnabled: input.alertEnabled } : {}),
    },
  });

  if (row.alertEnabled) {
    await db.propertyAlertEvent.create({
      data: {
        userId: input.userId,
        alertType: "LOCATION_WATCH_CREATED",
        payload: {
          locationSlug: slug,
          locationLabel: label,
          scope: "watched_location",
        },
      },
    });
  }

  return { ok: true, item: toDto(row) };
}

export async function unwatchLocation(input: {
  userId: string;
  locationSlug: string;
  db?: PrismaClient;
}): Promise<{ ok: boolean }> {
  const db = input.db ?? prisma;
  await db.watchedLocation.deleteMany({
    where: {
      userId: input.userId,
      locationSlug: input.locationSlug.trim().toLowerCase(),
    },
  });
  return { ok: true };
}
