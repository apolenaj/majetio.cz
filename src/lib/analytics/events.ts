/**
 * Typed analytics events — no PII / sensitive finance values.
 * Integration is a thin adapter; swap provider later without rewriting call sites.
 */

import { scrubPii } from "@/lib/analytics/scrub-pii";
import { getAnalyticsProvider } from "@/lib/analytics/provider";
import { buildAnalyticsContext } from "@/lib/analytics/context";
import { isAnalyticsAllowedForEvent, readCookieConsentFromDocument } from "@/lib/analytics/consent-gate";

export type AnalyticsEvent =
  | { name: "navigation_item_clicked"; props: { label: string; href: string } }
  | { name: "primary_cta_clicked"; props: { label: string; href: string; location: string } }
  | { name: "property_search_started"; props: { hasQuery: boolean } }
  | { name: "property_card_opened"; props: { slug: string; isDemo: boolean } }
  | { name: "analysis_started"; props: { entry: string } }
  | { name: "comparison_opened"; props: { count?: number } }
  | { name: "pricing_viewed"; props: Record<string, never> }
  | {
      name: "analysis_offer_viewed";
      props: {
        propertyId: string;
        isDemo: boolean;
        transactionType: "SALE" | "RENT";
      };
    }
  | {
      name: "analysis_offer_cta_clicked";
      props: {
        propertyId: string;
        cta: "primary" | "sample";
        mode: "inquiry" | "checkout";
      };
    }
  | {
      name: "analysis_inquiry_submitted";
      props: { propertyId: string | null; hasSnapshot: boolean };
    }
  | { name: "financing_cta_clicked"; props: { location: string } }
  | { name: "guide_article_opened"; props: { slug: string } }
  | { name: "mega_menu_opened"; props: { menu: string } }
  /** Homepage funnel */
  | {
      name: "homepage_viewed";
      props: { experiment_h1: string; experiment_cta: string; experiment_order: string };
    }
  | {
      name: "hero_primary_cta_clicked";
      props: { href: string; variant: string };
    }
  | {
      name: "hero_secondary_cta_clicked";
      props: { href: string; variant: string };
    }
  | {
      name: "quick_analysis_submitted";
      props: { entry: "url" | "manual"; valid: boolean };
    }
  | { name: "sample_analysis_viewed"; props: { isDemo: true } }
  | {
      name: "hypotekajasne_cta_clicked";
      props: { target: "calculator" | "external"; location: "homepage" };
    }
  | {
      name: "pricing_cta_clicked";
      props: { product: "basic" | "full" | "cenik"; href: string };
    }
  | {
      name: "final_cta_clicked";
      props: { href: string; intent: "analyze" | "browse" };
    }
  | { name: "faq_opened"; props: { questionId: string } }
  /** Auth & account funnel — never include email, password, or CZK amounts */
  | { name: "signup_completed"; props: { consents: "terms_privacy" } }
  | { name: "login_succeeded"; props: Record<string, never> }
  | {
      name: "login_failed";
      props: {
        reason: "credentials" | "rate_limit" | "unknown" | "account_status";
      };
    }
  | { name: "password_reset_requested"; props: Record<string, never> }
  | { name: "password_reset_completed"; props: Record<string, never> }
  | { name: "password_changed"; props: Record<string, never> }
  | {
      name: "onboarding_step_saved";
      props: { step: string; has_goal: boolean; investment_path: boolean };
    }
  | {
      name: "onboarding_completed";
      props: { goal: string | null; investment_path: boolean };
    }
  | { name: "onboarding_skipped"; props: Record<string, never> }
  | {
      name: "financial_profile_updated";
      props: { completion_level: string; percent_bucket: "0" | "1-39" | "40-69" | "70-99" | "100" };
    }
  | {
      name: "consent_given";
      props: { type: string; source: string };
    }
  | {
      name: "consent_revoked";
      props: { type: string; source: string };
    }
  | {
      name: "partner_handoff_preview_opened";
      props: { partner: "hypotekajasne"; step?: string };
    }
  | {
      name: "partner_handoff_confirmed";
      props: {
        partner: "hypotekajasne";
        field_count: number;
        is_mock: boolean;
        consent_type?: string;
      };
    }
  | { name: "account_export_requested"; props: { format: "json" | "csv" } }
  | { name: "account_delete_requested"; props: Record<string, never> }
  | {
      name: "notification_prefs_updated";
      props: { marketing_enabled: boolean; transactional_email: boolean };
    }
  | { name: "email_change_requested"; props: Record<string, never> }
  /** Discovery / search — aggregates only (no exact CZK, no street addresses) */
  | {
      name: "search_query_submitted";
      props: {
        has_query: boolean;
        location_token: string | null;
        filter_count: number;
        sort: string;
      };
    }
  | {
      name: "filter_applied";
      props: {
        filter_count: number;
        price_max_bucket: string;
        price_min_bucket: string;
        property_types: string[];
        layout_count: number;
        sort: string;
        location_token: string | null;
      };
    }
  | {
      name: "sort_changed";
      props: { sort: string };
    }
  | {
      name: "property_saved";
      props: { action: "add" | "remove"; is_demo: boolean };
    }
  | {
      name: "property_compared";
      props: { action: "add" | "remove"; tray_count: number };
    }
  /** Decision Workspace funnel (BOD 125–126) — never notes content / CZK */
  | {
      name: "property_favorited";
      props: { action: "add" | "remove"; is_demo: boolean; status?: string };
    }
  | {
      name: "property_shortlisted";
      props: { is_demo: boolean };
    }
  | {
      name: "comparison_created";
      props: { property_count: number };
    }
  | {
      name: "comparison_shared";
      props: { mode: "secret_link" | "invited_users"; property_count: number };
    }
  | {
      name: "comparison_share_opened";
      props: { mode: "secret_link" | "invited_users" };
    }
  | {
      name: "price_alert_opened";
      props: { alert_type: string; channel: string };
    }
  | {
      name: "decision_funnel_step";
      props: {
        step:
          | "viewed"
          | "saved"
          | "shortlisted"
          | "compared"
          | "analysis"
          | "purchase_intent";
      };
    }
  | {
      name: "saved_search_created";
      props: {
        filter_count: number;
        sort: string;
        alert_frequency: "OFF" | "INSTANT" | "DAILY" | "WEEKLY";
      };
    }
  | {
      name: "saved_search_alert_updated";
      props: { alert_frequency: "OFF" | "INSTANT" | "DAILY" | "WEEKLY" };
    }
  /** Note / task — length or type only, never body text */
  | {
      name: "decision_note_saved";
      props: { length_bucket: "0" | "1-80" | "81-400" | "401+" };
    }
  | {
      name: "decision_task_created";
      props: { task_type: string };
    }
  | {
      name: "recommendation_sort_viewed";
      props: { profile_complete: boolean; result_count_bucket: string };
    }
  /** Property detail / Decision Cockpit — no CZK amounts, no street addresses */
  | {
      name: "property_detail_viewed";
      props: {
        slug: string;
        is_demo: boolean;
        has_asking_price: boolean;
        visibility: string;
      };
    }
  | {
      name: "property_detail_section_nav";
      props: { section: string };
    }
  | {
      name: "scenario_changed";
      props: { scenario_id: string; is_demo: boolean };
    }
  | {
      name: "similar_property_clicked";
      props: { from_slug: string; to_slug: string };
    }
  /** Valuation engine — no CZK amounts, no addresses */
  | {
      name: "valuation_viewed";
      props: {
        slug: string;
        status: string;
        confidence_level: string;
        is_demo: boolean;
        has_estimate: boolean;
      };
    }
  | {
      name: "comparable_opened";
      props: {
        slug: string;
        anonymized: boolean;
        similarity_bucket: "0" | "1-39" | "40-69" | "70-99" | "100";
      };
    }
  | {
      name: "valuation_recalculation_requested";
      props: {
        slug: string;
        reason: "manual" | "stale" | "price_changed";
      };
    }
  /** Investment calculator — no CZK amounts, no personal data */
  | {
      name: "investment_analysis_viewed";
      props: {
        entry: "calculator" | "analysis" | "shared";
        strategy: string;
        mode: "simple" | "advanced";
      };
    }
  | {
      name: "scenario_selected";
      props: {
        variant: string;
        strategy: string;
      };
    }
  | {
      name: "sensitivity_opened";
      props: {
        surface: "heatmap" | "one_way";
      };
    }
  | {
      name: "investment_assumption_changed";
      props: {
        field_bucket: string;
        strategy: string;
      };
    }
  | {
      name: "investment_scenario_saved";
      props: {
        authenticated: boolean;
      };
    }
  /** Location Intelligence — no street addresses, no exact CZK in props */
  | {
      name: "location_page_view";
      props: {
        location_slug: string;
        path_depth: number;
        is_demo: boolean;
        indexable: boolean;
      };
    }
  | {
      name: "location_metric_viewed";
      props: { location_slug: string; metric_key: string };
    }
  | {
      name: "location_chart_viewed";
      props: { location_slug: string; chart: "price" | "rent" | "dual" };
    }
  | {
      name: "location_map_viewed";
      props: { location_slug: string; layer: "price" | "rent" | "yield" | "supply" };
    }
  | {
      name: "location_map_layer_changed";
      props: { location_slug: string; layer: "price" | "rent" | "yield" | "supply" };
    }
  | {
      name: "location_comparison_viewed";
      props: { location_count: number; segment_bucket: string; has_match: boolean };
    }
  | {
      name: "location_internal_link_clicked";
      props: {
        location_slug: string;
        target: "properties" | "strategy" | "guide" | "mortgage" | "comparison";
      };
    }
  /** Monetization funnel — no amounts, emails, or notes (157/158) */
  | {
      name: "checkout_started";
      props: { product_key: string; has_promo: boolean };
    }
  | {
      name: "checkout_completed";
      props: { product_key: string; billing_kind: "one_time" | "subscription" };
    }
  | {
      name: "subscription_renew_consent_shown";
      props: { product_key: string };
    }
  | {
      name: "admin_monetization_dashboard_viewed";
      props: { has_mrr: boolean; has_gmv: boolean };
    }
  | {
      name: "admin_audit_log_viewed";
      props: { row_count_bucket: "0" | "1-20" | "21+" };
    }
  | {
      name: "reconciliation_completed";
      props: {
        repair: boolean;
        finding_count_bucket: "0" | "1-5" | "6+";
        has_errors: boolean;
      };
    }
  /** B2B funnel — org → publish → lead (no PII / addresses) */
  | {
      name: "organization_created";
      props: { org_type: string; market_code: string };
    }
  | {
      name: "listing_published";
      props: { market_code: string };
    }
  | {
      name: "lead_inquiry_created";
      props: { has_message: boolean; authenticated_buyer: boolean };
    };

