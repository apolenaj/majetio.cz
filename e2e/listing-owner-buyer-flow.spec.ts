/**
 * E2E: private owner listing + buyer inquiry against local DB.
 * Requires: embedded/local Postgres, `npm run dev`, seeded users.
 */
import { test, expect } from "@playwright/test";
import path from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";

const OWNER = {
  email: "test.user@majetio.local",
  password: "TestUser1!",
};
const BUYER = {
  email: "test.buyer@majetio.local",
  password: "TestBuyer1!",
};

const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/prihlaseni");
  await page.locator('input[name="email"], input[type="email"]').first().fill(email);
  await page.locator('input[name="password"], input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: /Přihlásit|Sign in|Login/i }).click();
  await page.waitForURL(/\/(ucet|onboarding|nemovitosti|$)/, { timeout: 20_000 });
}

test.describe("listing vertical A with DB", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);
  let listingUrl = "";
  let manageUrl = "";

  test("owner creates draft, uploads photo, publishes", async ({ page }) => {
    const tmp = path.join(process.cwd(), "test-results", "tmp-pixel.png");
    mkdirSync(path.dirname(tmp), { recursive: true });
    writeFileSync(tmp, PIXEL_PNG);

    await login(page, OWNER.email, OWNER.password);
    await page.goto("/pridat-nemovitost");
    await expect(page.getByRole("heading", { name: /Přidat nemovitost/i })).toBeVisible();

    await page.locator('input[name="title"]').fill("E2E Test byt Vinohrady");
    await page.locator('textarea[name="description"]').fill("Syntetická nabídka pro E2E ověření.");
    await page.locator('input[name="publicCity"]').fill("Praha");
    await page.locator('input[name="askingPrice"]').fill("6500000");
    await page.locator('input[name="usableArea"]').fill("68");
    await page.locator('input[name="layout"]').fill("2+kk");

    await page.getByRole("button", { name: /Uložit koncept/i }).click();
    await page.waitForURL(/\/ucet\/nabidky\/.+/, { timeout: 30_000 });
    manageUrl = page.url();

    await page.locator('input[type="file"][name="photo"]').setInputFiles(tmp);
    await page.getByRole("button", { name: /Nahrát fotografii/i }).click();
    await expect(page.getByText(/Fotografie uložena|hlavní/i).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: /^Publikovat$/i }).click();
    await expect(page.getByText(/publikovan/i).first()).toBeVisible({ timeout: 15_000 });

    const publicLink = page.getByRole("link", { name: /Veřejný detail|nemovitosti\//i }).first();
    if (await publicLink.count()) {
      listingUrl = (await publicLink.getAttribute("href")) || "";
    }
    if (!listingUrl) {
      // Fallback: open nabidky list
      await page.goto("/ucet/nabidky");
      const link = page.getByRole("link", { name: /Veřejný detail/i }).first();
      listingUrl = (await link.getAttribute("href")) || "";
    }
    expect(listingUrl).toMatch(/\/nemovitosti\//);
  });

  test("buyer finds listing, sends inquiry; owner sees inbox", async ({
    browser,
  }) => {
    test.skip(!listingUrl, "no listing url from prior step");

    const buyerCtx = await browser.newContext();
    const buyerPage = await buyerCtx.newPage();
    await login(buyerPage, BUYER.email, BUYER.password);
    await buyerPage.goto(listingUrl);
    await expect(buyerPage.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(buyerPage.locator("body")).not.toContainText("privateThreshold");

    await buyerPage
      .locator('textarea[name="message"]')
      .fill("E2E poptávka — mám zájem o prohlídku.");
    await buyerPage.getByRole("button", { name: /Odeslat poptávku/i }).click();
    await expect(buyerPage.getByText(/Poptávka odeslána/i)).toBeVisible({
      timeout: 15_000,
    });
    await buyerCtx.close();

    const ownerCtx = await browser.newContext();
    const ownerPage = await ownerCtx.newPage();
    await login(ownerPage, OWNER.email, OWNER.password);
    await ownerPage.goto("/ucet/poptavky");
    await expect(ownerPage.getByText(/E2E poptávka/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await ownerCtx.close();
  });

  test("desktop and mobile screenshots of key surfaces", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/nemovitosti");
    await page.screenshot({
      path: "test-results/ris-catalog-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/nemovitosti");
    await page.screenshot({
      path: "test-results/ris-catalog-mobile.png",
      fullPage: true,
    });
    if (listingUrl) {
      await page.goto(listingUrl);
      await page.screenshot({
        path: "test-results/ris-detail-mobile.png",
        fullPage: true,
      });
    }
    if (manageUrl) {
      await login(page, OWNER.email, OWNER.password);
      await page.goto(manageUrl);
      await page.screenshot({
        path: "test-results/ris-manage-mobile.png",
        fullPage: true,
      });
    }
  });
});
