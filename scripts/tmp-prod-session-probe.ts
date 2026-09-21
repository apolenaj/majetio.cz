/**
 * Focused prod session + mobile registration probe (no secrets printed).
 */
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const BASE = "https://www.majetio.cz";
const stamp = Date.now();
const email = `smoke.sess.${stamp}@majetio-demo.example`;
const password = `Sm0kePass${String(stamp).slice(-4)}`;
const prisma = new PrismaClient();

async function dismiss(page: import("playwright").Page) {
  await page.evaluate(() =>
    document.querySelectorAll('[role="dialog"]').forEach((el) => {
      (el as HTMLElement).style.display = "none";
    }),
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const net: Array<Record<string, unknown>> = [];

  page.on("response", (res) => {
    const req = res.request();
    if (req.method() === "POST" || res.status() >= 300) {
      const h = res.headers();
      const setCookie = h["set-cookie"] ?? "";
      const cookieNames = setCookie
        ? setCookie.split(/\n/).map((x) => x.split("=")[0] + "=…")
        : [];
      net.push({
        m: req.method(),
        s: res.status(),
        u: res.url().slice(0, 140),
        loc: h.location ?? null,
        cookies: cookieNames,
      });
    }
  });

  await page.goto(`${BASE}/registrace`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await dismiss(page);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.check('input[name="acceptTerms"]');
  await page
    .locator('form[aria-label="Registrace"]')
    .evaluate((f) => (f as HTMLFormElement).requestSubmit());
  await page
    .waitForURL(/onboarding|prihlaseni|registrace/, { timeout: 90000 })
    .catch(() => undefined);
  await page.waitForTimeout(2500);

  const cookies1 = await ctx.cookies();
  const url1 = page.url();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const url2 = page.url();
  const cookies2 = await ctx.cookies();
  await page.goto(`${BASE}/ucet`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const url3 = page.url();

  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mpage = await mctx.newPage();
  const memail = `smoke.mobi2.${stamp}@majetio-demo.example`;
  await mpage.goto(`${BASE}/registrace`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await dismiss(mpage);
  await mpage.fill('input[name="email"]', memail);
  await mpage.fill('input[name="password"]', password);
  await mpage.check('input[name="acceptTerms"]');
  const checked = await mpage.isChecked('input[name="acceptTerms"]');
  await mpage
    .locator('form[aria-label="Registrace"]')
    .evaluate((f) => (f as HTMLFormElement).requestSubmit());
  await mpage
    .waitForURL(/onboarding|prihlaseni|registrace/, { timeout: 90000 })
    .catch(() => undefined);
  await mpage.waitForTimeout(3000);
  const murl = mpage.url();
  const mbody = await mpage.locator("body").innerText();

  const users = await prisma.user.findMany({
    where: { email: { in: [email, memail] } },
    select: { email: true, role: true, passwordHash: true },
  });
  const consents = await prisma.consent.findMany({
    where: { user: { email: { in: [email, memail] } } },
    select: {
      type: true,
      granted: true,
      version: true,
      user: { select: { email: true } },
    },
  });

  console.log(
    JSON.stringify(
      {
        email,
        url1,
        url2,
        url3,
        cookieNames1: cookies1.map((c) => c.name),
        authCookies: cookies1
          .filter((c) => /auth|session|token/i.test(c.name))
          .map((c) => ({
            name: c.name,
            domain: c.domain,
            secure: c.secure,
            sameSite: c.sameSite,
            httpOnly: c.httpOnly,
            expires: c.expires,
          })),
        cookieNames2: cookies2.map((c) => c.name),
        net: net.slice(-15),
        mobile: {
          memail,
          murl,
          checked,
          failBody: mbody.includes("nepodařilo dokončit"),
          failTitle: mbody.includes("Registrace se nezdařila"),
          onboarding: murl.includes("/onboarding"),
          loginPage: murl.includes("/prihlaseni"),
        },
        db: users.map((u) => ({
          email: u.email,
          role: u.role,
          pw: u.passwordHash
            ? u.passwordHash.startsWith("$2")
              ? "bcrypt"
              : "other"
            : "null",
          lower: u.email === u.email.toLowerCase(),
        })),
        consents: consents.map((c) => ({
          email: c.user.email,
          type: c.type,
          granted: c.granted,
          version: c.version,
        })),
      },
      null,
      2,
    ),
  );

  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("PROBE_FATAL", e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
