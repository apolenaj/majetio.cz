/**
 * Pricing UX rules (checklist 124–128) — B2C/B2B clarity + anti dark-patterns.
 */

export const pricingUxRules = {
  /** 124 — B2C: clear one-time vs membership, free value first. */
  b2c: {
    showFreeTierFirst: true,
    emphasizeOneTimeVsSubscription: true,
    requireExplicitRenewConsent: true,
  },
  /** 125 — B2B: seats + listing limits upfront. */
  b2b: {
    showSeatsAndListingLimits: true,
    explainDowngradeKeepsListings: true,
  },
  /** 126 — Services: human-in-the-loop labels, no automation claims. */
  services: {
    labelHumanInTheLoop: true,
    forbidAutomationClaims: true,
  },
  /** 127 — Transparent limits/features comparison matrix. */
  comparison: {
    showLimitsMatrix: true,
    showFeatureMatrix: true,
  },
  /**
   * 128 — Dark pattern ban (hard — not overridable by env).
   * No auto-renewal without explicit consent, no fake scarcity/countdowns.
   */
  antiDarkPatterns: {
    allowSilentAutoRenew: false,
    allowFakeCountdownTimers: false,
    allowPrecheckedRenewConsent: false,
    allowFakeStockScarcity: false,
    allowHiddenFees: false,
  },
} as const;

export const PRICING_DISCLAIMERS_CS = {
  vatInclusive: "Uvedené ceny jsou včetně DPH, pokud není uvedeno jinak.",
  noAutoRenew:
    "Předplatné se neobnovuje automaticky bez vašeho výslovného souhlasu.",
  noFakeScarcity:
    "Nezobrazujeme falešné odpočty ani umělou nedostupnost nabídek.",
  serverPrice:
    "Cena při platbě vždy vychází z aktuálního PricingPlan na serveru — klientská částka se ignoruje.",
} as const;

export function assertNoDarkPatternConfig():
  | { ok: true; violations: [] }
  | { ok: false; violations: string[] } {
  const violations: string[] = [];
  const rules = pricingUxRules.antiDarkPatterns;
  if (rules.allowSilentAutoRenew) {
    violations.push("silent_auto_renew");
  }
  if (rules.allowFakeCountdownTimers) {
    violations.push("fake_countdown");
  }
  if (rules.allowPrecheckedRenewConsent) {
    violations.push("prechecked_renew");
  }
  if (rules.allowFakeStockScarcity) {
    violations.push("fake_scarcity");
  }
  if (rules.allowHiddenFees) {
    violations.push("hidden_fees");
  }
  if (violations.length > 0) {
    return { ok: false, violations };
  }
  return { ok: true, violations: [] };
}

/** Subscription renew UI must start unchecked. */
export function renewConsentInitialChecked(): false {
  return false;
}
