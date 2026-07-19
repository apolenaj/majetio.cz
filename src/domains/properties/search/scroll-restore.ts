/**
 * Persist search scroll so browser Back restores position (Prompt 8 Part 3).
 * Filters/pagination already live in the URL.
 */

const SCROLL_KEY = "majetio.search.scroll.v1";

export function saveSearchScrollPosition(href?: string): void {
  if (typeof window === "undefined") return;
  const key = href ?? `${window.location.pathname}${window.location.search}`;
  sessionStorage.setItem(
    SCROLL_KEY,
    JSON.stringify({ key, y: window.scrollY, at: Date.now() }),
  );
}

export function restoreSearchScrollPosition(href?: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { key?: string; y?: number; at?: number };
    const key = href ?? `${window.location.pathname}${window.location.search}`;
    if (parsed.key !== key) return;
    // Ignore stale entries older than 30 minutes
    if (parsed.at && Date.now() - parsed.at > 30 * 60 * 1000) return;
    const y = typeof parsed.y === "number" ? parsed.y : 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: "auto" });
    });
  } catch {
    // ignore
  }
}
