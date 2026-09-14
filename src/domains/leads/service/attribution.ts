/**
 * Lead source attribution — funnel measurement without PII.
 */

export type LeadAttribution = {
  channel: "calculator" | "property_detail" | "analysis" | "account" | "majetio";
  funnelStep: string | null;
  campaign: string | null;
  rawSource: string;
};

export function parseLeadSourceAttribution(source: string): LeadAttribution {
  const trimmed = source.trim();

  if (trimmed === "kalkulacky/financovani") {
    return {
      channel: "calculator",
      funnelStep: "financovani",
      campaign: null,
      rawSource: trimmed,
    };
  }

  if (trimmed.startsWith("nemovitosti/") && trimmed.endsWith("/financovani")) {
    return {
      channel: "property_detail",
      funnelStep: "financovani",
      campaign: null,
      rawSource: trimmed,
    };
  }

  if (trimmed.startsWith("analyza/") && trimmed.includes("/financovani")) {
    return {
      channel: "analysis",
      funnelStep: "financovani",
      campaign: null,
      rawSource: trimmed,
    };
  }

  if (trimmed.startsWith("ucet/")) {
    return {
      channel: "account",
      funnelStep: null,
      campaign: null,
      rawSource: trimmed,
    };
  }

  return {
    channel: "majetio",
    funnelStep: null,
    campaign: null,
    rawSource: trimmed,
  };
}

/** Human-readable property reference for partner — no internal IDs. */
export function buildExternalPropertyReference(input: {
  analysisId?: string | null;
  propertyId?: string | null;
  propertySlug?: string | null;
}): string | undefined {
  if (input.propertySlug) {
    return `Nemovitost ${input.propertySlug}`;
  }
  if (input.analysisId) {
    return `Investiční analýza (ref. ${input.analysisId.slice(-8)})`;
  }
  if (input.propertyId) {
    return `Nemovitost (ref. ${input.propertyId.slice(-8)})`;
  }
  return undefined;
}
