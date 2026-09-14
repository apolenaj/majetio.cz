/**
 * Fraud / abuse domain barrel.
 */

export {
  hashIdentifier,
  detectFreeAccountVelocity,
  detectPromotionAbuse,
  detectFakeListingSignals,
  isBlockedByAbuse,
  type AbuseSignal,
} from "./abuse-protection";
