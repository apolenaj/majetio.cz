import { test, expect } from "@playwright/test";

/**
 * Location Intelligence E2E — SEO tags, A11y landmarks, demo labeling.
 * Synthetic demos only — not production market data.
 */

test.describe("Location Intelligence pages", () => {
  test("hub lists demo locations with demo marker", async ({ page }) => {
    await page.goto("/lokality", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Lokality/i })).toBeVisible();
    await expect(page.getByText(/Demo data/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Praha/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Brno/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Liberec/i }).first()).toBeVisible();
  });

  test("Praha detail: breadcrumbs, demo alert, noindex robots", async ({
    page,
  }) => {
    await page.goto("/lokality/praha", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("navigation", { name: /Drobečková/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Demonstrační|Demo/i).first()).toBeVisible();

    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "").toMatch(/noindex/i);

    // A11y: main sections have headings
    await expect(
      page.getByRole("heading", { name: /Rychlý přehled trhu|Tržní shrnutí/i }).first(),
    ).toBeVisible();

    // Map section must expose table alternative
    await expect(page.getByText(/Tabulkové shrnutí mapové vrstvy/i)).toBeVisible();
  });

  test("nested Vinohrady canonical path works", async ({ page }) => {
    await page.goto("/lokality/praha/vinohrady", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Vinohrady/i).first()).toBeVisible();
  });

  test("Liberec thin demo remains visible but noindex", async ({ page }) => {
    await page.goto("/lokality/liberec", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "").toMatch(/noindex/i);
  });

  test("comparison page has table or mobile cards landmark", async ({ page }) => {
    await page.goto("/lokality/porovnani?l=praha&l=brno", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { name: /Porovnání lokalit/i })).toBeVisible();
    await expect(page.getByText(/Segment/i).first()).toBeVisible();
  });

  test("JSON-LD scripts present without AggregateRating", async ({ page }) => {
    await page.goto("/lokality/praha", { waitUntil: "domcontentloaded" });
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const joined = scripts.join("\n");
    expect(joined).toContain("BreadcrumbList");
    expect(joined).toContain("Place");
    expect(joined).not.toMatch(/AggregateRating/i);
  });
});
