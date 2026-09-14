import { test, expect } from "@playwright/test";

test.describe.configure({ timeout: 90_000 });

test("homepage IA and primary CTA", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded", timeout: 90_000 });
  await expect(
    page.getByRole("link", { name: /Majetio — úvodní stránka/i }),
  ).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/Demo/i).first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Analyzovat nemovitost/i }).first(),
  ).toBeVisible();
});

test("nav: nemovitosti → demo detail → analyza → cenik → jak to funguje", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const go = (path: string) =>
    page.goto(path, { waitUntil: "domcontentloaded", timeout: 90_000 });

  await go("/nemovitosti");
  await expect(
    page.getByRole("heading", { name: /^Nemovitosti$/i }),
  ).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/demo/i).first()).toBeVisible();

  await go("/nemovitosti/demo-byt-3kk-vinohrady");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
    timeout: 60_000,
  });

  await go("/analyza");
  await expect(
    page.getByRole("heading", { name: /Analyzovat nemovitost/i }),
  ).toBeVisible({ timeout: 60_000 });

  await go("/cenik");
  await expect(page.getByRole("heading", { name: /Ceník/i })).toBeVisible({
    timeout: 60_000,
  });

  await go("/jak-to-funguje");
  await expect(
    page.getByRole("heading", { name: /Jak Majetio funguje/i }),
  ).toBeVisible({ timeout: 60_000 });
});

test("account redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/ucet", { waitUntil: "domcontentloaded", timeout: 90_000 });
  await expect(page).toHaveURL(/prihlaseni/);
  expect(page.url()).toContain("callbackUrl");
});

test("admin redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "domcontentloaded", timeout: 90_000 });
  await expect(page).toHaveURL(/prihlaseni/);
});

test("footer product links resolve", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded", timeout: 90_000 });
  const footer = page.locator("footer");
  await expect(footer.getByRole("link", { name: "Nemovitosti" })).toHaveAttribute(
    "href",
    "/nemovitosti",
  );
  await expect(footer.getByRole("link", { name: "Ceník" })).toHaveAttribute(
    "href",
    "/cenik",
  );
  await page.goto("/cenik", { waitUntil: "domcontentloaded", timeout: 90_000 });
  await expect(page.getByRole("heading", { name: /Ceník/i })).toBeVisible({
    timeout: 60_000,
  });
});

test("404 page for unknown route", async ({ page }) => {
  const response = await page.goto("/tato-stranka-neexistuje-xyz", {
    timeout: 90_000,
  });
  expect(response?.status()).toBe(404);
});

test("health endpoint returns ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("ok");
});

test("mobile menu opens and is keyboard dismissible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.getByRole("button", { name: /Otevřít menu/i }).click();
  await expect(page.getByRole("dialog", { name: /Mobilní menu/i })).toBeVisible({
    timeout: 60_000,
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /Mobilní menu/i })).toBeHidden();
});
