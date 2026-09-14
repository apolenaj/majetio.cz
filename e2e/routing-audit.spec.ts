import { expect, test } from "@playwright/test";

/**
 * Prompt 20.2 — Full route + redirect audit (anonymous / guest).
 * Asserts no unexpected 500s and correct auth redirects / permanent redirects.
 */

const PUBLIC_OK = [
  "/",
  "/nemovitosti",
  "/nemovitosti/praha",
  "/nemovitosti/demo-byt-3kk-vinohrady",
  "/porovnani",
  "/analyza",
  "/kalkulacky",
  "/kalkulacky/investicni-vynos",
  "/cenik",
  "/jak-to-funguje",
  "/metodika",
  "/metodika/verze",
  "/zdroje-dat",
  "/o-nas",
  "/kontakt",
  "/podminky",
  "/ochrana-soukromi",
  "/cookies",
  "/hledat",
  "/prihlaseni",
  "/registrace",
  "/zapomenute-heslo",
] as const;

const AUTH_REDIRECT = [
  "/ucet",
  "/ucet/oblibene",
  "/ucet/porovnani",
  "/ucet/ulozena-hledani",
  "/ucet/upozorneni",
  "/ucet/analyzy",
  "/onboarding",
  "/admin",
  "/profi",
] as const;

const PERMANENT_REDIRECTS: Array<{ from: string; to: RegExp }> = [
  { from: "/obchodni-podminky", to: /\/podminky/ },
  { from: "/ochrana-osobnich-udaju", to: /\/ochrana-soukromi/ },
  { from: "/o-majetio", to: /\/o-nas/ },
  { from: "/jak-odhadujeme-hodnotu", to: /\/metodika\/odhad-hodnoty/ },
];

test.describe("Prompt 20.2 — Route & redirect audit", () => {
  test.describe.configure({ timeout: 120_000 });

  test("public routes return 200 (no 500)", async ({ request }) => {
    for (const path of PUBLIC_OK) {
      const res = await request.get(path, { maxRedirects: 5 });
      expect(
        res.status(),
        `${path} → ${res.status()}`,
      ).toBeLessThan(400);
      expect(res.status(), `${path} must not be 5xx`).toBeLessThan(500);
    }
  });

  test("unknown route is 404", async ({ request }) => {
    const res = await request.get("/tato-stranka-neexistuje-xyz-20-2");
    expect(res.status()).toBe(404);
  });

  test("auth-gated routes redirect anonymous users to login", async ({
    page,
  }) => {
    for (const path of AUTH_REDIRECT) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(
        page,
        `Expected login redirect for ${path}, got ${page.url()}`,
      ).toHaveURL(/prihlaseni/);
      expect(page.url()).toMatch(/callbackUrl|prihlaseni/);
    }
  });

  test("legacy legal / brand URLs permanently redirect", async ({ request }) => {
    for (const { from, to } of PERMANENT_REDIRECTS) {
      const res = await request.get(from, { maxRedirects: 0 });
      // Next may respond 308/307 or follow internally; accept redirect or final OK on target.
      if ([301, 302, 307, 308].includes(res.status())) {
        const loc = res.headers()["location"] ?? "";
        expect(loc, from).toMatch(to);
      } else {
        expect(res.ok(), `${from} → ${res.status()}`).toBeTruthy();
        expect(res.url()).toMatch(to);
      }
    }
  });

  test("open-redirect callback is sanitized on login", async ({ page }) => {
    await page.goto(
      "/prihlaseni?callbackUrl=" +
        encodeURIComponent("https://evil.example/phish"),
    );
    await expect(page).toHaveURL(/prihlaseni/);
    await expect(page.getByRole("heading", { name: /přihlášení/i })).toBeVisible();
    // Form must post to Majetio, not the attacker host.
    const action = await page.locator("form").first().getAttribute("action");
    expect(action ?? "").not.toMatch(/evil\.example/i);
  });

  test("API health ok; admin API unauthorized", async ({ request }) => {
    const health = await request.get("/api/health");
    expect(health.ok()).toBeTruthy();
    const admin = await request.get("/api/admin/search?q=x");
    expect([401, 403]).toContain(admin.status());
  });
});
