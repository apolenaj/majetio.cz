import { chromium } from "playwright";

const BASE = "https://www.majetio.cz";
const stamp = Date.now();
const email = `smoke.once.${stamp}@majetio-demo.example`;
const password = `Sm0kePass${String(stamp).slice(-4)}`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE}/registrace`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.evaluate(() =>
    document.querySelectorAll('[role="dialog"]').forEach((el) => {
      (el as HTMLElement).style.display = "none";
    }),
  );
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.check('input[name="acceptTerms"]');
  const [res] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/registrace") && r.request().method() === "POST",
      { timeout: 90000 },
    ),
    page
      .locator('form[aria-label="Registrace"]')
      .evaluate((f) => (f as HTMLFormElement).requestSubmit()),
  ]);
  await page.waitForTimeout(4000);
  const body = await page.locator("body").innerText();
  const alert = await page.locator('[role="alert"], .inline-alert, [class*="alert"]').allTextContents().catch(() => []);
  console.log(
    JSON.stringify(
      {
        email,
        status: res.status(),
        url: page.url(),
        alert,
        failTitle: body.includes("Registrace se nezdařila"),
        failBody: body.includes("nepodařilo dokončit"),
        rate: body.includes("příliš") || body.includes("Počkejte") || body.includes("rate"),
        exists: body.includes("už existuje"),
        snippet: body.slice(0, 800),
      },
      null,
      2,
    ),
  );
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
