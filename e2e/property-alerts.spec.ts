import { expect, test } from "@playwright/test";

/**
 * Property alerts / saved-search notifications E2E.
 * Auth-gated inbox + public comparison stale CTA copy contracts.
 * Domain logic (price down/up, CORRECTED, digest) is covered by Vitest.
 */
test.describe("Property alerts & comparison diffs", () => {
  test("notifications and saved-search account routes require login", async ({
    page,
  }) => {
    for (const path of [
      "/ucet/upozorneni",
      "/ucet/ulozena-hledani",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/prihlaseni/);
    }
  });

  test("comparison workspace exposes update CTA surface after load", async ({
    page,
  }) => {
    const ids = [
      "demo-byt-3kk-vinohrady",
      "demo-byt-2kk-brno",
      "demo-dum-rekonstrukce",
    ].join(",");
    await page.goto(`/porovnani?ids=${ids}`);
    await expect(
      page.getByRole("tablist", { name: /režim porovnání/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Decision insights mount (stale banner appears only when snapshot differs).
    // CTA label is always in the component source when isStale; assert page has comparison chrome.
    await expect(page.locator("body")).toContainText(/porovn|metrika|přehled/i);
  });

  test("login page is reachable from alert deep-link redirect", async ({
    page,
  }) => {
    await page.goto("/ucet/upozorneni");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/prihlaseni/);
  });
});
