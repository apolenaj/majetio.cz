/**
 * Listing freshness / stale rules (Prompt 7 Part 2).
 * Pure helpers — wire to cron / fetch jobs later; no side effects here.
 */

export const DEFAULT_STALE_AFTER_DAYS = 14;
export const DEFAULT_UNAVAILABLE_AFTER_DAYS = 30;

export type FreshnessInput = {
  lastSeenAt: Date;
  /** Optional override of "now" for tests. */
  now?: Date;
  staleAfterDays?: number;
  unavailableAfterDays?: number;
};

export type FreshnessDecision = {
  freshness: "FRESH" | "STALE" | "UNAVAILABLE";
  /** Suggested PropertyStatus when moving off ACTIVE due to silence. */
  suggestedStatus: "ACTIVE" | "UNAVAILABLE" | null;
  daysSinceSeen: number;
};

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/**
 * If a listing was not confirmed by any source for X days → STALE,
 * after Y days → UNAVAILABLE (offer disappeared ≠ sold).
 */
export function evaluatePropertyFreshness(input: FreshnessInput): FreshnessDecision {
  const now = input.now ?? new Date();
  const staleAfter = input.staleAfterDays ?? DEFAULT_STALE_AFTER_DAYS;
  const unavailableAfter = input.unavailableAfterDays ?? DEFAULT_UNAVAILABLE_AFTER_DAYS;
  const daysSinceSeen = Math.max(0, daysBetween(input.lastSeenAt, now));

  if (daysSinceSeen >= unavailableAfter) {
    return {
      freshness: "UNAVAILABLE",
      suggestedStatus: "UNAVAILABLE",
      daysSinceSeen,
    };
  }
  if (daysSinceSeen >= staleAfter) {
    return {
      freshness: "STALE",
      suggestedStatus: null,
      daysSinceSeen,
    };
  }
  return {
    freshness: "FRESH",
    suggestedStatus: "ACTIVE",
    daysSinceSeen,
  };
}

/** Default placeholder media URL when a listing has no photos. */
export const PROPERTY_MEDIA_PLACEHOLDER = {
  url: "/brand/social/majetio-og-brand.png",
  type: "PHOTO" as const,
  isPlaceholder: true,
  alt: "Náhled nemovitosti není k dispozici",
  licenseStatus: "OWNED" as const,
};
