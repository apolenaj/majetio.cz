import { describe, expect, it } from "vitest";

import {
  assertAnalyticsSafe,
  track,
  type AnalyticsEvent,
} from "@/lib/analytics/events";
import {
  getDecisionMetricsSnapshot,
  noteLengthBucket,
  observeFunnelStep,
  resetDecisionMetricsForTests,
} from "@/lib/analytics/decision-metrics";

describe("Decision Workspace analytics — privacy + funnel", () => {
  it("rejects private note content keys", () => {
    expect(() =>
      assertAnalyticsSafe({
        name: "decision_note_saved",
        props: { length_bucket: "1-80", note: "secret text" } as never,
      }),
    ).toThrow(/forbidden prop key/i);
  });

  it("allows note length bucket without body", () => {
    expect(() =>
      assertAnalyticsSafe({
        name: "decision_note_saved",
        props: { length_bucket: "81-400" },
      }),
    ).not.toThrow();
    expect(noteLengthBucket(0)).toBe("0");
    expect(noteLengthBucket(40)).toBe("1-80");
    expect(noteLengthBucket(200)).toBe("81-400");
    expect(noteLengthBucket(900)).toBe("401+");
  });

  it("tracks funnel Viewed → Saved → Shortlisted → Compared", () => {
    resetDecisionMetricsForTests();
    observeFunnelStep("viewed");
    observeFunnelStep("saved");
    observeFunnelStep("shortlisted");
    observeFunnelStep("compared");
    const snap = getDecisionMetricsSnapshot();
    expect(snap.counts.property_viewed).toBe(1);
    expect(snap.counts.property_saved).toBe(1);
    expect(snap.counts.property_shortlisted).toBe(1);
    expect(snap.counts.comparison_created).toBe(1);
    expect(snap.rates.saveRate).toBe(1);
    expect(snap.rates.shortlistRate).toBe(1);
    expect(snap.rates.compareRate).toBe(1);
  });

  it("core Decision Workspace events are typed and safe", () => {
    const events: AnalyticsEvent[] = [
      {
        name: "property_favorited",
        props: { action: "add", is_demo: true, status: "CONSIDERING" },
      },
      { name: "property_shortlisted", props: { is_demo: false } },
      { name: "comparison_created", props: { property_count: 3 } },
      {
        name: "price_alert_opened",
        props: { alert_type: "PRICE_DECREASE", channel: "IN_APP" },
      },
      { name: "decision_funnel_step", props: { step: "compared" } },
    ];
    for (const e of events) {
      expect(() => track(e)).not.toThrow();
    }
  });
});
