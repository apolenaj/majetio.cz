import { describe, expect, it } from "vitest";

import { exportToCsv } from "@/lib/account/export-csv";
import type { AccountExportPayload } from "@/lib/account/export";
import {
  CACHE_CONTROL_PRIVATE_NO_STORE,
  isPrivateNoStorePath,
} from "@/lib/security/http-privacy";
import { assertSafeOutboundUrl } from "@/lib/security/ssrf";
import {
  assertTransactionalBodySafe,
  canSendTransactionalEmail,
  requiresMarketingConsent,
} from "@/lib/email/transactional-policy";
import {
  mortgageLeadStatusUpdatedEmail,
  passwordResetEmail,
} from "@/lib/email/templates";
import {
  toClientSafePassportSummary,
  assertNoPassportSecretsInPayload,
} from "@/lib/financial-passport/client-safe";
import { emptyPassportState } from "@/lib/financial-passport/types";
import { dispatchToWebhook } from "@/domains/locations/integration/market-alerts/events";

describe("privacy-by-default HTTP zones", () => {
  it("marks account/admin/leads APIs as no-store", () => {
    expect(isPrivateNoStorePath("/ucet/soukromi")).toBe(true);
    expect(isPrivateNoStorePath("/api/account/privacy-export")).toBe(true);
    expect(isPrivateNoStorePath("/api/admin/notes")).toBe(true);
    expect(isPrivateNoStorePath("/api/payments/webhook")).toBe(true);
    expect(isPrivateNoStorePath("/nemovitosti")).toBe(false);
    expect(CACHE_CONTROL_PRIVATE_NO_STORE).toContain("private");
    expect(CACHE_CONTROL_PRIVATE_NO_STORE).toContain("no-store");
  });
});

describe("account CSV formula injection", () => {
  it("escapes formula-leading cells", () => {
    const payload = {
      exportedAt: "2026-01-01",
      user: {
        id: "u1",
        email: "a@b.c",
        name: "=1+1",
        createdAt: "2026-01-01",
      },
      profile: null,
      financialProfile: null,
      propertyPreference: null,
      investmentPreference: null,
      notificationPrefs: null,
      consents: [],
      favourites: [],
      analyses: [],
      comparisons: [],
      leads: [{ note: "+cmd|/C calc" }],
    } as unknown as AccountExportPayload;

    const csv = exportToCsv(payload);
    expect(csv).toContain("'=1+1");
    expect(csv).toContain("'+cmd");
  });
});

describe("SSRF on market alert webhooks", () => {
  it("blocks localhost webhook URLs", async () => {
    expect(assertSafeOutboundUrl("http://127.0.0.1/hook").ok).toBe(false);
    const result = await dispatchToWebhook(
      {
        eventId: "e1",
        type: "location.supply.spike",
        occurredAt: new Date().toISOString(),
        locationId: "l1",
        locationSlug: "praha",
        metricKey: "x",
        segmentKey: "all",
        previousValue: 1,
        currentValue: 2,
        changePct: 100,
        period: "30d",
        sampleCount: 2,
        confidence: 0.5,
        methodologyVersion: "t",
        source: "test",
      },
      {
        id: "s1",
        userId: "u1",
        active: true,
        eventTypes: ["location.supply.spike"],
        webhookUrl: "https://127.0.0.1/hook",
      },
    );
    expect(result.delivered).toBe(false);
    expect(result.error).toMatch(/SSRF_BLOCKED/);
  });
});

describe("transactional email policy", () => {
  it("does not require marketing consent", () => {
    expect(requiresMarketingConsent("transactional")).toBe(false);
    expect(canSendTransactionalEmail({ marketingConsent: false })).toBe(true);
  });

  it("templates stay free of financial amounts", () => {
    const tpl = mortgageLeadStatusUpdatedEmail({
      statusLabel: "Schváleno",
      detailUrl: "https://majetio.cz/ucet/financovani/x",
    });
    expect(assertTransactionalBodySafe(tpl.text).ok).toBe(true);
    expect(assertTransactionalBodySafe(tpl.html).ok).toBe(true);
    expect(passwordResetEmail("https://majetio.cz/x").html).toContain(
      "transakční",
    );
  });
});

describe("client-safe passport summary", () => {
  it("omits exact CZK fields", () => {
    const state = {
      ...emptyPassportState(),
      monthlyIncomeCzk: 85_000,
      availableEquityCzk: 500_000,
    };
    const summary = toClientSafePassportSummary(state, 40);
    expect(summary.hasIncome).toBe(true);
    expect(summary).not.toHaveProperty("monthlyIncomeCzk");
    expect(() => assertNoPassportSecretsInPayload(summary)).not.toThrow();
  });
});
