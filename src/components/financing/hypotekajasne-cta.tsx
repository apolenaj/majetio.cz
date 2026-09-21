"use client";

import { ExternalLink } from "lucide-react";

import { track } from "@/lib/analytics/events";
import {
  buildHypotekaJasneFinancingUrl,
  type HypotekaJasneDestination,
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
  destination = "compare",
  label = "Porovnat možnosti financování",
  className,
  showExternalIcon = true,
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
  destination?: HypotekaJasneDestination;
  label?: string;
  className?: string;
  showExternalIcon?: boolean;
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
    destination,
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
      {showExternalIcon ? <ExternalLink aria-hidden className="size-3.5" /> : null}
      <span className="sr-only">(otevře se v nové kartě)</span>
    </a>
  );
}
