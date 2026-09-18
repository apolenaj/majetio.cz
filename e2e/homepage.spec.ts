import { test, expect } from "@playwright/test";

test.describe("homepage production surface", () => {
  test("single H1, platform CTAs, skip link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Nemovitosti, které hledáte/i,
      }),
    ).toBeVisible();

    const skip = page.getByRole("link", { name: /Přeskočit na obsah/i });
    await skip.focus();
    await expect(skip).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Najít nemovitost/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Nabídnout nemovitost/i }).first(),
    ).toHaveAttribute("href", "/pridat-nemovitost");
    await expect(page.getByText(/Modelové studie/i).first()).toBeVisible();
  });

  test("search form navigates to catalog", async ({ page }) => {
    await page.goto("/");
    await page.locator("#home-q").fill("Praha");
    await Promise.all([
      page.waitForURL(/\/nemovitosti/, { timeout: 15_000 }),
      page.getByRole("button", { name: /Najít nemovitost/i }).click(),
    ]);
    expect(page.url()).toMatch(/nemovitosti/);
  });

  test("mobile viewport keeps CTAs usable without horizontal scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1
      );
    });
    expect(overflow).toBeFalsy();
    await expect(
      page.getByRole("link", { name: /Nabídnout nemovitost/i }).first(),
    ).toBeVisible();
  });

  test("key section CTAs are clickable", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /Celý katalog/i }),
    ).toHaveAttribute("href", "/nemovitosti");
    await expect(
      page.getByRole("link", { name: /Způsoby koupě a spolupráce/i }),
    ).toHaveAttribute("href", "/moznosti");
  });

  test("footer and pricing surfaces resolve", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: /Ceník/i })).toHaveAttribute(
      "href",
      "/cenik",
    );
    await expect(
      footer.getByRole("link", { name: /Podmínky|Obchodní|soukrom/i }).first(),
    ).toBeVisible();
    await page.goto("/cenik");
    await expect(page.getByRole("heading", { name: /Ceník/i })).toBeVisible();
    await expect(page.locator("body")).toContainText(/success fee|Kč|Pronájem/i);
  });

  test("SSR HTML includes platform hero without client JS", async ({ request }) => {
    const response = await request.get("/");
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toMatch(/Nemovitosti, které hledáte/);
    expect(html).toMatch(/Modelové studie/);
  });
});
