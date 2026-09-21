"use client";

import { ExternalLink } from "lucide-react";

import { track } from "@/lib/analytics/events";
import {
  buildHypotekaJasneFinancingUrl,
  type HypotekaJasneLinkContext,
} from "@/lib/financing/hypotekajasne-url";

export function HypotekaJasneCTA({
  propertyPriceCzk,
  ownFundsCzk,
  loanAmountCzk,
  termYears,
  ratePp,
  propertyUrl,
  country,
  currency,
  sourceContext = "property_detail",
  label = "Porovnat možnosti financování",
  className,
}: {
  propertyPriceCzk?: number | null;
  ownFundsCzk?: number | null;
  loanAmountCzk?: number | null;
  termYears?: number | null;
  ratePp?: number | null;
  propertyUrl?: string | null;
  country?: string | null;
  currency?: string | null;
  sourceContext?: HypotekaJasneLinkContext;
  label?: string;
  className?: string;
}) {
  const href = buildHypotekaJasneFinancingUrl({
    propertyPriceCzk,
    ownFundsCzk,
    loanAmountCzk,
    termYears,
    ratePp,
    propertyUrl,
    country,
    currency,
    sourceContext,
  });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "fs-primary"}
      onClick={() => {
        track({
          name: "financing_cta_clicked",
          props: { location: sourceContext },
        });
        track({
          name: "hypotekajasne_cta_clicked",
          props: {
            target: "external",
            location: sourceContext,
          },
        });
      }}
    >
      {label}
      <ExternalLink aria-hidden className="size-3.5" />
    </a>
  );
}
