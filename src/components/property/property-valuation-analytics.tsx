"use client";

import * as React from "react";

import { track, percentBucket } from "@/lib/analytics/events";

/**
 * Fires valuation_viewed once; comparable_opened on expand.
 */
export function PropertyValuationAnalytics({
  slug,
  status,
  confidenceLevel,
  isDemo,
  hasEstimate,
}: {
  slug: string;
  status: string;
  confidenceLevel: string;
  isDemo: boolean;
  hasEstimate: boolean;
}) {
  React.useEffect(() => {
    track({
      name: "valuation_viewed",
      props: {
        slug,
        status,
        confidence_level: confidenceLevel,
        is_demo: isDemo,
        has_estimate: hasEstimate,
      },
    });
  }, [slug, status, confidenceLevel, isDemo, hasEstimate]);

  return null;
}

export function trackComparableOpened(opts: {
  slug: string;
  anonymized: boolean;
  similarityPct: number;
}) {
  track({
    name: "comparable_opened",
    props: {
      slug: opts.slug,
      anonymized: opts.anonymized,
      similarity_bucket: percentBucket(opts.similarityPct),
    },
  });
}

export function PropertyValuationRecalcButton({
  slug,
}: {
  slug: string;
}) {
  const [done, setDone] = React.useState(false);

  return (
    <button
      type="button"
      className="mt-2 text-sm font-medium text-[var(--action-primary)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
      disabled={done}
      onClick={() => {
        track({
          name: "valuation_recalculation_requested",
          props: { slug, reason: "manual" },
        });
        setDone(true);
      }}
    >
      {done ? "Přepočet zaznamenán" : "Požádat o přepočet odhadu"}
    </button>
  );
}
