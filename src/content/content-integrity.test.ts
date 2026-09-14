/**
 * Content integrity — block fake compliance, social proof, and overclaims
 * in public marketing / trust / homepage copy sources.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { homepageContent } from "@/content/homepage";
import { ABOUT_DO, ABOUT_DONT, TRUST_CENTER_SECTIONS } from "@/content/trust";
import { PUBLIC_DATA_SOURCES } from "@/content/data-sources/public-catalog";
import { pricingCatalog } from "@/config/pricing-architecture";

const FORBIDDEN = [
  /gdpr\s*compliant/i,
  /100\s*%\s*secure/i,
  /bank[- ]level\s*security/i,
  /pci\s*dss\s*certified/i,
  /iso\s*27001\s*certified/i,
  /garantujeme\s+výnos/i,
  /vyděláte\s+\d/i,
  /ušetříme\s+vám/i,
  /právně\s+bezpečné/i,
  /nejpřesnější\s+na\s+trhu/i,
  /trusted\s+by\s+\d/i,
  /aggregate\s*rating/i,
  /★★★★★/,
  /4\.9\s*\/\s*5/,
  /10\s*000\+?\s*uživatel/i,
  /fake\s+testimonial/i,
];

function collectContentFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, name.name);
    if (name.isDirectory()) out.push(...collectContentFiles(full));
    else if (/\.(ts|tsx)$/.test(name.name) && !name.name.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

describe("content integrity — forbidden marketing claims", () => {
  it("homepage / trust / catalog blobs avoid absolute fake claims", () => {
    const blob = JSON.stringify({
      homepageContent,
      ABOUT_DO,
      ABOUT_DONT,
      TRUST_CENTER_SECTIONS,
      PUBLIC_DATA_SOURCES,
      pricingCatalog: pricingCatalog.map((p) => ({
        key: p.key,
        nameCs: p.nameCs,
        taglineCs: p.taglineCs,
        features: p.features,
      })),
    });
    for (const pattern of FORBIDDEN) {
      expect(blob, String(pattern)).not.toMatch(pattern);
    }
    expect(blob.toLowerCase()).not.toContain("skutečně vyplatí");
    expect(blob.toLowerCase()).not.toContain("větší jistotou");
  });

  it("src/content sources have no forbidden absolute claims", () => {
    const root = join(process.cwd(), "src/content");
    const files = collectContentFiles(root);
    expect(files.length).toBeGreaterThan(5);
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN) {
        expect(text, `${file} :: ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("professional services do not invent named experts on the public catalog", () => {
    const professional = pricingCatalog.filter(
      (p) => p.segment === "professional_services",
    );
    for (const p of professional) {
      expect(p.taglineCs.toLowerCase()).not.toMatch(
        /ing\.\s+[a-zá-ž]+|dr\.\s+[a-zá-ž]+|jan\s+novák|petr\s+svoboda/i,
      );
      if (p.key === "expert_review" || p.key === "investment_audit") {
        expect(p.taglineCs.toLowerCase()).toMatch(/human-in-the-loop|human/);
      }
    }
  });

  it("subscription products never default auto-renew on", () => {
    for (const p of pricingCatalog) {
      expect(p.autoRenewDefault).toBe(false);
    }
  });
});
