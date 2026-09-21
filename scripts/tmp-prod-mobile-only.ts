import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const BASE = "https://www.majetio.cz";
const stamp = Date.now();
const email = `smoke.mobileonly.${stamp}@majetio-demo.example`;
const password = `Sm0kePass${String(stamp).slice(-4)}`;
const prisma = new PrismaClient();

async function main() {
  await prisma.authRateLimit.deleteMany({});
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
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
  const method = await page
    .locator('form[aria-label="Registrace"]')
    .getAttribute("method");
  await page
    .locator('form[aria-label="Registrace"]')
    .evaluate((f) => (f as HTMLFormElement).requestSubmit());
  await page
    .waitForURL(/onboarding|prihlaseni|registrace/, { timeout: 90000 })
    .catch(() => undefined);
  await page.waitForTimeout(4000);
  const url = page.url();
  const body = await page.locator("body").innerText();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const urlRefresh = page.url();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, role: true, passwordHash: true },
  });
  console.log(
    JSON.stringify(
      {
        email,
        method,
        url,
        urlRefresh,
        failBody: body.includes("nepodařilo dokončit"),
        failTitle: body.includes("Registrace se nezdařila"),
        onboarding: url.includes("/onboarding"),
        sessionOk: urlRefresh.includes("/onboarding"),
        db: user
          ? {
              email: user.email,
              role: user.role,
              pw: user.passwordHash?.startsWith("$2") ? "bcrypt" : "other",
            }
          : null,
      },
      null,
      2,
    ),
  );
  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
