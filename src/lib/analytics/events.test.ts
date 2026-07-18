import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  assertAnalyticsSafe,
  percentBucket,
  track,
  type AnalyticsEvent,
} from "@/lib/analytics/events";

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

  it("allows account events without amounts or emails", () => {
    const events: AnalyticsEvent[] = [
      { name: "signup_completed", props: { consents: "terms_privacy" } },
      {
        name: "financial_profile_updated",
        props: { completion_level: "basic", percent_bucket: "40-69" },
      },
      { name: "consent_given", props: { type: "MARKETING", source: "ucet/souhlasy" } },
      {
        name: "partner_handoff_confirmed",
        props: { partner: "hypotekajasne", field_count: 3, is_mock: true },
      },
    ];
    for (const event of events) {
      expect(() => assertAnalyticsSafe(event)).not.toThrow();
      expect(JSON.stringify(event)).not.toMatch(/@|Kč|password|8000000/i);
    }
  });

  it("rejects email-like payloads", () => {
    expect(() =>
      assertAnalyticsSafe({
        name: "login_failed",
        // @ts-expect-error intentional unsafe payload
        props: { reason: "credentials", email: "a@b.cz" },
      }),
    ).toThrow(/e-mail/i);
  });

  it("buckets percents without raw values in analytics props", () => {
    expect(percentBucket(0)).toBe("0");
    expect(percentBucket(25)).toBe("1-39");
    expect(percentBucket(55)).toBe("40-69");
    expect(percentBucket(85)).toBe("70-99");
    expect(percentBucket(100)).toBe("100");
  });
});
