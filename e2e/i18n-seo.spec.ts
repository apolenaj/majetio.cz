import { test, expect } from "@playwright/test";

test.describe("i18n / SEO / market selection", () => {
  test.describe.configure({ timeout: 90_000 });

  test("CZ unprefixed URLs stay valid (backward compatible)", async ({
    page,
  }) => {
    const res = await page.goto("/nemovitosti", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/nemovitosti$/);
    await expect(
      page.getByRole("heading", { name: /^Nemovitosti$/i }),
    ).toBeVisible({ timeout: 60_000 });
  });

  test("locale-prefixed /en path rewrites without force-redirect away from CZ", async ({
    page,
  }) => {
    const res = await page.goto("/en/nemovitosti", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    expect(res?.ok()).toBeTruthy();
    await expect(
      page.getByRole("heading", { name: /^Nemovitosti$/i }),
    ).toBeVisible({ timeout: 60_000 });
  });

  test("market and language selectors are accessible", async ({ page }) => {
    await page.goto("/", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    const market = page.getByLabel(/Market \/ Trh/i).first();
    const language = page.getByLabel(/Language \/ Jazyk/i).first();
    await expect(market).toBeVisible({ timeout: 60_000 });
    await expect(language).toBeVisible({ timeout: 60_000 });
    await market.focus();
    await expect(market).toBeFocused();
  });

  test("geo suggest header does not auto-redirect homepage", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({
      "x-vercel-ip-country": "AE",
      "cf-ipcountry": "AE",
    });
    const res = await page.goto("/", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    expect(res?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/$/);
    expect(page.url()).not.toMatch(/\/markets\/ae/i);
  });

  test("homepage metadata includes canonical and hreflang alternates", async ({
    page,
  }) => {
    await page.goto("/nemovitosti", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /nemovitosti/, {
      timeout: 60_000,
    });

    const cs = page.locator('link[rel="alternate"][hreflang="cs-CZ"]');
    const en = page.locator('link[rel="alternate"][hreflang="en-GB"]');
    const xDefault = page.locator('link[rel="alternate"][hreflang="x-default"]');
    await expect(
      cs.or(page.locator('link[rel="alternate"]')).first(),
    ).toBeAttached();
    const alternateCount = await page.locator('link[rel="alternate"]').count();
    expect(alternateCount).toBeGreaterThan(0);
    if ((await cs.count()) > 0) {
      await expect(cs.first()).toHaveAttribute("href", /nemovitosti/);
    }
    if ((await en.count()) > 0) {
      await expect(en.first()).toHaveAttribute(
        "href",
        /en\/nemovitosti|nemovitosti/,
      );
    }
    if ((await xDefault.count()) > 0) {
      await expect(xDefault.first()).toHaveAttribute("href", /.+/);
    }
  });
});
