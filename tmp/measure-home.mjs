import { chromium } from "playwright";
import { mkdirSync, copyFileSync, existsSync } from "fs";
import { createRequire } from "module";

mkdirSync("artifacts", { recursive: true });
mkdirSync("tmp/screenshots", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://localhost:3010/", {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});
await page.waitForTimeout(2500);

const cookieBtn = page.getByRole("button", { name: /Přijmout vše|Odmítnout/i });
if (await cookieBtn.first().isVisible().catch(() => false)) {
  await cookieBtn.first().click().catch(() => {});
  await page.waitForTimeout(400);
}

await page.screenshot({ path: "artifacts/home-current-full.png", fullPage: true });
await page.screenshot({ path: "tmp/screenshots/pass-ref4-full.png", fullPage: true });
await page.screenshot({ path: "tmp/screenshots/pass-ref4-vp.png", fullPage: false });

const checks = await page.evaluate(() => {
  const h1 = document.querySelector(".home-hero-title");
  const lines = h1
    ? Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight))
    : null;
  const benefits = document.querySelectorAll(".home-hero-benefits li").length;
  const ukazka = [...document.querySelectorAll("span")].some((el) =>
    /^Ukázka$/i.test(el.textContent?.trim() || ""),
  );
  const catFooter = !!document.querySelector(".home-category-footer");
  const optionsCream = getComputedStyle(
    document.querySelector(".home-options") || document.body,
  ).backgroundColor;
  const assessBg = getComputedStyle(
    document.querySelector(".home-assess-strip") || document.body,
  ).backgroundColor;
  const footerH = document.querySelector("footer")?.getBoundingClientRect().height;
  const floatBadge = !!document.querySelector(".home-analysis-float-badge");
  const arrow = !!document.querySelector(".home-analysis-arrow");
  const heroSrc = document.querySelector(".home-hero-bleed img")?.getAttribute("src") || "";
  return {
    full: document.documentElement.scrollHeight,
    h1Text: h1?.textContent?.replace(/\s+/g, " ").trim(),
    h1ApproxLines: lines,
    benefits,
    ukazkaVisible: ukazka,
    catFooter,
    optionsCream,
    assessBg,
    footerH: footerH ? Math.round(footerH) : null,
    floatBadge,
    arrow,
    heroSrc,
  };
});

console.log(JSON.stringify(checks, null, 2));
await browser.close();

// Side-by-side comparison via sharp if available, else skip
try {
  const require = createRequire(import.meta.url);
  const sharp = require("sharp");
  const refPath = "artifacts/ref-home.jpg";
  const curPath = "artifacts/home-current-full.png";
  if (!existsSync(refPath) || !existsSync(curPath)) {
    console.log("Missing ref or current for comparison");
  } else {
    const width = 720;
    const ref = await sharp(refPath).resize({ width, withoutEnlargement: false }).png().toBuffer();
    const cur = await sharp(curPath).resize({ width }).png().toBuffer();
    const refMeta = await sharp(ref).metadata();
    const curMeta = await sharp(cur).metadata();
    const height = Math.max(refMeta.height || 0, curMeta.height || 0);
    const pad = async (buf, h) => {
      const m = await sharp(buf).metadata();
      if ((m.height || 0) >= h) return buf;
      return sharp(buf)
        .extend({
          top: 0,
          bottom: h - (m.height || 0),
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png()
        .toBuffer();
    };
    const refP = await pad(ref, height);
    const curP = await pad(cur, height);
    await sharp({
      create: {
        width: width * 2 + 16,
        height,
        channels: 3,
        background: { r: 30, g: 30, b: 30 },
      },
    })
      .composite([
        { input: refP, left: 0, top: 0 },
        { input: curP, left: width + 16, top: 0 },
      ])
      .png()
      .toFile("artifacts/home-reference-comparison.png");

    const overlay = await sharp(refP)
      .composite([{ input: await sharp(curP).ensureAlpha(0.5).png().toBuffer(), blend: "over" }])
      .png()
      .toFile("artifacts/home-overlay.png");
    console.log("comparison + overlay written", overlay);
  }
} catch (e) {
  console.log("sharp unavailable, writing note:", String(e.message || e));
}
