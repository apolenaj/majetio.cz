import { expect, test } from "@playwright/test";

/** Must match `COOKIE_CONSENT_COOKIE` in domains/privacy/cookie-consent. */
const COOKIE_CONSENT_COOKIE = "majetio_cookie_consent";

/**
 * Cookie consent E2E — reject non-essential cookies and verify persistence.
 */

test.describe("Privacy: Cookie consent", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("banner offers reject / customize / accept with equal weight", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 90_000 });

    const dialog = page.getByRole("dialog", { name: /nastavení cookies/i });
    await expect(dialog).toBeVisible({ timeout: 60_000 });

    await expect(
      dialog.getByRole("button", { name: /odmítnout nepovinné/i }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: /nastavit/i }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: /přijmout vše/i }),
    ).toBeVisible();
  });

  test("reject non-essential persists and keeps analytics/marketing off", async ({
    page,
    context,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 90_000 });

    const dialog = page.getByRole("dialog", { name: /nastavení cookies/i });
    await expect(dialog).toBeVisible({ timeout: 60_000 });
    await dialog.getByRole("button", { name: /odmítnout nepovinné/i }).click();
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    const cookies = await context.cookies();
    const consent = cookies.find((c) => c.name === COOKIE_CONSENT_COOKIE);
    expect(consent, "consent cookie should be set").toBeTruthy();

    const parsed = JSON.parse(decodeURIComponent(consent!.value)) as {
      analytics?: boolean;
      marketing?: boolean;
      preferences?: boolean;
      necessary?: boolean;
    };
    expect(parsed.necessary).toBe(true);
    expect(parsed.analytics).toBe(false);
    expect(parsed.marketing).toBe(false);

    // Persistence across navigation
    await page.goto("/cenik", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await expect(
      page.getByRole("dialog", { name: /nastavení cookies/i }),
    ).toHaveCount(0);

    const cookiesAgain = await context.cookies();
    const consentAgain = cookiesAgain.find(
      (c) => c.name === COOKIE_CONSENT_COOKIE,
    );
    expect(consentAgain?.value).toBe(consent!.value);
  });
});
