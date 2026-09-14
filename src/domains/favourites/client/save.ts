/**
 * Client-side save / toggle with optimistic UI + rollback.
 */

import { buildLoginUrl } from "@/lib/auth/callback-url";
import {
  isGuestFavourite,
  readGuestFavourites,
  removeGuestFavourite,
  setAccountFavouriteId,
  upsertGuestFavourite,
  writeAccountFavouriteIds,
  writeGuestFavourites,
  readAccountFavouriteIds,
} from "@/domains/favourites/guest-storage";
import { DEFAULT_SAVE_STATUS } from "@/domains/favourites/status";
import {
  SAVE_FAILURE_MESSAGE,
  type FavouriteItem,
  type FavouriteSaveInput,
} from "@/domains/favourites/types";

async function fetchSessionUser(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/session", { credentials: "same-origin" });
    if (!res.ok) return false;
    const data = (await res.json()) as { user?: unknown };
    return Boolean(data?.user);
  } catch {
    return false;
  }
}

export function isFavourite(idOrSlug: string): boolean {
  return isGuestFavourite(idOrSlug);
}

export type ToggleSaveResult =
  | { ok: true; added: boolean; mode: "guest" | "account" }
  | { ok: false; reason: "login_required"; loginUrl: string }
  | { ok: false; reason: "error"; message: string };

/**
 * Toggle save. Guests stay in local storage (no forced login).
 * Authenticated users hit server action; on failure caller should rollback UI.
 *
 * Pass `requireAuth: true` to force login redirect (legacy detail behaviour).
 */
export async function toggleSaveProperty(
  input: FavouriteSaveInput,
  options?: {
    requireAuth?: boolean;
    /** Optimistic local snapshot for rollback when auth fails mid-flight. */
    onOptimistic?: (nextSaved: boolean) => void;
  },
): Promise<ToggleSaveResult> {
  const loggedIn = await fetchSessionUser();
  const currentlySaved = isGuestFavourite(input.propertyId) || isGuestFavourite(input.slug);

  if (!loggedIn) {
    if (options?.requireAuth) {
      const callback =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : input.href;
      return {
        ok: false,
        reason: "login_required",
        loginUrl: buildLoginUrl(callback),
      };
    }

    const nextSaved = !currentlySaved;
    options?.onOptimistic?.(nextSaved);
    try {
      if (currentlySaved) {
        removeGuestFavourite(input.propertyId);
        removeGuestFavourite(input.slug);
      } else {
        upsertGuestFavourite(input, input.status ?? DEFAULT_SAVE_STATUS);
      }
      return { ok: true, added: nextSaved, mode: "guest" };
    } catch {
      options?.onOptimistic?.(currentlySaved);
      return { ok: false, reason: "error", message: SAVE_FAILURE_MESSAGE };
    }
  }

  const nextSaved = !currentlySaved;
  const snapshotGuest = readGuestFavourites();
  const snapshotAccount = readAccountFavouriteIds();
  options?.onOptimistic?.(nextSaved);

  try {
    setAccountFavouriteId(input.propertyId, nextSaved);
    setAccountFavouriteId(input.slug, nextSaved);
  } catch {
    // mirror optional
  }

  try {
    const { saveFavouriteAction, removeFavouriteAction } = await import(
      "@/domains/favourites/server/actions"
    );

    const result = nextSaved
      ? await saveFavouriteAction({
          propertyId: input.propertyId,
          slug: input.slug,
          priceCzk: input.priceCzk,
          status: input.status ?? DEFAULT_SAVE_STATUS,
        })
      : await removeFavouriteAction({ propertyId: input.propertyId });

    if (!result.ok) {
      writeGuestFavourites(snapshotGuest);
      writeAccountFavouriteIds(snapshotAccount);
      options?.onOptimistic?.(currentlySaved);
      if ("error" in result && result.error === "unauthorized") {
        return {
          ok: false,
          reason: "login_required",
          loginUrl: buildLoginUrl(input.href),
        };
      }
      return {
        ok: false,
        reason: "error",
        message:
          ("error" in result && result.error) || SAVE_FAILURE_MESSAGE,
      };
    }

    return { ok: true, added: nextSaved, mode: "account" };
  } catch {
    writeGuestFavourites(snapshotGuest);
    writeAccountFavouriteIds(snapshotAccount);
    options?.onOptimistic?.(currentlySaved);
    return { ok: false, reason: "error", message: SAVE_FAILURE_MESSAGE };
  }
}

/** Legacy adapter used by older search helpers. */
export async function toggleFavourite(
  item: FavouriteItem,
): Promise<
  | { ok: true; added: boolean }
  | { ok: false; reason: "login_required"; loginUrl: string }
  | { ok: false; reason: "error"; message: string }
> {
  const result = await toggleSaveProperty(
    {
      propertyId: item.id,
      slug: item.slug,
      title: item.title,
      href: item.href,
      priceCzk: item.priceCzk,
    },
    { requireAuth: false },
  );

  if (result.ok) return { ok: true, added: result.added };
  if (result.reason === "login_required") {
    return { ok: false, reason: "login_required", loginUrl: result.loginUrl };
  }
  return { ok: false, reason: "error", message: result.message };
}

export {
  readGuestFavourites as readFavourites,
  writeGuestFavourites as writeFavourites,
  GUEST_FAVOURITES_STORAGE_KEY as FAVOURITES_STORAGE_KEY,
} from "@/domains/favourites/guest-storage";
