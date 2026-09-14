import { expect, test } from "@playwright/test";

/**
 * Admin Ops E2E surface checks (checklist 267–272 complementary).
 * Anonymous gate + route presence for operations flows.
 * Authenticated mutation flows are covered by Vitest E2E simulations
 * in src/domains/administration/testing/admin-e2e-operations-267-272.test.ts
 * (fixtures 250 + mocked domain orchestration).
 */

const ADMIN_FLOW_ROUTES = [
  { path: "/admin", label: "Dashboard" },
  { path: "/admin/data-quality", label: "DQ resolution" },
  { path: "/admin/nemovitosti/duplikaty", label: "Duplicate merge" },
  { path: "/admin/nemovitosti/moderace", label: "Listing moderation" },
  { path: "/admin/analyzy", label: "Model governance" },
  { path: "/admin/incidenty", label: "Incident resolution" },
  { path: "/admin/uzivatele", label: "Billing / entitlements" },
  { path: "/admin/objednavky", label: "Orders / billing ops" },
  { path: "/admin/monitoring", label: "Monitoring" },
] as const;

test.describe("Admin ops E2E gates (267–272)", () => {
  test("anonymous /admin redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/prihlaseni/);
    expect(page.url()).toMatch(/callbackUrl/);
  });

  for (const route of ADMIN_FLOW_ROUTES) {
    test(`${route.label} (${route.path}) is gated or reachable`, async ({
      page,
    }) => {
      const res = await page.goto(route.path);
      expect(res?.status()).not.toBe(404);
      await expect(page).toHaveURL(
        new RegExp(`prihlaseni|${route.path.replace(/\//g, "\\/")}`),
      );
    });
  }

  test("admin login surface exposes credentials fields", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/prihlaseni/);
    await expect(
      page.getByLabel(/e-?mail|email/i).or(page.locator('input[type="email"]')),
    ).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("duplicate merge route never 404s for anonymous", async ({ page }) => {
    const res = await page.goto("/admin/nemovitosti/duplikaty");
    expect(res?.status()).not.toBe(404);
    await expect(page).toHaveURL(/prihlaseni|duplikaty/);
  });

  test("moderation route never 404s for anonymous", async ({ page }) => {
    const res = await page.goto("/admin/nemovitosti/moderace");
    expect(res?.status()).not.toBe(404);
    await expect(page).toHaveURL(/prihlaseni|moderace/);
  });
});
