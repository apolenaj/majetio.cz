import { describe, expect, it } from "vitest";

import {
  emailChangeConfirmEmail,
  mortgageLeadStatusUpdatedEmail,
  passwordResetEmail,
  welcomeEmail,
} from "@/lib/email/templates";
import {
  assertTransactionalBodySafe,
  canSendTransactionalEmail,
  requiresMarketingConsent,
} from "@/lib/email/transactional-policy";

describe("transactional email templates", () => {
  it("renders responsive HTML without financial PII", () => {
    const reset = passwordResetEmail(
      "https://majetio.cz/obnovit-heslo?token=abc",
    );
    const change = emailChangeConfirmEmail(
      "https://majetio.cz/overeni-emailu?token=abc&uid=x",
    );
    const welcome = welcomeEmail("https://majetio.cz/onboarding");
    const financing = mortgageLeadStatusUpdatedEmail({
      statusLabel: "Kontaktován specialista",
      previousStatusLabel: "Přijato partnerem",
      detailUrl: "https://majetio.cz/ucet/financovani/ml_test123",
    });

    for (const tpl of [reset, change, welcome, financing]) {
      expect(tpl.html).toContain("viewport");
      expect(tpl.html).toContain("Majetio");
      expect(tpl.text.length).toBeGreaterThan(40);
      expect(tpl.html).not.toContain("passwordHash");
      expect(tpl.html).not.toContain("monthlyIncomeCzk");
      expect(tpl.html).not.toContain("availableEquityCzk");
      expect(tpl.text).not.toContain("passwordHash");
      expect(assertTransactionalBodySafe(tpl.html).ok).toBe(true);
      expect(assertTransactionalBodySafe(tpl.text).ok).toBe(true);
    }
  });

  it("does not gate transactional mail on marketing consent", () => {
    expect(requiresMarketingConsent("transactional")).toBe(false);
    expect(requiresMarketingConsent("marketing")).toBe(true);
    expect(canSendTransactionalEmail({ marketingConsent: false })).toBe(true);
  });
});
