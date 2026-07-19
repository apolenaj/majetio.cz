/**
 * Favourites helpers (Prompt 8 Part 3).
 * Unauthenticated users are redirected to login with safe callbackUrl.
 */

import { buildLoginUrl } from "@/lib/auth/callback-url";

export const FAVOURITES_STORAGE_KEY = "majetio.favourites.v1";

export type FavouriteItem = {
  id: string;
  slug: string;
  title: string;
  href: string;
};

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

export function readFavourites(): FavouriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVOURITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavouriteItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeFavourites(items: FavouriteItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("majetio:favourites-changed"));
}

export function isFavourite(idOrSlug: string): boolean {
  return readFavourites().some((f) => f.id === idOrSlug || f.slug === idOrSlug);
}

export type FavouriteActionResult =
  | { ok: true; added: boolean }
  | { ok: false; reason: "login_required"; loginUrl: string };

/**
 * Toggle favourite. If not signed in → login redirect URL (caller navigates).
 */
export async function toggleFavourite(item: FavouriteItem): Promise<FavouriteActionResult> {
  const loggedIn = await fetchSessionUser();
  if (!loggedIn) {
    const callback =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : item.href;
    return {
      ok: false,
      reason: "login_required",
      loginUrl: buildLoginUrl(callback),
    };
  }

  const current = readFavourites();
  const exists = current.some((f) => f.id === item.id || f.slug === item.slug);
  if (exists) {
    writeFavourites(current.filter((f) => f.id !== item.id && f.slug !== item.slug));
    return { ok: true, added: false };
  }
  writeFavourites([...current, item]);
  return { ok: true, added: true };
}
