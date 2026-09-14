/**
 * Subscription helpers — Investor Pro + B2B plans (no silent auto-renew).
 */

import { renewConsentInitialChecked } from "@/config/pricing-ux";

export const SUBSCRIPTION_PRODUCT_KEYS = [
  "investor_pro_monthly",
  "investor_pro_annual",
  "investor_pro",
  "agent_pro",
  "agency_growth",
  "developer_standard",
] as const;

export type SubscriptionProductKey = (typeof SUBSCRIPTION_PRODUCT_KEYS)[number];

export function isSubscriptionProductKey(
  key: string,
): key is SubscriptionProductKey {
  return (SUBSCRIPTION_PRODUCT_KEYS as readonly string[]).includes(key);
}

/**
 * UI + API must never pre-check renew. Silent auto-renew is forbidden.
 */
export function subscriptionRenewConsentDefaults() {
  return {
    autoRenewDefault: false as const,
    initialChecked: renewConsentInitialChecked(),
    requiresExplicitConsent: true as const,
  };
}

export type SubscriptionLifecycleEvent =
  | "trial_end"
  | "payment_succeeded"
  | "payment_failed"
  | "cancel"
  | "period_end"
  | "renew_consented";

export function describeSubscriptionGrantRuleCs(): string {
  return "Předplatné se aktivuje až po potvrzení platby (webhook). Obnova vyžaduje výslovný souhlas — žádné tiché auto-renewal.";
}
