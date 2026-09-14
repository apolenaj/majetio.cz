"use client";

import * as React from "react";

import { trackOnce } from "@/lib/analytics/track-once";

/** Fires pricing_viewed once per session — no plan prices in props. */
export function PricingPageAnalytics() {
  React.useEffect(() => {
    trackOnce("pricing_page", {
      name: "pricing_viewed",
      props: {},
    });
  }, []);

  return null;
}
