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
  | { name: "email_change_requested"; props: Record<string, never> };

const FORBIDDEN_PROP_KEYS =
  /^(email|password|phone|token|amount|price|equity|income|liabilit|czk|rodne|birth)/i;

/** Runtime guard — analytics must never carry PII or raw finance amounts. */
export function assertAnalyticsSafe(event: AnalyticsEvent): void {
  const serialized = JSON.stringify(event);
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized)) {
    throw new Error(`Analytics event ${event.name} contains an e-mail-like value.`);
  }
  for (const key of Object.keys(event.props)) {
    if (FORBIDDEN_PROP_KEYS.test(key)) {
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
