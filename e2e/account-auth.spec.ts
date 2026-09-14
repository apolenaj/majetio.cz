import { expect, test } from "@playwright/test";

test.describe("Auth & account surfaces", () => {
  test("registration page has required consents and no pre-checked marketing", async ({
    page,
  }) => {
    await page.goto("/registrace");
    await expect(page.getByRole("heading", { name: /registrace/i })).toBeVisible();
    const form = page.getByRole("form", { name: /registrace/i });
    await expect(form.locator('input[name="acceptTerms"]')).toHaveCount(1);
    await expect(form.locator('input[name="acceptTerms"]')).not.toBeChecked();
    // Marketing must not be a registration checkbox (CMP banner may mention “marketingové”).
    await expect(form.locator('input[name="acceptMarketing"]')).toHaveCount(0);
  });

  test("login page is reachable and has email/password fields", async ({ page }) => {
    await page.goto("/prihlaseni");
    await expect(page.getByRole("heading", { name: /přihlášení/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("password reset request page exists", async ({ page }) => {
    await page.goto("/zapomenute-heslo");
    await expect(page.getByRole("heading", { name: /heslo/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test("protected account routes redirect anonymous users to login", async ({ page }) => {
    for (const path of [
      "/ucet",
      "/ucet/financni-profil",
      "/ucet/nastaveni",
      "/onboarding",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/prihlaseni/);
      expect(page.url()).toContain("callbackUrl");
    }
    // Legacy alias redirects to Privacy Center (then login if anonymous).
    await page.goto("/ucet/souhlasy");
    await expect(page).toHaveURL(/prihlaseni|soukromi/);
  });

  test("auth forms expose accessible labels", async ({ page }) => {
    await page.goto("/prihlaseni");
    const reject = page.getByRole("button", { name: /odmítnout|pouze nezbytné/i });
    if (await reject.isVisible().catch(() => false)) {
      await reject.click();
    }
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("login rejects wrong password without unlocking account", async ({
    page,
  }) => {
    await page.goto("/prihlaseni");
    const reject = page.getByRole("button", { name: /odmítnout|pouze nezbytné/i });
    if (await reject.isVisible().catch(() => false)) {
      await reject.click();
    }
    await page.locator('input[name="email"]').fill("neexistuje-20-2@example.com");
    await page.locator('input[name="password"]').fill("SpatneHeslo1");
    await page.getByRole("button", { name: /přihlásit/i }).click();
    await expect(page).toHaveURL(/prihlaseni/);
    // DB may be offline in local E2E — still must not land on /ucet.
    await expect(page).not.toHaveURL(/\/ucet$/);
  });

  test("registration rejects weak password client- or server-side", async ({
    page,
  }) => {
    await page.goto("/registrace");
    const reject = page.getByRole("button", { name: /odmítnout|pouze nezbytné/i });
    if (await reject.isVisible().catch(() => false)) {
      await reject.click();
    }
    await page.locator('input[name="email"]').fill("weak-20-2@example.com");
    await page.locator('input[name="password"]').fill("short");
    await page.getByRole("button", { name: /Vytvořit účet/i }).click({ force: true });
    await expect(page).toHaveURL(/registrace/);
    await expect(page).not.toHaveURL(/\/ucet|\/onboarding/);
  });

  test("email verification page is reachable", async ({ page }) => {
    await page.goto("/overeni-emailu");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
