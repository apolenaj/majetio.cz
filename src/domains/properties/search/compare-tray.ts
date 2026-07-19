/**
 * Client-side compare tray (max 4) — Prompt 8 Part 3.
 * Persists in localStorage so Zpět / refresh keeps selection.
 */

export const COMPARE_MAX = 4;
export const COMPARE_STORAGE_KEY = "majetio.compare.v1";

export type CompareTrayItem = {
  id: string;
  slug: string;
  title: string;
  href: string;
  priceCzk?: number;
  location?: string;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readCompareTray(): CompareTrayItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CompareTrayItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, COMPARE_MAX);
  } catch {
    return [];
  }
}

export function writeCompareTray(items: CompareTrayItem[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items.slice(0, COMPARE_MAX)));
  window.dispatchEvent(new CustomEvent("majetio:compare-changed"));
}

export type CompareToggleResult =
  | { ok: true; items: CompareTrayItem[]; added: boolean }
  | { ok: false; reason: "full"; items: CompareTrayItem[] };

export function toggleCompareItem(item: CompareTrayItem): CompareToggleResult {
  const current = readCompareTray();
  const exists = current.some((c) => c.id === item.id || c.slug === item.slug);
  if (exists) {
    const items = current.filter((c) => c.id !== item.id && c.slug !== item.slug);
    writeCompareTray(items);
    return { ok: true, items, added: false };
  }
  if (current.length >= COMPARE_MAX) {
    return { ok: false, reason: "full", items: current };
  }
  const items = [...current, item];
  writeCompareTray(items);
  return { ok: true, items, added: true };
}

export function isInCompareTray(idOrSlug: string): boolean {
  return readCompareTray().some((c) => c.id === idOrSlug || c.slug === idOrSlug);
}
