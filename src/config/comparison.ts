/**
 * Comparison Engine — central limits and defaults.
 * Never hardcode max tray size in UI components.
 */

export const comparisonConfig = {
  /** Max properties in one comparison / tray. */
  maxProperties: 4,
  /** Min properties required to open full comparison view. */
  minPropertiesToCompare: 2,
  /** Exact refuse copy when tray is full (never auto-delete). */
  trayFullMessageCs:
    "Pro přidání další nemovitosti nejprve jednu odeberte",
  emptyCompareMessageCs: "Přidejte alespoň 2 nemovitosti.",
  /** Illustrative mortgage defaults when Finanční pas lacks rate/term. */
  illustrativeMortgage: {
    /** Nominal annual rate in percentage points (e.g. 5.25 = 5.25 %). */
    interestRatePp: 5.25,
    termYears: 30,
    /** Fallback LTV when equity is unknown (illustrative only). */
    defaultLtvRatio: 0.8,
  },
  /** Public module cache (valuation / location / investment) — never personal financing. */
  publicCacheTtlMs: 5 * 60_000,
  storage: {
    trayKey: "majetio.compare.v1",
  },
  decision: {
    /** Completeness: ready when open gaps ≤ this count. */
    readyMaxMissing: 1,
    mediumMaxMissing: 3,
  },
} as const;

export type ComparisonConfig = typeof comparisonConfig;

/** @deprecated Prefer comparisonConfig.maxProperties */
export const COMPARE_MAX = comparisonConfig.maxProperties;
