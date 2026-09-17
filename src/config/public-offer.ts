/**
 * Single public customer offer — separate from the internal pricing catalog.
 * Catalog rows (Buyer Pass, B2B, …) stay in pricing-architecture for entitlements
 * and existing orders; they must not appear on the public ceník.
 */

import { getCatalogProductByKey } from "@/config/pricing-architecture";

const deep = getCatalogProductByKey("deep_analysis");

/** Keys allowed on the public customer-facing ceník. */
export const PUBLIC_CUSTOMER_OFFER_KEYS = ["deep_analysis"] as const;

export type PublicCustomerOfferKey =
  (typeof PUBLIC_CUSTOMER_OFFER_KEYS)[number];

export function isPublicCustomerOfferKey(
  key: string,
): key is PublicCustomerOfferKey {
  return (PUBLIC_CUSTOMER_OFFER_KEYS as readonly string[]).includes(key);
}

export const publicCustomerOffer = {
  key: "deep_analysis" as const,
  nameCs: "Analýza nemovitosti před koupí",
  priceGrossMinor: deep?.priceGrossMinor ?? 499_000,
  priceGrossCzk: Math.round((deep?.priceGrossMinor ?? 499_000) / 100),
  vatNoteCs: "Cena včetně DPH",
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
  ctaHref: "/#posoudit",
  nonBindingNoteCs:
    "Odeslání poptávky není objednávkou ani platbou. Cenu a termín potvrdíme po přijetí podkladů.",
} as const;
