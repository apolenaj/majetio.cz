import { describe, expect, it } from "vitest";

import {
  emailChangeConfirmEmail,
  passwordResetEmail,
  welcomeEmail,
} from "@/lib/email/templates";

describe("transactional email templates", () => {
  it("renders responsive HTML without financial PII", () => {
    const reset = passwordResetEmail("https://majetio.cz/obnovit-heslo?token=abc");
    const change = emailChangeConfirmEmail("https://majetio.cz/overeni-emailu?token=abc&uid=x");
    const welcome = welcomeEmail("https://majetio.cz/onboarding");

    for (const tpl of [reset, change, welcome]) {
      expect(tpl.html).toContain("viewport");
      expect(tpl.html).toContain("Majetio");
      expect(tpl.text.length).toBeGreaterThan(40);
      expect(tpl.html).not.toContain("passwordHash");
      expect(tpl.html).not.toContain("monthlyIncomeCzk");
      expect(tpl.html).not.toContain("availableEquityCzk");
      expect(tpl.text).not.toContain("passwordHash");
    }
  });
});
