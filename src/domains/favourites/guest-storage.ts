/**
 * Guest favourites / shortlist — localStorage only (no server PII).
 * Schema-validated; never store passwords, tokens, or contact data.
 */

import {
  DEFAULT_SAVE_STATUS,
  isFavouriteStatus,
  normalizeFavouriteStatus,
  SHORTLIST_STATUS,
  type FavouriteStatusValue,
} from "./status";
import type { FavouriteSaveInput, GuestFavouriteItem } from "./types";
import { sanitizeFavouriteFolder, sanitizeFavouriteNote } from "./service/sanitize";

export const GUEST_FAVOURITES_STORAGE_KEY = "majetio.favourites.v2";
/** Legacy key from Prompt 8 — migrated once into v2. */
export const LEGACY_FAVOURITES_STORAGE_KEY = "majetio.favourites.v1";
/** Session mirror for authenticated users (does not trigger merge prompt). */
export const ACCOUNT_FAVOURITES_MIRROR_KEY = "majetio.favourites.accountMirror.v1";
export const GUEST_MERGE_DISMISSED_KEY = "majetio.favourites.mergeDismissed.v1";
export const FAVOURITES_CHANGED_EVENT = "majetio:favourites-changed";

/** Soft cap for guest localStorage favourites (BOD 165). */
export const MAX_GUEST_FAVOURITES = 50;
const MAX_GUEST_ITEMS = MAX_GUEST_FAVOURITES;

function emitChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FAVOURITES_CHANGED_EVENT));
}

function sanitizeItem(raw: unknown): GuestFavouriteItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const propertyId =
    typeof o.propertyId === "string"
      ? o.propertyId
      : typeof o.id === "string"
        ? o.id
        : null;
  const slug = typeof o.slug === "string" ? o.slug : null;
  const title = typeof o.title === "string" ? o.title : null;
  const href =
    typeof o.href === "string" && o.href.startsWith("/")
      ? o.href
      : slug
        ? `/nemovitosti/${slug}`
        : null;
  if (!propertyId || !slug || !title || !href) return null;

  const status: FavouriteStatusValue = normalizeFavouriteStatus(o.status);

  const createdAt =
    typeof o.createdAt === "string" && !Number.isNaN(Date.parse(o.createdAt))
      ? o.createdAt
      : new Date().toISOString();

  const priceAtSave =
    typeof o.priceAtSave === "number"
      ? o.priceAtSave
      : typeof o.priceCzk === "number"
        ? o.priceCzk
        : null;

  return {
    propertyId,
    slug,
    title,
    href,
    status,
    createdAt,
    priceAtSave,
    note: sanitizeFavouriteNote(typeof o.note === "string" ? o.note : null),
    folder: sanitizeFavouriteFolder(
      typeof o.folder === "string" ? o.folder : null,
    ),
    priority: typeof o.priority === "number" ? o.priority : null,
  };
}

function migrateLegacyIfNeeded(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(GUEST_FAVOURITES_STORAGE_KEY)) return;
    const legacy = localStorage.getItem(LEGACY_FAVOURITES_STORAGE_KEY);
    if (!legacy) return;
    const parsed = JSON.parse(legacy) as unknown[];
    if (!Array.isArray(parsed)) return;
    const items = parsed
      .map(sanitizeItem)
      .filter((x): x is GuestFavouriteItem => x != null)
      .slice(0, MAX_GUEST_ITEMS);
    localStorage.setItem(GUEST_FAVOURITES_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore corrupt legacy
  }
}

export function readGuestFavourites(): GuestFavouriteItem[] {
  if (typeof window === "undefined") return [];
  migrateLegacyIfNeeded();
  try {
    const raw = localStorage.getItem(GUEST_FAVOURITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeItem)
      .filter((x): x is GuestFavouriteItem => x != null)
      .slice(0, MAX_GUEST_ITEMS);
  } catch {
    return [];
  }
}

