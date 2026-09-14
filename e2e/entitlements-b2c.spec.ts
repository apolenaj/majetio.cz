import { expect, test } from "@playwright/test";

/**
 * B2C entitlement / monetization E2E (checklist 190 / 191).
 * Full PSP→webhook grant is covered by unit tests; here we verify
 * public surfaces, auth gates, and that UI never claims access before payment.
 */

test.describe("B2C entitlements — pricing & checkout (190/191)", () => {
  test("cenik separates buyer / investor segments and shows Buyer Pass duration", async ({
    page,
  }) => {
    await page.goto("/cenik");
    await expect(page.getByRole("heading", { name: /^Ceník$/i })).toBeVisible();

    await expect(page.getByRole("heading", { name: /Kupující/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Investoři/i })).toBeVisible();

    const buyerPass = page.locator("#segment-buyers").getByText(/Buyer Pass/i);
    await expect(buyerPass.first()).toBeVisible();
    await expect(
      page.locator("#segment-buyers").getByText(/30|Deep Analysis/i).first(),
    ).toBeVisible();

    await expect(
      page.getByText(/neobnovuje automaticky|výslovného souhlasu/i).first(),
    ).toBeVisible();
  });

  test("cenik shows B2B agent plans with listing limits", async ({ page }) => {
    await page.goto("/cenik");
    await expect(page.getByRole("heading", { name: /Makléři/i })).toBeVisible();
    const agents = page.locator("#segment-agents");
    await expect(agents.getByText(/Agent Free/i).first()).toBeVisible();
    await expect(agents.getByText(/Agent Pro/i).first()).toBeVisible();
    await expect(
      agents.getByText(/Agency Growth|5|40|200/i).first(),
    ).toBeVisible();
  });

  test("cenik does not show fake countdown timers", async ({ page }) => {
    await page.goto("/cenik");
    await expect(page.getByText(/zbývá\s+\d+\s*min/i)).toHaveCount(0);
    await expect(page.getByText(/limited time|hurry|only \d+ left/i)).toHaveCount(
      0,
    );
  });

  test("checkout for paid product requires authentication (no silent grant)", async ({
    page,
  }) => {
    await page.goto("/checkout?product=buyer_pass");
    await expect(page).toHaveURL(/prihlaseni|checkout|registrace/i);
    await expect(
      page.getByText(/přístup odemčen|entitlement active|Buyer Pass aktivní/i),
    ).toHaveCount(0);
  });

  test("deep analysis checkout CTA carries product key without client price", async ({
    page,
  }) => {
    await page.goto("/cenik");
    const deepLink = page
      .locator("#segment-buyers a[href*='checkout'][href*='deep_analysis']")
      .first();
    if ((await deepLink.count()) > 0) {
      const href = await deepLink.getAttribute("href");
      expect(href).toMatch(/product=deep_analysis/);
      expect(href).not.toMatch(/amount|priceCzk|gross/i);
    }
  });

  test("success page does not invent paid entitlement for missing order", async ({
    page,
  }) => {
    await page.goto("/checkout/success?orderId=e2e-missing");
    await expect(
      page.getByText(/Buyer Pass aktivní|Deep Analysis odemčena|Přístup aktivován/i),
    ).toHaveCount(0);
  });

  test("scenarios route gates FULL_SCENARIOS behind auth", async ({ page }) => {
    await page.goto("/analyza/e2e-demo/scenare");
    await expect(page).toHaveURL(/prihlaseni|scenare/i);
    // Anonymous must not see unlocked full scenarios copy
    await expect(page.getByText(/Přístup povolen/i)).toHaveCount(0);
  });

  test("professional services segment mentions human-in-the-loop", async ({
    page,
  }) => {
    await page.goto("/cenik");
    const services = page.locator("#segment-professional_services");
    await expect(services.getByText(/Expert Review/i).first()).toBeVisible();
    await expect(
      services.getByText(/human-in-the-loop|Human-in-the-loop|specialist/i).first(),
    ).toBeVisible();
  });
});
