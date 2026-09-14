import { expect, test } from "@playwright/test";

/**
 * Sponsored Listing E2E (checklist 193).
 * Boost products disclosed; firewall copy; SERP never claims score influence.
 */

test.describe("Sponsored Listing (193)", () => {
  test("cenik sellers segment shows Boost with firewall disclaimer path", async ({
    page,
  }) => {
    await page.goto("/cenik");
    await expect(page.getByRole("heading", { name: /Prodávající/i })).toBeVisible();

    const sellers = page.locator("#segment-sellers");
    await expect(sellers.getByText(/Boost 7/i).first()).toBeVisible();
    await expect(sellers.getByText(/Boost 30/i).first()).toBeVisible();
    await expect(
      sellers.getByText(/Sponzorováno|organick|Score/i).first(),
    ).toBeVisible();
  });

  test("cenik does not claim boost changes Majetio Score", async ({ page }) => {
    await page.goto("/cenik");
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/Boost zvyšuje Majetio Score|boost improves score/i);
    expect(body).not.toMatch(/zaplaťte za lepší skóre/i);
  });

  test("pricing page server-price disclaimer remains (no dark scarcity)", async ({
    page,
  }) => {
    await page.goto("/cenik");
    await expect(
      page.getByText(/falešné odpočty|PricingPlan|souhlas/i).first(),
    ).toBeVisible();
  });

  test("nemovitosti SERP discloses sponsored firewall and keeps organic section", async ({
    page,
  }) => {
    await page.goto("/nemovitosti");
    await expect(
      page.getByRole("heading", { name: /^Nemovitosti$/i }),
    ).toBeVisible();
    // Organic / demo results still render
    await expect(page.locator("article").first()).toBeVisible({ timeout: 15_000 });
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/sponzorování zvyšuje skóre|boost improves score/i);
    // If sponsored section present, it must carry disclosure
    const sponsored = page.getByTestId("sponsored-placements");
    if ((await sponsored.count()) > 0) {
      await expect(sponsored.getByText(/Sponzorováno|neovlivňuje Majetio Score/i).first()).toBeVisible();
    }
  });
});
