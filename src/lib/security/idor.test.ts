import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * IDOR / authorization source review:
 * Account mutations must bind to session userId from auth(), never from client-supplied ids.
 */
describe("IDOR hardening (source contracts)", () => {
  const roots = [
    "src/lib/financial-passport/actions.ts",
    "src/lib/onboarding/actions.ts",
    "src/lib/privacy/consents.ts",
    "src/lib/financing/handoff-actions.ts",
    "src/lib/account/settings-actions.ts",
    "src/lib/account/export.ts",
    "src/lib/account/notifications-actions.ts",
  ];

  it("server actions resolve user from session, not request body userId", () => {
    for (const relative of roots) {
      const source = readFileSync(join(process.cwd(), relative), "utf8");
      expect(source).toMatch(/auth\(\)/);
      // Must not accept arbitrary foreign user ids from clients
      expect(source).not.toMatch(/z\.object\(\{[^}]*userId:\s*z\.string/);
      expect(source).not.toMatch(/params\.userId|searchParams\.userId|body\.userId/);
    }
  });

  it("export and passport loaders never take foreign userId argument", () => {
    const exportSrc = readFileSync(
      join(process.cwd(), "src/lib/account/export.ts"),
      "utf8",
    );
    expect(exportSrc).toMatch(/buildAccountExport/);
    expect(exportSrc).not.toMatch(/function buildAccountExport\([^)]*userId/);

    const passportSrc = readFileSync(
      join(process.cwd(), "src/lib/financial-passport/actions.ts"),
      "utf8",
    );
    expect(passportSrc).toMatch(/session\.user\.id/);
    expect(passportSrc).not.toMatch(/saveFinancialPassport\([^)]*userId/);
  });
});
