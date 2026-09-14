/**
 * Monetization anti-patterns (checklist 226).
 * Hard bans — must stay false / enforced in code + tests.
 */

export const MONETIZATION_ANTI_PATTERNS = [
  {
    id: "client_controlled_price",
    titleCs: "Klientem řízená cena",
    forbidden: true,
    enforcement:
      "checkout-input z.never(amount*) + resolveCanonicalCheckoutAmount server-side",
  },
  {
    id: "unlimited_free_abuse",
    titleCs: "Neomezený free abuse (registrace / usage)",
    forbidden: true,
    enforcement:
      "detectFreeAccountVelocity + usage meters + promo maxRedemptions",
  },
  {
    id: "marketing_bundled_with_purchase",
    titleCs: "Marketingový souhlas vázaný na nákup",
    forbidden: true,
    enforcement: "purchase-consent + checkout schema reject marketing fields",
  },
  {
    id: "prechecked_marketing_or_renew",
    titleCs: "Předzaškrtnutý marketing / renew consent",
    forbidden: true,
    enforcement: "pricing-ux renewConsentInitialChecked=false; registration unchecked",
  },
  {
    id: "silent_auto_renew",
    titleCs: "Tiché auto-obnovení předplatného",
    forbidden: true,
    enforcement: "pricingUxRules.antiDarkPatterns.allowSilentAutoRenew=false",
  },
  {
    id: "fake_scarcity_or_countdown",
    titleCs: "Falešná scarcity / odpočty",
    forbidden: true,
    enforcement: "pricing-ux antiDarkPatterns + PRICING_DISCLAIMERS_CS",
  },
  {
    id: "hidden_fees",
    titleCs: "Skryté poplatky",
    forbidden: true,
    enforcement: "VAT-inclusive list prices + allowHiddenFees=false",
  },
  {
    id: "boost_affects_score_or_organic",
    titleCs: "Boost ovlivňuje Majetio Score / organiku",
    forbidden: true,
    enforcement: "commercial-firewall + ranking-integrity tests",
  },
  {
    id: "gmv_as_revenue_or_ltv",
    titleCs: "GMV jako revenue nebo LTV vstup",
    forbidden: true,
    enforcement: "metrics GMV≠revenue + assertLtvDoesNotUseGmv",
  },
  {
    id: "double_revenue_attribution",
    titleCs: "Dvojí atribuce / double-count ledger",
    forbidden: true,
    enforcement: "unique sourceEntity + assertNoForcedDoubleAttribution",
  },
  {
    id: "entitlement_before_paid",
    titleCs: "Entitlement před payment.succeeded (placené)",
    forbidden: true,
    enforcement: "webhook grant path; PENDING_GRANT until paid",
  },
  {
    id: "concierge_claims_while_off",
    titleCs: "Concierge / success-fee sliby při flagu OFF",
    forbidden: true,
    enforcement: "TRANSACTION_SUCCESS_FEE_ENABLED default false + scrub",
  },
  {
    id: "empty_free_paywall",
    titleCs: "Prázdný free tier / fake paywall",
    forbidden: true,
    enforcement: "majetio_free grants BASIC_SCORE/BASIC_RISKS",
  },
  {
    id: "disputed_legal_features_default_on",
    titleCs: "Sporné legal/accounting features default ON",
    forbidden: true,
    enforcement: "assertDisputedFeaturesDefaultOff + LEGAL_REVIEW_REGISTRY",
  },
] as const;

export type MonetizationAntiPatternId =
  (typeof MONETIZATION_ANTI_PATTERNS)[number]["id"];

export function assertMonetizationAntiPatternsCatalog(): {
  ok: true;
} | { ok: false; violations: string[] } {
  const violations: string[] = [];
  for (const row of MONETIZATION_ANTI_PATTERNS) {
    if (!row.forbidden) violations.push(`${row.id}:not_forbidden`);
    if (!row.enforcement.trim()) violations.push(`${row.id}:no_enforcement`);
  }
  const ids = MONETIZATION_ANTI_PATTERNS.map((r) => r.id);
  if (new Set(ids).size !== ids.length) {
    violations.push("duplicate_ids");
  }
  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}
