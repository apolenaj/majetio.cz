"use client";

import * as React from "react";

import { trackOnce } from "@/lib/analytics/track-once";
import { observeFunnelStep } from "@/lib/analytics/decision-metrics";

/**
 * Fires property_detail_viewed once per slug/session — no prices, addresses, or PII.
 */
export function PropertyDetailAnalytics({
  slug,
  isDemo,
  hasAskingPrice,
  visibility,
}: {
  slug: string;
  isDemo: boolean;
  hasAskingPrice: boolean;
  visibility: string;
}) {
  React.useEffect(() => {
    trackOnce(`property_detail:${slug}`, {
      name: "property_detail_viewed",
      props: {
        slug,
        is_demo: isDemo,
        has_asking_price: hasAskingPrice,
        visibility,
      },
    });
    observeFunnelStep("viewed");
  }, [slug, isDemo, hasAskingPrice, visibility]);

  return null;
}
