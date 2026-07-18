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
  | { name: "faq_opened"; props: { questionId: string } };

export function track(event: AnalyticsEvent): void {
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event.name, event.props);
  }
  // Future: send to single analytics provider
}
