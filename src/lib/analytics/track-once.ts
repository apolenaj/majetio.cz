/**
 * Deduplicate analytics events within a browser session / server process.
 */

import { track, type AnalyticsEvent } from "@/lib/analytics/events";

const serverOnce = new Set<string>();

function markClientOnce(key: string): boolean {
  if (typeof sessionStorage === "undefined") return true;
  try {
    const storageKey = `majetio_analytics_once:${key}`;
    if (sessionStorage.getItem(storageKey)) return false;
    sessionStorage.setItem(storageKey, "1");
    return true;
  } catch {
    return true;
  }
}

/**
 * Fire at most once per key (e.g. `property_detail:${slug}`).
 * Use for page views / analysis mounts — not for intentional repeats (filter spam).
 */
export function trackOnce(dedupeKey: string, event: AnalyticsEvent): void {
  const key = `${dedupeKey}:${event.name}`;
  if (typeof window === "undefined") {
    if (serverOnce.has(key)) return;
    serverOnce.add(key);
  } else if (!markClientOnce(key)) {
    return;
  }
  track(event);
}

/** Test helper */
export function resetAnalyticsOnceForTests(): void {
  serverOnce.clear();
}
