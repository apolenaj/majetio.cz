import { describe, expect, it } from "vitest";

import {
  DEFAULT_STALE_AFTER_DAYS,
  DEFAULT_UNAVAILABLE_AFTER_DAYS,
  evaluatePropertyFreshness,
  PROPERTY_MEDIA_PLACEHOLDER,
} from "@/lib/properties/freshness";

describe("evaluatePropertyFreshness", () => {
  const now = new Date("2026-07-19T12:00:00.000Z");

  it("marks fresh when seen recently", () => {
    const lastSeenAt = new Date("2026-07-18T12:00:00.000Z");
    const result = evaluatePropertyFreshness({ lastSeenAt, now });
    expect(result.freshness).toBe("FRESH");
    expect(result.suggestedStatus).toBe("ACTIVE");
    expect(result.daysSinceSeen).toBe(1);
  });

  it("marks stale after threshold without implying sold", () => {
    const lastSeenAt = new Date(now);
    lastSeenAt.setUTCDate(lastSeenAt.getUTCDate() - DEFAULT_STALE_AFTER_DAYS);
    const result = evaluatePropertyFreshness({ lastSeenAt, now });
    expect(result.freshness).toBe("STALE");
    expect(result.suggestedStatus).toBeNull();
  });

  it("marks unavailable after longer silence (not sold)", () => {
    const lastSeenAt = new Date(now);
    lastSeenAt.setUTCDate(lastSeenAt.getUTCDate() - DEFAULT_UNAVAILABLE_AFTER_DAYS);
    const result = evaluatePropertyFreshness({ lastSeenAt, now });
    expect(result.freshness).toBe("UNAVAILABLE");
    expect(result.suggestedStatus).toBe("UNAVAILABLE");
  });
});

describe("PROPERTY_MEDIA_PLACEHOLDER", () => {
  it("is flagged as placeholder with owned license", () => {
    expect(PROPERTY_MEDIA_PLACEHOLDER.isPlaceholder).toBe(true);
    expect(PROPERTY_MEDIA_PLACEHOLDER.url.startsWith("/")).toBe(true);
  });
});
