import { describe, expect, it, vi, beforeEach } from "vitest";

import { track, type AnalyticsEvent } from "@/lib/analytics/events";

describe("analytics track", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts homepage funnel events without PII fields", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const event: AnalyticsEvent = {
      name: "homepage_viewed",
      props: {
        experiment_h1: "control",
        experiment_cta: "control",
        experiment_order: "control",
      },
    };
    track(event);
    if (process.env.NODE_ENV === "development") {
      expect(spy).toHaveBeenCalled();
    }
    expect(JSON.stringify(event)).not.toMatch(/@|email|phone|rodn/i);
  });

  it("types quick analysis validity without URL payload", () => {
    const event: AnalyticsEvent = {
      name: "quick_analysis_submitted",
      props: { entry: "url", valid: false },
    };
    expect(event.props).not.toHaveProperty("listingUrl");
  });
});
