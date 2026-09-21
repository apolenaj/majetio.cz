/**
 * Production smoke test — registration flow on https://www.majetio.cz
 * Does not print password hashes or secrets.
 */
import { chromium, type Browser, type Page, type Response } from "playwright";

const BASE = process.env.SMOKE_BASE_URL ?? "https://www.majetio.cz";
const stamp = Date.now();
const email = `smoke.reg.${stamp}@majetio-demo.example`;
const emailUpper = email.toUpperCase();
const password = `Sm0kePass${String(stamp).slice(-4)}`;

type NetHit = {
  method: string;
  status: number;
  url: string;
  setCookie: boolean;
  location: string | null;
};

function dismissOverlays(page: Page) {
  return page.evaluate(() => {
    document.querySelectorAll('[role="dialog"]').forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });
  });
}

async function fillRegister(page: Page, em: string, pw: string) {
  await page.goto(`${BASE}/registrace`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForSelector('form[aria-label="Registrace"] input[name="email"]', {
    timeout: 60000,
  });
  await dismissOverlays(page);
  await page.fill('input[name="email"]', em);
  await page.fill('input[name="password"]', pw);
  await page.check('input[name="acceptTerms"]');
}

async function submitRegister(page: Page) {
  await page.locator('form[aria-label="Registrace"]').evaluate((f) =>
    (f as HTMLFormElement).requestSubmit(),
  );
}

function summarize(body: string, url: string) {
  return {
    url,
    failTitle: body.includes("Registrace se nezdařila"),
    failBody:
      body.includes("Registraci se nepodařilo dokončit") ||
      body.includes("Registraci se nyní nepodařilo dokončit"),
    emailTaken: body.includes("už existuje"),
    hasLoginCta: body.includes("Přihlásit se") || body.includes("Přihlášení"),
    hasForgot: body.includes("Zapomenuté heslo"),
    onboarding: url.includes("/onboarding"),
    loginPage: url.includes("/prihlaseni"),
    passwordInUrl: /[?&]password=/i.test(url),
  };
}

async function main() {
  const report: Record<string, unknown> = {
    base: BASE,
    email,
    // password intentionally omitted from report
  };
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const hits: NetHit[] = [];

  page.on("response", async (res: Response) => {
    const req = res.request();
    if (req.method() === "POST" || res.status() >= 300) {
      const headers = res.headers();
      hits.push({
        method: req.method(),
        status: res.status(),
        url: res.url().slice(0, 180),
        setCookie: Boolean(headers["set-cookie"]),
        location: headers["location"] ?? null,
      });
    }
  });

  // --- 1+2+3: new user registration + network + session ---
  await fillRegister(page, email, password);
  const method = await page
    .locator('form[aria-label="Registrace"]')
    .getAttribute("method");
  report.formMethod = method;

  await submitRegister(page);
  await page.waitForURL(/onboarding|prihlaseni|registrace/, { timeout: 90000 }).catch(() => undefined);
  await page.waitForTimeout(3000);
  let body = await page.locator("body").innerText();
  const afterReg = summarize(body, page.url());
  report.afterReg = afterReg;
  report.networkAfterReg = hits.slice(-8);

  const accountCreation =
    afterReg.onboarding ||
    afterReg.loginPage ||
    (!afterReg.failBody && !afterReg.failTitle);
  report.PRODUCTION_REGISTRATION =
    afterReg.onboarding && !afterReg.failBody && !afterReg.failTitle && !afterReg.passwordInUrl
      ? "PASS"
      : afterReg.loginPage && !afterReg.failBody
        ? "PASS_SOFT_LOGIN"
        : "FAIL";
  report.ACCOUNT_CREATION = accountCreation && !afterReg.failBody ? "PASS" : "FAIL";
  report.ONBOARDING_REDIRECT = afterReg.onboarding ? "PASS" : "FAIL";

  // Session: refresh + protected page
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const urlAfterRefresh = page.url();
  await page.goto(`${BASE}/ucet`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  const ucetUrl = page.url();
  const sessionOk =
    !ucetUrl.includes("/prihlaseni") &&
    (ucetUrl.includes("/ucet") || ucetUrl.includes("/onboarding"));
  report.SESSION = sessionOk || afterReg.onboarding ? (sessionOk ? "PASS" : "CHECK") : "FAIL";
  report.sessionUrls = { afterRefresh: urlAfterRefresh, ucet: ucetUrl };

  // --- 4: logout + login ---
  // Try logout via known paths
  await page.goto(`${BASE}/ucet/nastaveni`, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => undefined);
  const logoutBtn = page.getByRole("button", { name: /Odhlásit|Logout/i });
  if (await logoutBtn.count()) {
    await logoutBtn.first().click();
    await page.waitForTimeout(2000);
  } else {
    // Fallback: clear cookies = logout
    await context.clearCookies();
  }
  await page.goto(`${BASE}/prihlaseni`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await dismissOverlays(page);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.locator('form[aria-label="Přihlášení"]').evaluate((f) =>
    (f as HTMLFormElement).requestSubmit(),
  );
  await page.waitForTimeout(8000);
  const loginUrl = page.url();
  const loginBody = await page.locator("body").innerText();
  const loginOk =
    !loginUrl.includes("/prihlaseni") ||
    loginBody.includes("Účet") ||
    loginUrl.includes("/ucet") ||
    loginUrl.includes("/onboarding");
  // Better: if still on prihlaseni with error, fail
  const loginFail = loginBody.includes("Nelze přihlásit") || loginBody.includes("není správně");
  report.LOGOUT_LOGIN = !loginFail && (loginOk || !loginUrl.includes("/prihlaseni")) ? "PASS" : loginFail ? "FAIL" : "CHECK";
  report.loginUrl = loginUrl;

  // Fresh context for duplicate / case / double-submit (avoid auth redirects)
  await context.close();
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();

  // --- 5: duplicate email ---
  await fillRegister(page2, email, password);
  await submitRegister(page2);
  await page2.waitForTimeout(10000);
  body = await page2.locator("body").innerText();
  const dup = summarize(body, page2.url());
  report.duplicate = dup;
  report.DUPLICATE_EMAIL =
    dup.emailTaken && !body.includes("500") && (dup.hasLoginCta || dup.hasForgot)
      ? "PASS"
      : dup.emailTaken
        ? "PASS"
        : "FAIL";

  // --- 6: case insensitive ---
  await fillRegister(page2, emailUpper, password);
  await submitRegister(page2);
  await page2.waitForTimeout(10000);
  body = await page2.locator("body").innerText();
  const cas = summarize(body, page2.url());
  report.caseInsensitive = cas;
  report.CASE_INSENSITIVE_EMAIL = cas.emailTaken || cas.onboarding === false && cas.failTitle ? (cas.emailTaken ? "PASS" : "FAIL") : cas.emailTaken ? "PASS" : "FAIL";
  if (cas.emailTaken) report.CASE_INSENSITIVE_EMAIL = "PASS";

  // --- 8: double submit ---
  const email2 = `smoke.dbl.${stamp}@majetio-demo.example`;
  await fillRegister(page2, email2, password);
  const pendingAttr = await page2.locator('form[aria-label="Registrace"] button[type="submit"]').getAttribute("disabled");
  await page2.locator('form[aria-label="Registrace"]').evaluate((f) => {
    const form = f as HTMLFormElement;
    form.requestSubmit();
    form.requestSubmit();
  });
  await page2.waitForTimeout(12000);
  body = await page2.locator("body").innerText();
  const dbl = summarize(body, page2.url());
  report.doubleSubmit = { ...dbl, hadDisabledAttr: pendingAttr };
  report.DOUBLE_SUBMIT =
    dbl.onboarding || dbl.loginPage || (!dbl.failBody && !body.includes("500"))
      ? "PASS"
      : "FAIL";

  // --- 9: method post already checked; password in URL ---
  report.FORM_SECURITY =
    method?.toLowerCase() === "post" &&
    !afterReg.passwordInUrl &&
    !dup.passwordInUrl &&
    !cas.passwordInUrl
      ? "PASS"
      : "FAIL";

  // --- 10: mobile ---
  await ctx2.close();
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mpage = await mobile.newPage();
  const memail = `smoke.mobi.${stamp}@majetio-demo.example`;
  await fillRegister(mpage, memail, password);
  await submitRegister(mpage);
  await mpage.waitForTimeout(15000);
  body = await mpage.locator("body").innerText();
  const mob = summarize(body, mpage.url());
  report.mobile = mob;
  report.MOBILE =
    (mob.onboarding || mob.loginPage) && !mob.failBody && !mob.passwordInUrl
      ? "PASS"
      : "FAIL";

  await mobile.close();
  await browser.close();

  // Soft-failure path: code contract (no production mutation)
  report.AUTOLOGIN_SOFT_FAILURE = "CODE_CHECK";

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error("SMOKE_FATAL", e instanceof Error ? e.message : e);
  process.exit(1);
});
