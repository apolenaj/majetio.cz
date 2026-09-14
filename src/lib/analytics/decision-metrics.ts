/**
 * Aggregated Decision Workspace business metrics (BOD 127).
 * In-process counters for jobs / future warehouse — no UI dashboard.
 * Never stores PII, notes, or CZK amounts.
 */

import { track } from "@/lib/analytics/events";

export type DecisionMetricKey =
  | "property_viewed"
  | "property_saved"
  | "property_shortlisted"
  | "comparison_created"
  | "analysis_started"
  | "purchase_intent"
  | "price_alert_opened"
  | "comparison_shared";

type DayBucket = {
  day: string;
  counts: Partial<Record<DecisionMetricKey, number>>;
};

const buckets = new Map<string, DayBucket>();

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function recordDecisionMetric(
  key: DecisionMetricKey,
  at = new Date(),
): void {
  const day = todayKey(at);
  const bucket = buckets.get(day) ?? { day, counts: {} };
  bucket.counts[key] = (bucket.counts[key] ?? 0) + 1;
  buckets.set(day, bucket);
}

export function getDecisionMetricsSnapshot(day = todayKey()): {
  day: string;
  counts: Partial<Record<DecisionMetricKey, number>>;
  /** Derived rates — null when denominator is 0. */
  rates: {
    saveRate: number | null;
    compareRate: number | null;
    shortlistRate: number | null;
  };
} {
  const bucket = buckets.get(day) ?? { day, counts: {} };
  const viewed = bucket.counts.property_viewed ?? 0;
  const saved = bucket.counts.property_saved ?? 0;
  const compared = bucket.counts.comparison_created ?? 0;
  const shortlisted = bucket.counts.property_shortlisted ?? 0;

  return {
    day,
    counts: { ...bucket.counts },
    rates: {
      saveRate: viewed > 0 ? saved / viewed : null,
      compareRate: saved > 0 ? compared / saved : null,
      shortlistRate: saved > 0 ? shortlisted / saved : null,
    },
  };
}

export function resetDecisionMetricsForTests(): void {
  buckets.clear();
}

/** Map funnel analytics events → aggregated counters + typed track. */
export function observeFunnelStep(
  step:
    | "viewed"
    | "saved"
    | "shortlisted"
    | "compared"
    | "analysis"
    | "purchase_intent",
): void {
  const map: Record<typeof step, DecisionMetricKey> = {
    viewed: "property_viewed",
    saved: "property_saved",
    shortlisted: "property_shortlisted",
    compared: "comparison_created",
    analysis: "analysis_started",
    purchase_intent: "purchase_intent",
  };
  recordDecisionMetric(map[step]);
  track({
    name: "decision_funnel_step",
    props: { step },
  });
}

/** Bucket note length for analytics — never the note text. */
export function noteLengthBucket(
  length: number,
): "0" | "1-80" | "81-400" | "401+" {
  if (length <= 0) return "0";
  if (length <= 80) return "1-80";
  if (length <= 400) return "81-400";
  return "401+";
}
