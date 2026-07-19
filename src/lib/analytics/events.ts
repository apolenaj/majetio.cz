/**
 * Typed analytics events — no PII / sensitive finance values.
 * Integration is a thin adapter; swap provider later without rewriting call sites.
 */

export type AnalyticsEvent =
  | { name: "navigation_item_clicked"; props: { label: string; href: string } }
  | { name: "primary_cta_clicked"; props: { label: string; href: string; location: string } }
  | { name: "property_search_started"; props: { hasQuery: boolean } }
  | { name: "property_card_opened"; props: { slug: string; isDemo: boolean } }
  | { name: "analysis_started"; props: { entry: string } }
  | { name: "comparison_opened"; props: { count?: number } }
  | { name: "pricing_viewed"; props: Record<string, never> }
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
      props: { product: "basic" | "full"; href: string };
    }
  | {
      name: "final_cta_clicked";
      props: { href: string; intent: "analyze" | "browse" };
    }
  | { name: "faq_opened"; props: { questionId: string } }
  /** Auth & account funnel — never include email, password, or CZK amounts */
  | { name: "signup_completed"; props: { consents: "terms_privacy" } }
  | { name: "login_succeeded"; props: Record<string, never> }
  | { name: "login_failed"; props: { reason: "credentials" | "rate_limit" | "unknown" } }
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
      props: { partner: "hypotekajasne" };
    }
  | {
      name: "partner_handoff_confirmed";
      props: { partner: "hypotekajasne"; field_count: number; is_mock: boolean };
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
  | {
      name: "saved_search_created";
      props: {
        filter_count: number;
        sort: string;
        alert_frequency: "OFF" | "INSTANT" | "WEEKLY";
      };
    }
  | {
      name: "saved_search_alert_updated";
      props: { alert_frequency: "OFF" | "INSTANT" | "WEEKLY" };
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
  assertAnalyticsSafe(event);
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event.name, event.props);
  }
  // Future: send to single analytics provider
}
