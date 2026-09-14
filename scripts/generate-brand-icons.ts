/**
 * Generate raster brand icons from SVG favicon.
 * Run: npm run brand:icons
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(process.cwd());
const faviconSvg = readFileSync(resolve(root, "public/brand/icons/favicon.svg"));

async function pngFromSvg(size: number, out: string) {
  const buf = await sharp(faviconSvg).resize(size, size).png().toBuffer();
  writeFileSync(resolve(root, out), buf);
  console.log("wrote", out, size);
}

async function ogImage() {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0B1F33"/>
  <rect x="80" y="80" width="1040" height="470" rx="24" fill="none" stroke="#C4A574" stroke-opacity="0.35" stroke-width="2"/>
  <g transform="translate(120 200) scale(6)">
    <path fill="#F7F4EF" d="M4 6h4.2c.66 0 1.2.54 1.2 1.2v17.6c0 .66-.54 1.2-1.2 1.2H4c-.66 0-1.2-.54-1.2-1.2V7.2C2.8 6.54 3.34 6 4 6zm8.2 0H27c.66 0 1.2.54 1.2 1.2v2.6c0 .66-.54 1.2-1.2 1.2H12.2c-.66 0-1.2-.54-1.2-1.2V7.2c0-.66.54-1.2 1.2-1.2zm0 8H23.5c.66 0 1.2.54 1.2 1.2v2.6c0 .66-.54 1.2-1.2 1.2H12.2c-.66 0-1.2-.54-1.2-1.2v-2.6c0-.66.54-1.2 1.2-1.2zm0 8H20c.66 0 1.2.54 1.2 1.2v2.6c0 .66-.54 1.2-1.2 1.2h-7.8c-.66 0-1.2-.54-1.2-1.2v-2.6c0-.66.54-1.2 1.2-1.2z"/>
  </g>
  <text x="340" y="280" fill="#F7F4EF" font-family="Georgia, serif" font-size="72" font-weight="600">Majetio</text>
  <text x="340" y="350" fill="#C4A574" font-family="Arial, sans-serif" font-size="28">Než koupíte, mějte jasno.</text>
  <text x="120" y="520" fill="#F7F4EF" fill-opacity="0.55" font-family="Arial, sans-serif" font-size="22">Majetio.cz · analytická realitní platforma</text>
</svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(resolve(root, "public/brand/social/majetio-og-brand.png"), buf);
  console.log("wrote OG brand png");
}

async function main() {
  await pngFromSvg(192, "public/brand/icons/icon-192.png");
  await pngFromSvg(512, "public/brand/icons/icon-512.png");
  await pngFromSvg(180, "public/brand/icons/apple-touch-icon.png");
  await ogImage();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
