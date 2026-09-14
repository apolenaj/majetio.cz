import { test, expect } from "@playwright/test";

/**
 * Multi-market QA + Majetio.cz regression (Prompt 17 final).
 * International synthetic demos must NOT appear as public listings.
 */

test.describe("Majetio.cz multi-market regression", () => {
  test.describe.configure({ timeout: 90_000 });

  test("homepage and CZ listings remain available", async ({ page }) => {
    const home = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(home?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/Demo/i).first()).toBeVisible();

    await page.goto("/nemovitosti", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /^Nemovitosti$/i }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/demo/i).first()).toBeVisible();
  });

  test("international QA demos are not public listings", async ({ page }) => {
    await page.goto("/nemovitosti", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /^Nemovitosti$/i }),
    ).toBeVisible({ timeout: 60_000 });
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/Barcelona apartment \(ES QA\)/i);
    expect(body).not.toMatch(/Dubai Marina apartment \(AE QA\)/i);
    expect(body).not.toMatch(/Split holiday property \(HR QA\)/i);
    expect(body).not.toMatch(/demo-es-apartment-barcelona/i);
    expect(body).not.toMatch(/demo-ae-apartment-dubai/i);
    expect(body).not.toMatch(/demo-hr-holiday-split/i);
  });

  test("CZ demo detail still loads (regression)", async ({ page }) => {
    const res = await page.goto("/nemovitosti/demo-byt-3kk-vinohrady", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 60_000,
    });
  });

  test("unprefixed CZ path stays backward compatible", async ({ page }) => {
    const res = await page.goto("/cenik", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: /Ceník/i })).toBeVisible({
      timeout: 60_000,
    });
  });
});
