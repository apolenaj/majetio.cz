"use client";

import * as React from "react";

import { trackLocation } from "@/domains/locations/analytics/events";

/** Fires location_page_view once on mount. */
export function LocationPageAnalytics({
  locationSlug,
  pathDepth,
  isDemo,
  indexable,
}: {
  locationSlug: string;
  pathDepth: number;
  isDemo: boolean;
  indexable: boolean;
}) {
  React.useEffect(() => {
    trackLocation({
      name: "location_page_view",
      props: {
        location_slug: locationSlug,
        path_depth: pathDepth,
        is_demo: isDemo,
        indexable,
      },
    });
  }, [locationSlug, pathDepth, isDemo, indexable]);

  return null;
}

/** IntersectionObserver — fire metric_viewed / chart_viewed when section visible. */
export function LocationSectionAnalytics({
  locationSlug,
  event,
}: {
  locationSlug: string;
  event:
    | { name: "location_metric_viewed"; metric_key: string }
    | { name: "location_chart_viewed"; chart: "price" | "rent" | "dual" }
    | { name: "location_map_viewed"; layer: "price" | "rent" | "yield" | "supply" };
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const fired = React.useRef(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || fired.current) return;
        fired.current = true;
        if (event.name === "location_metric_viewed") {
          trackLocation({
            name: "location_metric_viewed",
            props: {
              location_slug: locationSlug,
              metric_key: event.metric_key,
            },
          });
        } else if (event.name === "location_chart_viewed") {
          trackLocation({
            name: "location_chart_viewed",
            props: { location_slug: locationSlug, chart: event.chart },
          });
        } else {
          trackLocation({
            name: "location_map_viewed",
            props: { location_slug: locationSlug, layer: event.layer },
          });
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [locationSlug, event]);

  return <div ref={ref} className="h-0 w-full" aria-hidden />;
}
