/**
 * Maps section plugins → DOM anchors + localized nav labels (Prompt 17.3).
 * CZ live page keeps Czech anchors; AE extras use stable English ids.
 */

import {
  resolvePropertyDetailSections,
  type PropertyDetailSectionId,
} from "@/domains/properties/detail/section-plugins";

/** Plugin id → DOM id used by in-page sections. */
export const SECTION_ANCHOR_BY_ID: Partial<
  Record<PropertyDetailSectionId, string>
> = {
  overview: "prehled",
  economics: "ekonomika",
  scenarios: "scenare",
  financing: "financovani",
  risks: "rizika",
  location: "lokalita",
  history: "historie",
  sources: "zdroje",
  decision: "rozhodnuti",
  similar: "alternativa",
  identity: "identita",
  svj: "svj",
  penb: "penb",
  freehold: "freehold",
  service_charge: "service-charge",
  payment_plan: "payment-plan",
  off_plan: "off-plan",
};

const LABELS_CS: Partial<Record<PropertyDetailSectionId, string>> = {
  overview: "Přehled",
  identity: "Identita",
  economics: "Ekonomika",
  scenarios: "Scénáře",
  financing: "Financování",
  risks: "Rizika",
  location: "Lokalita",
  history: "Historie",
  sources: "Zdroje",
  decision: "Rozhodnutí",
  similar: "Alternativy",
  svj: "SVJ",
  penb: "PENB",
};

const LABELS_EN: Partial<Record<PropertyDetailSectionId, string>> = {
  overview: "Overview",
  identity: "Identity",
  economics: "Economics",
  scenarios: "Scenarios",
  financing: "Financing",
  risks: "Risks",
  location: "Location",
  history: "History",
  sources: "Sources",
  decision: "Decision",
  similar: "Similar",
  svj: "HOA / SVJ",
  penb: "Energy certificate",
  freehold: "Freehold",
  service_charge: "Service charge",
  payment_plan: "Payment plan",
  off_plan: "Off-plan",
};

/**
 * Sections that currently have markup on the CZ property detail page.
 * Extras stay in the registry but are omitted from nav until rendered.
 */
const RENDERED_ON_CZ_DETAIL: ReadonlySet<PropertyDetailSectionId> = new Set([
  "overview",
  "economics",
  "scenarios",
  "financing",
  "risks",
  "location",
  "history",
  "sources",
  "decision",
  "similar",
]);

export type PropertyDetailNavItem = {
  id: string;
  label: string;
  pluginId: PropertyDetailSectionId;
};

export function buildPropertyDetailNavSections(input: {
  marketCode: string;
  locale?: string;
  /** Include registered extras even if not yet on the page (preview). */
  includeUnrenderedExtras?: boolean;
}): PropertyDetailNavItem[] {
  const locale = input.locale ?? "cs-CZ";
  const labels = locale.startsWith("cs") ? LABELS_CS : LABELS_EN;
  const fallback = locale.startsWith("cs") ? LABELS_CS : LABELS_EN;

  return resolvePropertyDetailSections({ marketCode: input.marketCode })
    .filter((s) => {
      if (!SECTION_ANCHOR_BY_ID[s.id]) return false;
      if (RENDERED_ON_CZ_DETAIL.has(s.id)) return true;
      return Boolean(input.includeUnrenderedExtras);
    })
    .map((s) => ({
      pluginId: s.id,
      id: SECTION_ANCHOR_BY_ID[s.id]!,
      label: labels[s.id] ?? fallback[s.id] ?? s.id,
    }));
}