export function writeGuestFavourites(items: GuestFavouriteItem[]): void {
  if (typeof window === "undefined") return;
  const safe = items.slice(0, MAX_GUEST_ITEMS).map((i) => ({
    propertyId: i.propertyId,
    slug: i.slug,
    title: i.title.slice(0, 200),
    href: i.href.startsWith("/") ? i.href : `/nemovitosti/${i.slug}`,
    status: isFavouriteStatus(i.status) ? i.status : DEFAULT_SAVE_STATUS,
    createdAt: i.createdAt,
    priceAtSave: i.priceAtSave ?? null,
    note: i.note?.slice(0, 2000) ?? null,
    folder: i.folder?.slice(0, 80) ?? null,
    priority: i.priority ?? null,
  }));
  localStorage.setItem(GUEST_FAVOURITES_STORAGE_KEY, JSON.stringify(safe));
  emitChanged();
}

export function clearGuestFavourites(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_FAVOURITES_STORAGE_KEY);
  localStorage.removeItem(LEGACY_FAVOURITES_STORAGE_KEY);
  emitChanged();
}

export function readAccountFavouriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(ACCOUNT_FAVOURITES_MIRROR_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeAccountFavouriteIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    ACCOUNT_FAVOURITES_MIRROR_KEY,
    JSON.stringify([...new Set(ids)].slice(0, 200)),
  );
  emitChanged();
}

export function setAccountFavouriteId(idOrSlug: string, saved: boolean): void {
  const current = readAccountFavouriteIds();
  writeAccountFavouriteIds(
    saved
      ? [...current, idOrSlug]
      : current.filter((id) => id !== idOrSlug),
  );
}

export function isGuestFavourite(idOrSlug: string): boolean {
  if (
    readAccountFavouriteIds().some((id) => id === idOrSlug)
  ) {
    return true;
  }
  return readGuestFavourites().some(
    (f) => f.propertyId === idOrSlug || f.slug === idOrSlug,
  );
}

export function upsertGuestFavourite(
  input: FavouriteSaveInput,
  status: FavouriteStatusValue = DEFAULT_SAVE_STATUS,
): GuestFavouriteItem {
  const current = readGuestFavourites();
  const existing = current.find(
    (f) => f.propertyId === input.propertyId || f.slug === input.slug,
  );
  const next: GuestFavouriteItem = {
    propertyId: input.propertyId,
    slug: input.slug,
    title: input.title,
    href: input.href,
    status,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    priceAtSave:
      input.priceCzk ?? existing?.priceAtSave ?? null,
    note: existing?.note ?? null,
    folder: existing?.folder ?? null,
    priority: existing?.priority ?? null,
  };
  writeGuestFavourites([
    next,
    ...current.filter(
      (f) => f.propertyId !== input.propertyId && f.slug !== input.slug,
    ),
  ]);
  return next;
}

export function removeGuestFavourite(idOrSlug: string): void {
  writeGuestFavourites(
    readGuestFavourites().filter(
      (f) => f.propertyId !== idOrSlug && f.slug !== idOrSlug,
    ),
  );
}

export function moveGuestToShortlist(idOrSlug: string): GuestFavouriteItem | null {
  const current = readGuestFavourites();
  const idx = current.findIndex(
    (f) => f.propertyId === idOrSlug || f.slug === idOrSlug,
  );
  if (idx < 0) return null;
  const updated = { ...current[idx]!, status: SHORTLIST_STATUS };
  const next = [...current];
  next[idx] = updated;
  writeGuestFavourites(next);
  return updated;
}

export function guestFavouritesPendingMerge(): boolean {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(GUEST_MERGE_DISMISSED_KEY) === "1") return false;
  // Only true guest localStorage items — not the authenticated session mirror.
  migrateLegacyIfNeeded();
  try {
    const raw = localStorage.getItem(GUEST_FAVOURITES_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

export function dismissGuestMergePrompt(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(GUEST_MERGE_DISMISSED_KEY, "1");
}

export function clearGuestMergeDismissed(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GUEST_MERGE_DISMISSED_KEY);
}
