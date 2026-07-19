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

    await page.getByRole("button", { name: /Otevřít filtry|Filtry/i }).click();
    const dialog = page.getByRole("dialog", { name: /Filtry/i });
    await expect(dialog).toBeVisible();

    // No horizontal overflow on sheet
    const overflow = await page.evaluate(() => {
      const el = document.querySelector('[role="dialog"]');
      if (!el) return true;
      return el.scrollWidth > el.clientWidth + 2;
    });
    expect(overflow).toBe(false);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
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
});
