/**
 * Client-side compare tray — max from comparisonConfig.
 */

import { comparisonConfig } from "@/config/comparison";

export const COMPARE_MAX = comparisonConfig.maxProperties;
export const COMPARE_FULL_MESSAGE = comparisonConfig.trayFullMessageCs;
export const COMPARE_STORAGE_KEY = comparisonConfig.storage.trayKey;
export const COMPARE_CHANGED_EVENT = "majetio:compare-changed";

export type CompareTrayItem = {
  id: string;
  slug: string;
  title: string;
  href: string;
  priceCzk?: number;
  location?: string;
  imageUrl?: string;
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
  localStorage.setItem(
    COMPARE_STORAGE_KEY,
    JSON.stringify(items.slice(0, COMPARE_MAX)),
  );
  window.dispatchEvent(new CustomEvent(COMPARE_CHANGED_EVENT));
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

export function removeCompareItem(idOrSlug: string): CompareTrayItem[] {
  const items = readCompareTray().filter(
    (c) => c.id !== idOrSlug && c.slug !== idOrSlug,
  );
  writeCompareTray(items);
  return items;
}

export function clearCompareTray(): void {
  writeCompareTray([]);
}

/** Bulk-add until tray is full. Returns how many were added. */
export function addCompareItems(items: CompareTrayItem[]): {
  added: number;
  skipped: number;
  full: boolean;
  items: CompareTrayItem[];
} {
  let current = readCompareTray();
  let added = 0;
  let skipped = 0;
  for (const item of items) {
    const exists = current.some((c) => c.id === item.id || c.slug === item.slug);
    if (exists) {
      skipped += 1;
      continue;
    }
    if (current.length >= COMPARE_MAX) {
      writeCompareTray(current);
      return { added, skipped, full: true, items: current };
    }
    current = [...current, item];
    added += 1;
  }
  writeCompareTray(current);
  return {
    added,
    skipped,
    full: current.length >= COMPARE_MAX,
    items: current,
  };
}

export function isInCompareTray(idOrSlug: string): boolean {
  return readCompareTray().some((c) => c.id === idOrSlug || c.slug === idOrSlug);
}
