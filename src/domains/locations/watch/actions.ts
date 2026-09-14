"use server";

import { auth } from "@/lib/auth";
import {
  listWatchedLocations,
  unwatchLocation,
  watchLocation,
  type WatchedLocationDto,
} from "@/domains/locations/watch/watched-location-service";

export async function getWatchedLocationsAction(): Promise<{
  ok: boolean;
  items: WatchedLocationDto[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, items: [], error: "unauthorized" };
  }
  const items = await listWatchedLocations(session.user.id);
  return { ok: true, items };
}

export async function watchLocationAction(input: {
  locationSlug: string;
  alertEnabled?: boolean;
}): Promise<{ ok: boolean; item?: WatchedLocationDto; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "unauthorized" };
  }
  const result = await watchLocation({
    userId: session.user.id,
    locationSlug: input.locationSlug,
    alertEnabled: input.alertEnabled,
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, item: result.item };
}

export async function unwatchLocationAction(input: {
  locationSlug: string;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "unauthorized" };
  }
  await unwatchLocation({
    userId: session.user.id,
    locationSlug: input.locationSlug,
  });
  return { ok: true };
}
