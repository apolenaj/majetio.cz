import { expect, test } from "@playwright/test";

/**
 * Broker flow E2E (checklist 192).
 * Auth-gated Profi routes, onboarding, verification semantics, QBL inbox copy.
 */

test.describe("Broker flow (192)", () => {
  test("anonymous /profi redirects to login", async ({ page }) => {
    await page.goto("/profi");
    await expect(page).toHaveURL(/prihlaseni/);
    expect(page.url()).toMatch(/callbackUrl/);
  });

  test("anonymous /profi/onboarding redirects to login", async ({ page }) => {
    await page.goto("/profi/onboarding");
    await expect(page).toHaveURL(/prihlaseni/);
  });

  test("partneri marketing page is public and distinct from broker dashboard", async ({
    page,
  }) => {
    await page.goto("/partneri");
    await expect(page).not.toHaveURL(/prihlaseni/);
  });

  test("broker nav routes are defined under /profi", async ({ page }) => {
    for (const path of [
      "/profi",
      "/profi/onboarding",
      "/profi/profil",
      "/profi/analytics",
      "/profi/leady",
      "/profi/pipeline",
    ]) {
      const res = await page.goto(path);
      expect(res?.status()).not.toBe(404);
      await expect(page).toHaveURL(/prihlaseni|profi/);
    }
  });

  test("cenik shows makléři segment for broker products", async ({ page }) => {
    await page.goto("/cenik");
    await expect(page.getByRole("heading", { name: /Makléři/i })).toBeVisible();
    await expect(page.getByText(/Agent Free|Agent Pro/i).first()).toBeVisible();
  });

  test("login-gated leady page never exposes public ranking", async ({
    page,
  }) => {
    await page.goto("/profi/leady");
    // Either login redirect or inbox without ranking UI
    const url = page.url();
    if (/prihlaseni/.test(url)) {
      await expect(page).toHaveURL(/prihlaseni/);
    } else {
      await expect(page.getByText(/leaderboard|broker score|žebříček/i)).toHaveCount(
        0,
      );
      await expect(
        page.getByText(/publicRankingEnabled=false|Neveřejný ranking/i).first(),
      ).toBeVisible();
    }
  });
});
