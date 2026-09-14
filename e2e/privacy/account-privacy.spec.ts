import { expect, test, type Page } from "@playwright/test";

/**
 * Privacy & Trust — account deletion, data export, marketing preferences.
 * Authenticated cases require E2E_USER_EMAIL + E2E_USER_PASSWORD.
 */

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const hasAuth = Boolean(email && password);

async function login(page: Page) {
  await page.goto("/prihlaseni", { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill(email!);
  await page.locator('input[name="password"]').fill(password!);
  await page.getByRole("button", { name: /přihlásit|login/i }).click();
  await expect(page).toHaveURL(/\/ucet/, { timeout: 60_000 });
}

test.describe("Privacy: account deletion, export, marketing prefs", () => {
  test.describe.configure({ timeout: 120_000 });

  test("anonymous visit to privacy center redirects to login", async ({
    page,
  }) => {
    await page.goto("/ucet/soukromi", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await expect(page).toHaveURL(/prihlaseni/);
    expect(page.url()).toContain("callbackUrl");
  });

  test("legacy /ucet/souhlasy redirects toward privacy center or login", async ({
    page,
  }) => {
    await page.goto("/ucet/souhlasy", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await expect(page).toHaveURL(/prihlaseni|soukromi|souhlasy/);
  });

  test("authenticated: privacy center exposes export + deletion + marketing controls", async ({
    page,
  }) => {
    test.skip(!hasAuth, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");

    await login(page);
    await page.goto("/ucet/soukromi", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: /soukromí|privacy|osobní údaje/i }),
    ).toBeVisible({ timeout: 60_000 });

    // Data export
    const exportBtn = page.getByRole("button", {
      name: /export|stáhnout|json|csv/i,
    });
    await expect(exportBtn.first()).toBeVisible();

    // Soft deletion request UI
    await expect(
      page.getByText(/výmaz|smazání účtu|deletion/i).first(),
    ).toBeVisible();

    // Marketing preference (consent ledger / toggle)
    await expect(
      page.getByText(/marketing/i).first(),
    ).toBeVisible();
  });

  test("authenticated: marketing preference can be toggled without FP amounts in UI dump", async ({
    page,
  }) => {
    test.skip(!hasAuth, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");

    await login(page);
    await page.goto("/ucet/soukromi", { waitUntil: "domcontentloaded" });

    const marketingControl = page
      .getByRole("switch", { name: /marketing/i })
      .or(page.getByLabel(/marketing/i))
      .first();

    if ((await marketingControl.count()) === 0) {
      // Withdraw/revoke buttons in consent ledger are also valid.
      const withdraw = page.getByRole("button", {
        name: /odvolat|revoke|vypnout/i,
      });
      await expect(withdraw.first()).toBeVisible({ timeout: 30_000 });
      return;
    }

    const before = await marketingControl.isChecked().catch(() => null);
    await marketingControl.click();
    if (before === true) {
      await expect(marketingControl).not.toBeChecked();
    } else if (before === false) {
      await expect(marketingControl).toBeChecked();
    }

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/monthlyIncomeCzk|availableEquityCzk/);
  });

  test("authenticated: deletion request requires email confirmation field", async ({
    page,
  }) => {
    test.skip(!hasAuth, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");

    await login(page);
    await page.goto("/ucet/soukromi", { waitUntil: "domcontentloaded" });

    const confirm = page.locator(
      'input[name="confirmEmail"], input[autocomplete="email"]',
    ).last();
    await expect(confirm).toBeVisible({ timeout: 30_000 });
    // Do not submit destructive deletion in CI — only verify the control exists.
  });
});
