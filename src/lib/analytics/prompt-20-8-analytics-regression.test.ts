/**
 * Prompt 20.8 — Analytics taxonomy / funnel / consent / revenue source regression.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  assertAnalyticsSafe,
  track,
  type AnalyticsEvent,
} from "@/lib/analytics/events";
import {
  CLIENT_PAGE_VIEW_EVENTS,
  LEDGER_EVENT_NAMES,
  isAnalyticsAllowedForEvent,
} from "@/lib/analytics/consent-gate";
import { buildAnalyticsContext } from "@/lib/analytics/context";
import { COOKIE_POLICY_VERSION } from "@/domains/privacy/cookie-consent";

const root = (...parts: string[]) => join(process.cwd(), ...parts);

describe("Prompt 20.8 — naming noun_action", () => {
  it("taxonomy doc exists and defines North Star + activation", () => {
    const doc = readFileSync(root("docs/ANALYTICS_EVENT_TAXONOMY.md"), "utf8");
    expect(doc).toMatch(/noun_action/);
    expect(doc).toMatch(/Decision-Ready Property Analyses/);
    expect(doc).toMatch(/Activation metric/);
    expect(doc).toMatch(/RevenueEvent/);
    expect(doc).toMatch(/checkout_completed/);
  });

  it("event names in union follow snake_case noun_action pattern", () => {
    const src = readFileSync(root("src/lib/analytics/events.ts"), "utf8");
    const names = [...src.matchAll(/name:\s*"([a-z0-9_]+)"/g)].map((m) => m[1]);
    expect(names.length).toBeGreaterThan(40);
    for (const name of names) {
      expect(name).toMatch(/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/);
      expect(name).not.toMatch(/^[A-Z]/);
    }
  });
});

describe("Prompt 20.8 — envelope + PII", () => {
  it("context has ts/source and never user email fields", () => {
    const ctx = buildAnalyticsContext("server");
    expect(ctx.ts).toMatch(/^\d{4}-/);
    expect(ctx.source).toBe("server");
    expect(ctx).not.toHaveProperty("user_id");
    expect(ctx).not.toHaveProperty("email");
  });

  it("rejects PII prop keys on assert", () => {
    expect(() =>
      assertAnalyticsSafe({
        name: "login_failed",
        // @ts-expect-error intentional
        props: { reason: "credentials", email: "x@y.cz" },
      }),
    ).toThrow(/e-mail/i);
  });
});

describe("Prompt 20.8 — consent default deny on client", () => {
  it("gates discovery without consent; allows with analytics", () => {
    expect(
      isAnalyticsAllowedForEvent("filter_applied", null, { isServer: false }),
    ).toBe(false);
    expect(
      isAnalyticsAllowedForEvent(
        "filter_applied",
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

  it("ledger events always allowed", () => {
    expect(LEDGER_EVENT_NAMES.has("checkout_completed")).toBe(true);
    expect(
      isAnalyticsAllowedForEvent("checkout_completed", null, {
        isServer: true,
      }),
    ).toBe(true);
  });

  it("page views are client-only", () => {
    expect(CLIENT_PAGE_VIEW_EVENTS.has("pricing_viewed")).toBe(true);
    expect(
      isAnalyticsAllowedForEvent("pricing_viewed", null, { isServer: true }),
    ).toBe(false);
  });
});

describe("Prompt 20.8 — funnel wiring", () => {
  it("B2C pricing + checkout + detail funnel are wired", () => {
    expect(
      readFileSync(root("src/app/(public)/cenik/page.tsx"), "utf8"),
    ).toMatch(/PricingPageAnalytics/);
    expect(
      readFileSync(
        root("src/domains/orders/service/create-order.ts"),
        "utf8",
      ),
    ).toMatch(/checkout_started/);
    expect(
      readFileSync(
        root("src/domains/revenue/commerce-recognition.ts"),
        "utf8",
      ),
    ).toMatch(/checkout_completed/);
    expect(
      readFileSync(
        root("src/components/property/property-detail-analytics.tsx"),
        "utf8",
      ),
    ).toMatch(/observeFunnelStep\("viewed"\)/);
  });

  it("B2B org / publish / lead events are wired", () => {
    expect(
      readFileSync(root("src/domains/organizations/service.ts"), "utf8"),
    ).toMatch(/organization_created/);
    expect(
      readFileSync(
        root("src/domains/properties/admin/moderation-service.ts"),
        "utf8",
      ),
    ).toMatch(/listing_published/);
    expect(
      readFileSync(root("src/domains/crm/inquiry-service.ts"), "utf8"),
    ).toMatch(/lead_inquiry_created/);
  });

  it("track accepts funnel events without amounts", () => {
    const events: AnalyticsEvent[] = [
      { name: "checkout_started", props: { product_key: "basic", has_promo: false } },
      {
        name: "checkout_completed",
        props: { product_key: "basic", billing_kind: "one_time" },
      },
      {
        name: "organization_created",
        props: { org_type: "BROKERAGE", market_code: "CZ" },
      },
    ];
    for (const event of events) {
      expect(() => assertAnalyticsSafe(event)).not.toThrow();
      expect(JSON.stringify(event)).not.toMatch(/amount|@|Kč/i);
      track(event);
    }
  });
});
