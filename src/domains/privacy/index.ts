export {
  PRIVACY_DOCUMENT_KINDS,
  PRIVACY_POLICY_REGISTRY,
  FORBIDDEN_PASSPORT_FIELDS_WITHOUT_JUSTIFICATION,
  listPrivacyPolicies,
  getCurrentPrivacyPolicy,
  requiresReconsent,
  isForbiddenPassportFieldWithoutJustification,
  assertPassportFieldAllowed,
  type PrivacyDocumentKind,
  type PrivacyPolicyEntry,
  type ForbiddenPassportField,
} from "@/domains/privacy/policy-registry";

export {
  assertPartnerShareConsent,
  type ConsentPurpose,
  type ConsentRecordInput,
  type LegalDocumentType,
  type LegalDocumentRecord,
} from "@/domains/privacy/consent-record";

export {
  COOKIE_POLICY_VERSION,
  COOKIE_CONSENT_COOKIE,
  COOKIE_CATEGORY_META,
  parseCookieConsent,
  needsCookieBanner,
  type CookieConsentState,
} from "@/domains/privacy/cookie-consent";
