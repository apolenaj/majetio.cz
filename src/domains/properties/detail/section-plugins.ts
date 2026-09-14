/**
 * Property detail section plugins (Prompt 17.3).
 * Markets register extras via MarketPlugin.property.detailSectionExtraIds —
 * UI renders by id, no `if (country === 'CZ')`.
 */

import { getMarketPlugin } from "@/domains/markets/plugins";

export type PropertyDetailSectionId =
  | "overview"
  | "identity"
  | "economics"
  | "scenarios"
  | "financing"
  | "risks"
  | "location"
  | "history"
  | "sources"
  | "decision"
  | "similar"
  /** CZ / SK */
  | "svj"
  | "penb"
  /** AE / Gulf */
  | "service_charge"
  | "payment_plan"
  | "off_plan"
  | "freehold";

export type PropertyDetailSectionPlugin = {
  id: PropertyDetailSectionId;
  /** Sort order ascending. */
  order: number;
  /** Translation key for nav label. */
  labelKey: string;
  /** When false, section hidden even if registered. */
  enabled: boolean;
  /** Optional capability / feature gate. */
  requiresCapability?: string;
};

export const CORE_DETAIL_SECTIONS: readonly PropertyDetailSectionPlugin[] = [
  { id: "overview", order: 10, labelKey: "property.section.overview", enabled: true },
  { id: "identity", order: 20, labelKey: "property.section.identity", enabled: true },
  { id: "economics", order: 30, labelKey: "property.section.economics", enabled: true },
  { id: "scenarios", order: 40, labelKey: "property.section.scenarios", enabled: true },
  { id: "financing", order: 50, labelKey: "property.section.financing", enabled: true },
  { id: "risks", order: 60, labelKey: "property.section.risks", enabled: true },
  { id: "location", order: 70, labelKey: "property.section.location", enabled: true },
  { id: "history", order: 80, labelKey: "property.section.history", enabled: true },
  { id: "sources", order: 90, labelKey: "property.section.sources", enabled: true },
  { id: "decision", order: 100, labelKey: "property.section.decision", enabled: true },
  { id: "similar", order: 110, labelKey: "property.section.similar", enabled: true },
] as const;

/** Catalog of market-specific sections — selected by plugin ids, not country switches. */
export const DETAIL_SECTION_EXTRAS_CATALOG: Record<
  string,
  PropertyDetailSectionPlugin
> = {
  svj: { id: "svj", order: 55, labelKey: "property.section.svj", enabled: true },
  penb: { id: "penb", order: 56, labelKey: "property.section.penb", enabled: true },
  freehold: {
    id: "freehold",
    order: 51,
    labelKey: "property.section.freehold",
    enabled: true,
  },
  service_charge: {
    id: "service_charge",
    order: 52,
    labelKey: "property.section.service_charge",
    enabled: true,
  },
  payment_plan: {
    id: "payment_plan",
    order: 53,
    labelKey: "property.section.payment_plan",
    enabled: true,
  },
  off_plan: {
    id: "off_plan",
    order: 54,
    labelKey: "property.section.off_plan",
    enabled: true,
  },
};

export function resolvePropertyDetailSections(input: {
  marketCode: string;
  /** Override plugin extras (tests / admin preview). */
  extraIds?: readonly string[];
}): PropertyDetailSectionPlugin[] {
  const plugin = getMarketPlugin(input.marketCode);
  const extraIds =
    input.extraIds ?? plugin?.property.detailSectionExtraIds ?? [];
  const merged = new Map<PropertyDetailSectionId, PropertyDetailSectionPlugin>();
  for (const s of CORE_DETAIL_SECTIONS) merged.set(s.id, s);
  for (const id of extraIds) {
    const extra = DETAIL_SECTION_EXTRAS_CATALOG[id];
    if (extra) merged.set(extra.id, extra);
  }
  return [...merged.values()]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);
}
