/**
 * Checkout / ceník product availability — feature flags + catalog alignment.
 * Isolated gate: disabled / legal-review products must not reach create-order.
 */

import {
  pricingCatalog,
  type CatalogProductDef,
} from "@/config/pricing-architecture";
import {
  isFeatureEnabled,
  type FeatureFlagKey,
} from "@/config/feature-flags";

export function getCatalogProductDef(
  productKey: string,
): CatalogProductDef | undefined {
  return pricingCatalog.find((p) => p.key === productKey);
}

export function isCatalogProductFeatureEnabled(
  def: CatalogProductDef,
): boolean {
  if (!def.featureFlag) return true;
  return isFeatureEnabled(def.featureFlag as FeatureFlagKey);
}

/**
 * True when product may appear on public ceník / enter checkout.
 * CONTACT / null-price products are not checkoutable via PSP.
 */
export function isCatalogProductCheckoutAllowed(productKey: string): boolean {
  const def = getCatalogProductDef(productKey);
  if (!def) return false;
  if (!isCatalogProductFeatureEnabled(def)) return false;
  if (def.billingType === "CONTACT") return false;
  if (def.priceGrossMinor == null) return false;
  return true;
}

export function assertCatalogProductCheckoutAllowed(
  productKey: string,
): { ok: true } | { ok: false; error: string } {
  const def = getCatalogProductDef(productKey);
  if (!def) {
    return { ok: false, error: "Neznámý produkt." };
  }
  if (!isCatalogProductFeatureEnabled(def)) {
    return {
      ok: false,
      error: "Tento produkt není momentálně dostupný k objednání.",
    };
  }
  if (def.billingType === "CONTACT" || def.priceGrossMinor == null) {
    return {
      ok: false,
      error: "Tento produkt nelze objednat online — kontaktujte nás.",
    };
  }
  return { ok: true };
}

/** Public ceník: only products explicitly marked for new customers. */
export function isCatalogProductPubliclyListed(def: CatalogProductDef): boolean {
  if (!def.publicCustomerOffer) return false;
  return isCatalogProductFeatureEnabled(def);
}
