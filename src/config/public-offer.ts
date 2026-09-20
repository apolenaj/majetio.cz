/**
 * Public customer offer — surfaces from `@/config/pricing-architecture`.
 * Frontend never invents Kč; checkout must resolve server-side PricingPlan.
 */

import {
  getCatalogProductByKey,
  pricingCatalog,
  type CatalogProductDef,
} from "@/config/pricing-architecture";
import {
  OPERATOR_IDENTITY,
  OPERATOR_IDENTITY_BLOCKERS,
} from "@/content/operator-identity";
import { isCatalogProductPubliclyListed } from "@/domains/commerce/product-availability";

/** Keys allowed on the public customer-facing ceník (order = display order). */
export const PUBLIC_CUSTOMER_OFFER_KEYS = [
  "listing_basic_30",
  "listing_premium_30",
  "listing_prep",
  "deep_analysis",
  "property_search_project",
  "firm_starter_monthly",
  "firm_growth_monthly",
  "firm_scale_monthly",
] as const;

export type PublicCustomerOfferKey =
  (typeof PUBLIC_CUSTOMER_OFFER_KEYS)[number];

export function isPublicCustomerOfferKey(
  key: string,
): key is PublicCustomerOfferKey {
  return (PUBLIC_CUSTOMER_OFFER_KEYS as readonly string[]).includes(key);
}

export function listPublicCustomerProducts(): CatalogProductDef[] {
  return PUBLIC_CUSTOMER_OFFER_KEYS.map((key) => getCatalogProductByKey(key))
    .filter((p): p is CatalogProductDef => p != null)
    .filter((p) => isCatalogProductPubliclyListed(p));
}

export function priceGrossCzkFromMinor(minor: number | null | undefined): number | null {
  if (minor == null) return null;
  return Math.round(minor / 100);
}

/**
 * Paid checkout requires published operator identity for invoices.
 * Until then, public CTAs stay as non-binding inquiries.
 */
export function isOperatorReadyForPaidCheckout(): boolean {
  return Boolean(
    OPERATOR_IDENTITY.legalName &&
      OPERATOR_IDENTITY.ico &&
      OPERATOR_IDENTITY.registeredSeat &&
      OPERATOR_IDENTITY.mailboxDeliveryVerified,
  );
}

export function publicCheckoutMode(): "inquiry" | "checkout" {
  return isOperatorReadyForPaidCheckout() ? "checkout" : "inquiry";
}

const deep = getCatalogProductByKey("deep_analysis");

/** Legacy single-offer shape used by homepage analysis section. */
export const publicCustomerOffer = {
  key: "deep_analysis" as const,
  nameCs: "Analýza nemovitosti před koupí",
  priceGrossMinor: deep?.priceGrossMinor ?? 499_000,
  priceGrossCzk: Math.round((deep?.priceGrossMinor ?? 499_000) / 100),
  vatNoteCs: "Konečná cena pro spotřebitele",
  billingCs: "Jednorázově za jednu nemovitost",
  summaryCs:
    "Prověříme ekonomiku koupě, provozní náklady, scénáře a rizika. Dostanete srozumitelný rozbor, co vychází, co je nejisté a co ještě ověřit před podpisem.",
  includesCs: [
    "Ekonomika koupě: kupní cena, vedlejší náklady, rekonstrukce, rezerva, vlastní prostředky",
    "Přehled příjmů a provozních nákladů vlastníka (odděleně od služeb nájemce)",
    "Konzervativní, základní a příznivý scénář",
    "Financování a měsíční cash flow po splátkách (před zdaněním)",
    "Hlavní rizika, chybějící podklady a otázky před podpisem",
  ],
  processCs: [
    "Pošlete odkaz na inzerát nebo základní údaje (nezávazná poptávka).",
    "Doplníme chybějící podklady a oddělíme zadané údaje od modelových předpokladů.",
    "Připravíme analýzu a termín dodání potvrdíme podle rozsahu podkladů.",
  ],
  ctaLabelCs: "Nezávazně poptat analýzu",
  ctaHref: "/sluzby/analyza-pred-koupi",
  nonBindingNoteCs:
    "Odeslání poptávky není objednávkou ani platbou. Cenu a termín potvrdíme po přijetí podkladů.",
} as const;

export const PUBLIC_PRICING_POLICY = {
  versionKey: "v2026.09",
  noPercentageListingFeeCs:
    "Běžná inzerce na Majetiu není podmíněná procentní provizí z prodeje nemovitosti.",
  consumerPriceNoteCs:
    "U spotřebitelských produktů uvádíme konečnou cenu. Daňové doklady a DIČ doplníme, až budou ověřené údaje provozovatele.",
  b2bPriceNoteCs:
    "Firemní předplatné je uvedeno jako měsíční cena. Daňový režim (včetně DPH / reverse-charge) potvrdíme při objednávce podle ověřených údajů firmy.",
  inquiryUntilReadyCs:
    "Dokud nemáme ověřenou právní identitu provozovatele pro fakturaci, přijímáme nezávazné poptávky — neostré platby.",
  operatorBlockers: OPERATOR_IDENTITY_BLOCKERS,
} as const;

/** Guard: every public key must exist in catalog and be marked public. */
export function assertPublicOfferAlignedWithCatalog(): {
  ok: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  for (const key of PUBLIC_CUSTOMER_OFFER_KEYS) {
    const row = pricingCatalog.find((p) => p.key === key);
    if (!row || !row.publicCustomerOffer) missing.push(key);
  }
  return { ok: missing.length === 0, missing };
}
