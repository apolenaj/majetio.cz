import { expect, test } from "@playwright/test";

/**
 * Security: Access denied — unauthenticated / unauthorized access to private URLs.
 */

const PRIVATE_REDIRECT_PATHS = [
  "/ucet",
  "/ucet/soukromi",
  "/ucet/nastaveni",
  "/ucet/financni-profil",
  "/onboarding",
  "/admin",
  "/admin/uzivatele",
  "/profi",
] as const;

test.describe("Security: Access denied", () => {
  test.describe.configure({ timeout: 90_000 });

  test("anonymous users are denied private account / admin / broker URLs", async ({
    page,
  }) => {
    for (const path of PRIVATE_REDIRECT_PATHS) {
      await page.goto(path, {
        waitUntil: "domcontentloaded",
        timeout: 90_000,
      });
      await expect(
        page,
        `Expected login/forbidden redirect for ${path}, got ${page.url()}`,
      ).toHaveURL(/prihlaseni|registrace|forbidden|error=forbidden/i);
    }
  });

  test("checkout paid product does not silently unlock for anonymous users", async ({
    page,
  }) => {
    await page.goto("/checkout?product=buyer_pass", {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await expect(page).toHaveURL(/prihlaseni|registrace|checkout/i);
    await expect(
      page.getByText(/Buyer Pass aktivní|entitlement active|přístup odemčen/i),
    ).toHaveCount(0);
  });

  test("admin API rejects anonymous callers", async ({ request }) => {
    const res = await request.get("/api/admin/search?q=test");
    expect([401, 403]).toContain(res.status());
    const cache = (res.headers()["cache-control"] ?? "").toLowerCase();
    if (cache) {
      expect(cache).toMatch(/no-store|private/);
    }
  });

  test("account privacy export rejects anonymous POST", async ({ request }) => {
    const res = await request.post("/api/account/privacy-export", {
      data: { token: "not-a-real-token" },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("payment webhook OPTIONS has no CORS allow-origin", async ({
    request,
  }) => {
    const res = await request.fetch("/api/payments/webhook", {
      method: "OPTIONS",
    });
    expect(res.status()).toBe(405);
    expect(res.headers()["access-control-allow-origin"]).toBeUndefined();
  });
});
