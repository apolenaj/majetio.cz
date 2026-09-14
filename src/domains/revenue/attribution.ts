/**
 * Pure attribution window logic — multi-source → manual review.
 */

import { DEFAULT_ATTRIBUTION_WINDOW_DAYS } from "@/config/revenue-attribution";

export type AttributionTouchpoint = {
  sourceKey: string;
  channel: string;
  touchedAt: Date | string;
  campaign?: string;
};

export type AttributionDecision = {
  status: "ATTRIBUTED" | "MULTI_SOURCE_REVIEW" | "UNATTRIBUTED";
  primarySourceKey: string | null;
  competingSourceKeys: string[];
  windowStartsAt: Date;
  windowEndsAt: Date;
  reasonCs: string;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Decide attribution inside [anchor - windowDays, anchor].
 * Distinct sourceKeys (>1) within the window → MULTI_SOURCE_REVIEW.
 */
export function decideLeadAttribution(input: {
  touchpoints: AttributionTouchpoint[];
  /** Usually lead createdAt / qualifiedAt. */
  anchorAt?: Date;
  windowDays?: number;
}): AttributionDecision {
  const anchor = input.anchorAt ?? new Date();
  const days = Math.max(1, input.windowDays ?? DEFAULT_ATTRIBUTION_WINDOW_DAYS);
  const windowStartsAt = new Date(anchor.getTime() - days * 86_400_000);
  const windowEndsAt = anchor;

  const inWindow = input.touchpoints
    .map((t) => ({ ...t, at: toDate(t.touchedAt) }))
    .filter((t) => t.at >= windowStartsAt && t.at <= windowEndsAt)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  if (inWindow.length === 0) {
    return {
      status: "UNATTRIBUTED",
      primarySourceKey: null,
      competingSourceKeys: [],
      windowStartsAt,
      windowEndsAt,
      reasonCs: "V attribution window nebyl nalezen žádný zdroj.",
    };
  }

  const uniqueKeys = [...new Set(inWindow.map((t) => t.sourceKey.trim()).filter(Boolean))];

  if (uniqueKeys.length > 1) {
    return {
      status: "MULTI_SOURCE_REVIEW",
      primarySourceKey: null,
      competingSourceKeys: uniqueKeys,
      windowStartsAt,
      windowEndsAt,
      reasonCs:
        "Více konkurenčních zdrojů v attribution window — nutná manuální revize.",
    };
  }

  const primary = uniqueKeys[0] ?? inWindow[0]!.sourceKey;
  return {
    status: "ATTRIBUTED",
    primarySourceKey: primary,
    competingSourceKeys: [],
    windowStartsAt,
    windowEndsAt,
    reasonCs: `Připsáno zdroji ${primary}.`,
  };
}