const FORBIDDEN_PROP_KEYS = new Set([
  "email",
  "password",
  "phone",
  "token",
  "amount",
  "price",
  "equity",
  "income",
  "liabilities",
  "liability",
  "czk",
  "rodne",
  "birth",
  /** Private Decision Workspace — never ship note bodies. */
  "note",
  "notes",
  "content",
  "privateNotes",
  "rejectionReason",
  "passport",
]);

/** Runtime guard — analytics must never carry PII or raw finance amounts. */
export function assertAnalyticsSafe(event: AnalyticsEvent): void {
  const serialized = JSON.stringify(event);
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized)) {
    throw new Error(`Analytics event ${event.name} contains an e-mail-like value.`);
  }
  for (const key of Object.keys(event.props)) {
    if (FORBIDDEN_PROP_KEYS.has(key.toLowerCase())) {
      throw new Error(`Analytics event ${event.name} uses forbidden prop key: ${key}`);
    }
  }
}

export function percentBucket(percent: number): "0" | "1-39" | "40-69" | "70-99" | "100" {
  if (percent <= 0) return "0";
  if (percent < 40) return "1-39";
  if (percent < 70) return "40-69";
  if (percent < 100) return "70-99";
  return "100";
}

export function track(event: AnalyticsEvent): void {
  const isServer = typeof window === "undefined";
  const consent = isServer ? null : readCookieConsentFromDocument();
  if (
    !isAnalyticsAllowedForEvent(event.name, consent, { isServer })
  ) {
    return;
  }

  const cleaned = {
    name: event.name,
    props: scrubPii(event.props),
  } as AnalyticsEvent;
  assertAnalyticsSafe(cleaned);
  const context = buildAnalyticsContext(isServer ? "server" : "client");
  void getAnalyticsProvider().send({ ...cleaned, context });
}
