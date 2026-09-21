import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const BASE = "https://www.majetio.cz";
const stamp = Date.now();
const email = `smoke.final.${stamp}@majetio-demo.example`;
const password = `Sm0kePass${String(stamp).slice(-4)}`;
const prisma = new PrismaClient();

async function main() {
  await prisma.authRateLimit.deleteMany({});
  console.log(JSON.stringify({ rateLimitsCleared: true }));

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(`${BASE}/registrace`, {
    waitUntil: "networkidle",
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
      (r) =>
        r.request().method() === "POST" && r.url().includes("/registrace"),
      { timeout: 90000 },
    ),
    page
      .locator('form[aria-label="Registrace"]')
      .evaluate((f) => (f as HTMLFormElement).requestSubmit()),
  ]);

  await page.waitForTimeout(5000);
  const urlAfter = page.url();
  const cookiesAfter = await ctx.cookies();
  const bodyAfter = await page.locator("body").innerText();

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  const urlRefresh = page.url();
  const cookiesRefresh = await ctx.cookies();

  await page.goto(`${BASE}/ucet`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const urlUcet = page.url();

  // logout via clear + login
  await ctx.clearCookies();
  await page.goto(`${BASE}/prihlaseni`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() =>
    document.querySelectorAll('[role="dialog"]').forEach((el) => {
      (el as HTMLElement).style.display = "none";
    }),
  );
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page
    .locator('form[aria-label="Přihlášení"]')
    .evaluate((f) => (f as HTMLFormElement).requestSubmit());
  await page.waitForTimeout(5000);
  const urlLogin = page.url();
  const cookiesLogin = await ctx.cookies();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const urlLoginRefresh = page.url();

  // mobile one-shot
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mpage = await mctx.newPage();
  const memail = `smoke.mfinal.${stamp}@majetio-demo.example`;
  await mpage.goto(`${BASE}/registrace`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await mpage.evaluate(() =>
    document.querySelectorAll('[role="dialog"]').forEach((el) => {
      (el as HTMLElement).style.display = "none";
    }),
  );
  await mpage.fill('input[name="email"]', memail);
  await mpage.fill('input[name="password"]', password);
  await mpage.check('input[name="acceptTerms"]');
  await mpage
    .locator('form[aria-label="Registrace"]')
    .evaluate((f) => (f as HTMLFormElement).requestSubmit());
  await mpage
    .waitForURL(/onboarding|prihlaseni|registrace/, { timeout: 90000 })
    .catch(() => undefined);
  await mpage.waitForTimeout(4000);
  const murl = mpage.url();
  const mbody = await mpage.locator("body").innerText();
  const mcookies = await mctx.cookies();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      role: true,
      passwordHash: true,
      profile: { select: { id: true } },
      consents: { select: { type: true, granted: true, version: true } },
    },
  });
  const muser = await prisma.user.findUnique({
    where: { email: memail },
    select: { email: true, role: true, passwordHash: true },
  });

  console.log(
    JSON.stringify(
      {
        email,
        postStatus: res.status(),
        urlAfter,
        urlRefresh,
        urlUcet,
        urlLogin,
        urlLoginRefresh,
        authCookieNamesAfter: cookiesAfter
          .filter((c) => /auth|session|token/i.test(c.name))
          .map((c) => ({
            name: c.name,
            domain: c.domain,
            secure: c.secure,
            sameSite: c.sameSite,
            httpOnly: c.httpOnly,
            expires: c.expires,
          })),
        allCookieNamesAfter: cookiesAfter.map((c) => c.name),
        allCookieNamesRefresh: cookiesRefresh.map((c) => c.name),
        authCookieNamesLogin: cookiesLogin
          .filter((c) => /auth|session|token/i.test(c.name))
          .map((c) => c.name),
        failAfter:
          bodyAfter.includes("nepodařilo dokončit") ||
          bodyAfter.includes("Registrace se nezdařila"),
        onboardingAfter: urlAfter.includes("/onboarding"),
        sessionRefreshOk:
          urlRefresh.includes("/onboarding") &&
          !urlRefresh.includes("/prihlaseni"),
        sessionUcetOk: urlUcet.includes("/ucet") && !urlUcet.includes("/prihlaseni"),
        loginOk: !urlLogin.includes("/prihlaseni"),
        loginRefreshOk: !urlLoginRefresh.includes("/prihlaseni"),
        mobile: {
          memail,
          murl,
          fail: mbody.includes("nepodařilo dokončit"),
          onboarding: murl.includes("/onboarding"),
          authCookies: mcookies
            .filter((c) => /auth|session|token/i.test(c.name))
            .map((c) => c.name),
        },
        db: user
          ? {
              email: user.email,
              role: user.role,
              pw: user.passwordHash?.startsWith("$2") ? "bcrypt" : "other",
              lower: user.email === user.email.toLowerCase(),
              hasProfile: Boolean(user.profile),
              consents: user.consents,
            }
          : null,
        mdb: muser
          ? {
              email: muser.email,
              role: muser.role,
              pw: muser.passwordHash?.startsWith("$2") ? "bcrypt" : "other",
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
  console.error("FATAL", e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
