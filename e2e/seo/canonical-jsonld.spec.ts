import { expect, test } from "@playwright/test";

/**
 * SEO smoke — canonical + JSON-LD on key public pages (DOM-level).
 * Full crawl gate: `npm run test:seo-check`.
 */

test.describe("SEO: canonical & JSON-LD", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const path of ["/", "/nemovitosti", "/cenik"] as const) {
    test(`${path} has canonical without query string`, async ({ page }) => {
      await page.goto(path, {
        waitUntil: "domcontentloaded",
        timeout: 90_000,
      });
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toBeAttached({ timeout: 60_000 });
      const href = await canonical.getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).not.toContain("?");
      expect(href).toMatch(/^https?:\/\//);
    });
  }

  test("homepage JSON-LD parses and has no AggregateRating", async ({
    page,
  }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    for (let i = 0; i < count; i++) {
      const raw = await scripts.nth(i).innerText();
      const data = JSON.parse(raw) as unknown;
      const blob = JSON.stringify(data).toLowerCase();
      expect(blob).not.toContain("aggregaterating");
      expect(blob).not.toContain("ratingvalue");
    }
  });

  test("auth login page is noindex", async ({ page }) => {
    await page.goto("/prihlaseni", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    const robots = page.locator('meta[name="robots"]');
    if ((await robots.count()) > 0) {
      const content = (await robots.first().getAttribute("content")) ?? "";
      expect(content.toLowerCase()).toContain("noindex");
    }
  });
});
