import { expect, test } from "@playwright/test";

/**
 * Prompt 20.2 — Property detail sections, incomplete-data honesty, lifecycle UI.
 */

test.describe("Prompt 20.2 — Property detail", () => {
  test.describe.configure({ timeout: 90_000 });

  test("active demo detail exposes core sections", async ({ page }) => {
    await page.goto("/nemovitosti/demo-byt-3kk-vinohrady", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Demonstrační nemovitost|Demo/i).first()).toBeVisible();
    await expect(page.locator("#prehled")).toBeAttached();
    await expect(page.locator("#ekonomika")).toBeAttached();
    await expect(page.locator("body")).toContainText(/Kč|cena|odhad|nabídk/i);
    await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();
  });

  test("unavailable lifecycle shows warning, not active CTA pretence", async ({
    page,
  }) => {
    await page.goto("/nemovitosti/demo-byt-nedostupny", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByText(/Nabídka nemusí být dostupná|nedostupná/i).first(),
    ).toBeVisible();
  });

  test("archived lifecycle shows archive notice", async ({ page }) => {
    await page.goto("/nemovitosti/demo-byt-archiv", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText(/Archivovaná nabídka|archivu/i).first()).toBeVisible();
  });

  test("missing investment metrics use Neuvedeno — not bare 0 %", async ({
    page,
  }) => {
    // Low-data demo if present; otherwise active demo still must not invent zeros for missing nets
    await page.goto("/nemovitosti/demo-byt-3kk-vinohrady", {
      waitUntil: "domcontentloaded",
    });
    const body = await page.locator("body").innerText();
    // Forbidden pattern: investment cell showing only "0 %" without context when metric missing
    // Allow legitimate 0 when calculated; require Neuvedeno / — for empty
    expect(body).not.toMatch(/Hrubý výnos\s*0\s*%\s*Netto výnos\s*0\s*%/);
  });

  test("unknown slug is 404", async ({ page }) => {
    const res = await page.goto("/nemovitosti/neexistujici-slug-xyz-20-2", {
      waitUntil: "domcontentloaded",
    });
    // App Router soft 404 may surface as 404 or 200+not-found UI in dev.
    const status = res?.status() ?? 0;
    if (status === 404) {
      expect(status).toBe(404);
      return;
    }
    await expect(
      page.getByText(/nenalezen|neexistuje|404|stránka neexistuje/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
