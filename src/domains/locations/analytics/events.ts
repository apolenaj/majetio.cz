/**
 * Location analytics events — no PII, no exact CZK amounts, no street addresses.
 */

import { track, type AnalyticsEvent } from "@/lib/analytics/events";

export type LocationAnalyticsEvent =
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
    };

export function trackLocation(event: LocationAnalyticsEvent): void {
  track(event as AnalyticsEvent);
}
