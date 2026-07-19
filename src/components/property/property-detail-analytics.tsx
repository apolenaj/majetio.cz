"use client";

import * as React from "react";

import { track } from "@/lib/analytics/events";

/**
 * Fires property_detail_viewed once per mount — no prices, addresses, or PII.
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
    track({
      name: "property_detail_viewed",
      props: {
        slug,
        is_demo: isDemo,
        has_asking_price: hasAskingPrice,
        visibility,
      },
    });
  }, [slug, isDemo, hasAskingPrice, visibility]);

  return null;
}
