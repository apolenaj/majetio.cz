import { test, expect } from "@playwright/test";

test.describe("property search discovery", () => {
  test("filters stay in URL after open detail and back", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/nemovitosti?lokalita=praha&cena-do=8000000&typ=byt", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByRole("heading", { name: /Nemovitosti/i })).toBeVisible();
    expect(page.url()).toContain("lokalita=praha");
    expect(page.url()).toContain("cena-do=8000000");

    const titleLink = page.locator("article a[href^='/nemovitosti/']").first();
    await expect(titleLink).toBeVisible({ timeout: 15_000 });
    await titleLink.click();

    await expect(page).toHaveURL(/\/nemovitosti\/[^?/]+/);
    await page.goBack({ waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/lokalita=praha/);
    expect(page.url()).toContain("cena-do=8000000");
    expect(page.url()).toContain("typ=byt");
  });

  test("mobile filter sheet has dialog semantics and closes on Escape", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/nemovitosti", { waitUntil: "domcontentloaded" });

    const openFilters = page.getByRole("button", {
      name: /Otevřít filtry|Filtry/i,
    });
    await expect(openFilters.first()).toBeVisible({ timeout: 15_000 });
    await openFilters.first().click();
    const dialog = page.getByRole("dialog").filter({ hasText: /Filtr/i });
    await expect(dialog.first()).toBeVisible({ timeout: 10_000 });

    const overflow = await page.evaluate(() => {
      const el = document.querySelector('[role="dialog"]');
      if (!el) return true;
      return el.scrollWidth > el.clientWidth + 2;
    });
    expect(overflow).toBe(false);

    await page.keyboard.press("Escape");
    await expect(dialog.first()).toBeHidden({ timeout: 10_000 });
  });

  test("SEO city landing is indexable path", async ({ page }) => {
    await page.goto("/nemovitosti/praha", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Praze|Praha/i })).toBeVisible();
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    // preparePageMeta sets index,follow when noIndex is false — may be absent or index
    if (robots) {
      expect(robots.toLowerCase()).not.toContain("noindex");
    }
  });

  test("filtered search sets noindex", async ({ page }) => {
    await page.goto("/nemovitosti?lokalita=praha&cena-do=5000000", {
      waitUntil: "domcontentloaded",
    });
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots?.toLowerCase() ?? "").toMatch(/noindex/);
  });

  test("sort and pagination sync into URL", async ({ page }) => {
    await page.goto("/nemovitosti?razeni=cena-sestupne&stranka=1", {
      waitUntil: "domcontentloaded",
    });
    expect(page.url()).toContain("razeni=cena-sestupne");

    await page.goto("/nemovitosti?stranka=2", {
      waitUntil: "domcontentloaded",
    });
    // Page 2 is either empty or results — URL must keep stranka; robots noindex for >1
    expect(page.url()).toMatch(/stranka=2/);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    if (robots) {
      expect(robots.toLowerCase()).toMatch(/noindex/);
    }
  });

  test("typo / soft match does not 500", async ({ request }) => {
    const res = await request.get("/nemovitosti?lokalita=prahaa");
    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeLessThan(400);
  });
});
