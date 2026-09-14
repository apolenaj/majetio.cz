/**
 * Analytics consent gate — client behavioral events need analytics cookies.
 * Ledger/auth events are always allowed. Marketing CTAs also need marketing.
 */

import {
  COOKIE_CONSENT_COOKIE,
  parseCookieConsent,
  type CookieConsentState,
} from "@/domains/privacy/cookie-consent";

export function readCookieConsentFromDocument(): CookieConsentState | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_CONSENT_COOKIE}=`));
  if (!match) return null;
  return parseCookieConsent(
    decodeURIComponent(match.slice(COOKIE_CONSENT_COOKIE.length + 1)),
  );
}

/**
 * First-party ledger / account / consent — never blocked by analytics cookies.
 * Includes server commerce completion (no amounts — see taxonomy).
 */
export const LEDGER_EVENT_NAMES = new Set([
  "signup_completed",
  "login_succeeded",
  "login_failed",
  "password_reset_requested",
  "password_reset_completed",
  "password_changed",
  "onboarding_step_saved",
  "onboarding_completed",
  "onboarding_skipped",
  "financial_profile_updated",
  "consent_given",
  "consent_revoked",
  "account_export_requested",
  "account_delete_requested",
  "notification_prefs_updated",
  "email_change_requested",
  "checkout_completed",
  "reconciliation_completed",
  "organization_created",
  "listing_published",
  "lead_inquiry_created",
]);

/** Partner / promo CTAs — require marketing category on the client. */
export const MARKETING_EVENT_NAMES = new Set([
  "hypotekajasne_cta_clicked",
  "pricing_cta_clicked",
]);

/**
 * Page-view style events that must only fire from the browser
 * (blocked on server even though other product telemetry is allowed).
 */
export const CLIENT_PAGE_VIEW_EVENTS = new Set([
  "homepage_viewed",
  "sample_analysis_viewed",
  "pricing_viewed",
  "property_detail_viewed",
  "valuation_viewed",
  "investment_analysis_viewed",
  "location_page_view",
  "location_metric_viewed",
  "location_chart_viewed",
  "location_map_viewed",
  "location_comparison_viewed",
  "admin_monetization_dashboard_viewed",
  "admin_audit_log_viewed",
  "recommendation_sort_viewed",
]);

/**
 * - Ledger: always allow.
 * - Server: allow first-party product actions; block pure page views.
 * - Client: require analytics consent; marketing events also need marketing.
 */
export function isAnalyticsAllowedForEvent(
  eventName: string,
  consent: CookieConsentState | null,
  opts?: { isServer?: boolean },
): boolean {
  if (LEDGER_EVENT_NAMES.has(eventName)) {
    return true;
  }

  if (opts?.isServer) {
    return !CLIENT_PAGE_VIEW_EVENTS.has(eventName);
  }

  if (!consent?.analytics) {
    return false;
  }
  if (MARKETING_EVENT_NAMES.has(eventName) && !consent.marketing) {
    return false;
  }
  return true;
}
