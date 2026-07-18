import { expect, test } from "@playwright/test";

test.describe("Auth & account surfaces", () => {
  test("registration page has required consents and no pre-checked marketing", async ({
    page,
  }) => {
    await page.goto("/registrace");
    await expect(page.getByRole("heading", { name: /registrace/i })).toBeVisible();
    const marketing = page.getByLabel(/marketing/i);
    await expect(marketing).toHaveCount(0);
    const terms = page.locator('input[name="acceptTerms"]');
    await expect(terms).toHaveCount(1);
    await expect(terms).not.toBeChecked();
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
      "/ucet/souhlasy",
      "/ucet/nastaveni",
      "/onboarding",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/prihlaseni/);
      expect(page.url()).toContain("callbackUrl");
    }
  });

  test("auth forms expose accessible labels", async ({ page }) => {
    await page.goto("/prihlaseni");
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/^heslo$/i)).toBeVisible();
  });
});
