import { chromium } from "playwright";
import { mkdirSync } from "fs";

mkdirSync("tmp/screenshots", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://localhost:3010/", {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});
await page.waitForTimeout(2000);

const cookieBtn = page.getByRole("button", { name: /Přijmout vše|Odmítnout/i });
if (await cookieBtn.first().isVisible().catch(() => false)) {
  await cookieBtn.first().click().catch(() => {});
  await page.waitForTimeout(400);
}

await page.screenshot({ path: "tmp/screenshots/current-home.png", fullPage: true });
await page.screenshot({ path: "tmp/current-home.png", fullPage: true });
await page.screenshot({ path: "tmp/screenshots/pass3-1440-vp.png", fullPage: false });
await page.screenshot({ path: "tmp/screenshots/pass3-1440-full.png", fullPage: true });

const metrics = await page.evaluate(() => {
  const h = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    return Math.round(el.getBoundingClientRect().height);
  };
  const byText = (re) => {
    const sections = [...document.querySelectorAll("section")];
    const el = sections.find((s) => re.test(s.innerText || ""));
    return el ? Math.round(el.getBoundingClientRect().height) : null;
  };
  const r = (el) => (el ? Math.round(el.getBoundingClientRect().height) : null);
  return {
    full: document.documentElement.scrollHeight,
    topbar: h(".home-topbar"),
    header: h("header"),
    hero: h(".home-hero"),
    searchPanel: h(".home-search-panel"),
    searchWrap: h(".home-search-wrap"),
    properties: byText(/Objevte své další místo/),
    analysis: h(".home-analysis"),
    tools: byText(/Analýzy a kalkulačky/),
    options: byText(/Více možností bydlení/),
    categories: byText(/Novostavby|Projekty/),
    studies: byText(/Podívejte se, co odhalí/),
    seller: h(".home-seller-strip"),
    assess: h(".home-assess-strip"),
    footer: h("footer"),
    cards: {
      propMedia: r(document.querySelector(".home-prop-media")),
      propCard: r(
        document.querySelector(".home-prop-media")?.closest("a") || null,
      ),
      analysisCard: r(document.querySelector(".home-analysis-card")),
      tool: r(document.querySelector(".home-tool-card")),
      mode: r(document.querySelector(".home-mode-card")),
      cat: r(document.querySelector(".home-category-card")),
      study: r(document.querySelector(".home-study-card")),
    },
  };
});

console.log(JSON.stringify(metrics, null, 2));
await browser.close();
