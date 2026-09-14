import { describe, expect, it } from "vitest";

import { assertPartnerShareConsent } from "@/domains/privacy/consent-record";
import {
  needsCookieBanner,
  parseCookieConsent,
  COOKIE_POLICY_VERSION,
} from "@/domains/privacy/cookie-consent";
import { isAnalyticsAllowedForEvent } from "@/lib/analytics/consent-gate";

describe("assertPartnerShareConsent", () => {
  it("rejects generic partner wording", () => {
    const result = assertPartnerShareConsent({
      purpose: "PARTNER_DATA_SHARE",
      recipient: "naši partneři",
      sharedScope: ["email"],
    });
    expect(result.ok).toBe(false);
  });

  it("requires sharedScope", () => {
    const result = assertPartnerShareConsent({
      purpose: "PARTNER_DATA_SHARE",
      recipient: "HypotekaJasne.cz",
      sharedScope: [],
    });
    expect(result.ok).toBe(false);
  });

  it("accepts explicit recipient + scope", () => {
    const result = assertPartnerShareConsent({
      purpose: "PARTNER_DATA_SHARE",
      recipient: "HypotekaJasne.cz",
      sharedScope: ["monthlyIncomeCzk", "phone"],
    });
    expect(result.ok).toBe(true);
  });
});

describe("cookie consent parse", () => {
  it("ignores stale policy version", () => {
    expect(
      parseCookieConsent(
        JSON.stringify({
          v: "old",
          necessary: true,
          preferences: true,
          analytics: true,
          marketing: false,
        }),
      ),
    ).toBeNull();
  });

  it("parses current version", () => {
    const state = parseCookieConsent(
      JSON.stringify({
        v: COOKIE_POLICY_VERSION,
        necessary: true,
        preferences: true,
        analytics: false,
        marketing: false,
        updatedAt: "2026-07-22T00:00:00.000Z",
      }),
    );
    expect(state?.analytics).toBe(false);
    expect(needsCookieBanner(state)).toBe(false);
    expect(needsCookieBanner(null)).toBe(true);
  });
});

describe("analytics consent gate", () => {
  it("blocks client analytics without consent", () => {
    expect(
      isAnalyticsAllowedForEvent("homepage_viewed", null, { isServer: false }),
    ).toBe(false);
  });

  it("blocks client discovery events without analytics consent", () => {
    expect(
      isAnalyticsAllowedForEvent("property_detail_viewed", null, {
        isServer: false,
      }),
    ).toBe(false);
    expect(
      isAnalyticsAllowedForEvent("search_query_submitted", null, {
        isServer: false,
      }),
    ).toBe(false);
  });

  it("allows client analytics with consent", () => {
    expect(
      isAnalyticsAllowedForEvent(
        "homepage_viewed",
        {
          v: COOKIE_POLICY_VERSION,
          necessary: true,
          preferences: false,
          analytics: true,
          marketing: false,
          updatedAt: "2026-07-22T00:00:00.000Z",
        },
        { isServer: false },
      ),
    ).toBe(true);
  });

  it("blocks server product page-view events", () => {
    expect(
      isAnalyticsAllowedForEvent("homepage_viewed", null, { isServer: true }),
    ).toBe(false);
  });

  it("allows server auth ledger events", () => {
    expect(
      isAnalyticsAllowedForEvent("consent_given", null, { isServer: true }),
    ).toBe(true);
  });

  it("allows server checkout_started as first-party product action", () => {
    expect(
      isAnalyticsAllowedForEvent("checkout_started", null, { isServer: true }),
    ).toBe(true);
  });
});
