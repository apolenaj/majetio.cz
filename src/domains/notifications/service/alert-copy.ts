import type { PropertyAlertType } from "@prisma/client";

import { formatCzk, formatPercentPoints } from "@/lib/format";

export const PROPERTY_ALERT_TYPE_LABELS_CS: Record<string, string> = {
  PRICE_DROP: "Pokles ceny",
  PRICE_DECREASE: "Pokles ceny",
  PRICE_INCREASE: "Růst ceny",
  STATUS_CHANGED: "Změna stavu",
  RELISTED: "Znovu v nabídce",
  NEW_ANALYSIS_AVAILABLE: "Nová analýza",
  FINANCING_CHANGED: "Změna financování",
  SAVED_SEARCH_MATCH: "Shoda s hledáním",
  NEW_PROPERTY: "Nová nabídka",
  LOCATION_WATCH_CREATED: "Sledování lokality",
  LOCATION_METRIC_CHANGE: "Změna metriky lokality",
};

const STATUS_LABELS_CS: Record<string, string> = {
  RESERVED: "rezervováno",
  SOLD: "prodáno",
  RENTED: "pronajato",
  WITHDRAWN: "staženo",
  UNAVAILABLE: "nedostupné",
  ACTIVE: "aktivní",
  ARCHIVED: "archivováno",
};

export function propertyAlertTypeLabel(type: string): string {
  return PROPERTY_ALERT_TYPE_LABELS_CS[type] ?? type;
}

export function buildPriceChangeCopy(input: {
  propertyTitle: string;
  dispositionHint?: string | null;
  previousCzk: number;
  currentCzk: number;
  decreased: boolean;
}): { title: string; body: string } {
  const delta = input.currentCzk - input.previousCzk;
  const abs = Math.abs(delta);
  const pct =
    input.previousCzk > 0 ? (delta / input.previousCzk) * 100 : 0;
  const unit =
    input.dispositionHint?.trim() ||
    (input.propertyTitle.toLowerCase().includes("byt") ? "bytu" : "nemovitosti");

  if (input.decreased) {
    return {
      title: `Cena uloženého ${unit} klesla`,
      body: `Cena uloženého ${unit} klesla o ${formatCzk(abs)} (${formatPercentPoints(pct, { signed: true, maximumFractionDigits: 1 })}).`,
    };
  }
  return {
    title: `Cena uloženého ${unit} vzrostla`,
    body: `Cena uloženého ${unit} vzrostla o ${formatCzk(abs)} (${formatPercentPoints(pct, { signed: true, maximumFractionDigits: 1 })}).`,
  };
}

export function buildStatusChangeCopy(input: {
  propertyTitle: string;
  newStatus: string;
  previousStatus?: string | null;
}): { title: string; body: string } {
  const label = STATUS_LABELS_CS[input.newStatus] ?? input.newStatus.toLowerCase();
  return {
    title: `Změna stavu: ${input.propertyTitle}`,
    body: `Stav nabídky je nyní ${label}.`,
  };
}

export function buildRelistedCopy(input: {
  propertyTitle: string;
}): { title: string; body: string } {
  return {
    title: `Znovu v nabídce: ${input.propertyTitle}`,
    body: "Uložená nemovitost je opět aktivní v katalogu.",
  };
}

export function buildSavedSearchBatchCopy(input: {
  searchName: string;
  count: number;
}): { title: string; body: string } {
  const n = input.count;
  const noun =
    n === 1 ? "nová nabídka odpovídá" : n < 5 ? "nové nabídky odpovídají" : "nových nabídek odpovídá";
  return {
    title: `${n} ${noun} hledání`,
    body: `Uložené hledání „${input.searchName}“: ${n} ${noun} vašim filtrům.`,
  };
}

export function normalizeAlertType(
  type: PropertyAlertType,
): PropertyAlertType {
  if (type === "PRICE_DROP") return "PRICE_DECREASE";
  return type;
}
