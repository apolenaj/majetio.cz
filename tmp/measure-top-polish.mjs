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
  await page.waitForTimeout(300);
}

await page.screenshot({ path: "tmp/screenshots/polish-top-vp.png", fullPage: false });
await page.screenshot({ path: "tmp/screenshots/polish-top-full.png", fullPage: true });

const metrics = await page.evaluate(() => {
  const header = document.querySelector("header");
  const topbar = document.querySelector(".home-topbar");
  const hero = document.querySelector(".home-hero");
  const stage = document.querySelector(".home-hero-stage");
  const search = document.querySelector(".home-search-panel");
  const wrap = document.querySelector(".home-search-wrap");
  const links = document.querySelector(".home-search-links");
  const props = document.querySelector(".home-props");
  const benefits = document.querySelector(".home-hero-benefits");

  const r = (el) => (el ? el.getBoundingClientRect() : null);
  const hr = r(header);
  const her = r(hero);
  const sr = r(search);
  const lr = r(links);
  const br = r(benefits);

  let overlap = null;
  if (her && sr) {
    const heroBottom = her.bottom;
    const searchMid = sr.top + sr.height / 2;
    const above = Math.max(0, Math.min(sr.bottom, heroBottom) - sr.top);
    const below = Math.max(0, sr.bottom - heroBottom);
    overlap = {
      heroBottom: Math.round(heroBottom),
      searchTop: Math.round(sr.top),
      searchMid: Math.round(searchMid),
      searchBottom: Math.round(sr.bottom),
      searchH: Math.round(sr.height),
      pctAbove: Math.round((above / sr.height) * 100),
      pctBelow: Math.round((below / sr.height) * 100),
      midDelta: Math.round(searchMid - heroBottom),
    };
  }

  return {
    headerTop: hr ? Math.round(hr.top + window.scrollY) : null,
    headerY: hr ? Math.round(hr.top) : null,
    topbarExists: !!topbar && getComputedStyle(topbar).display !== "none",
    topbarH: topbar && getComputedStyle(topbar).display !== "none" ? Math.round(r(topbar).height) : 0,
    benefitsAboveSearch: br && sr ? br.bottom < sr.top + 8 : null,
    linksBelowSearch: lr && sr ? lr.top >= sr.bottom - 2 : null,
    linksInProps: links?.closest(".home-props") != null,
    wrapPosition: wrap ? getComputedStyle(wrap).position : null,
    overlap,
  };
});

console.log(JSON.stringify(metrics, null, 2));
await browser.close();
