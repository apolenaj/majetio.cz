/**
 * Client/demo filter application from URL state (Prompt 8 Part 2).
 */

import type {
  PublicPropertyDto,
  PublicPropertyListItemDto,
} from "@/domains/properties/service/dto";
import { fuzzyIncludes } from "./text-match";
import {
  KVALITA_OPTIONS,
  STAV_OPTIONS,
  TYP_OPTIONS,
  VLASTNICTVI_OPTIONS,
  type PropertyUrlFilterState,
} from "./url-state";

export type SearchableListing = PublicPropertyListItemDto & {
  energyRating?: string | null;
  ownershipType?: string | null;
  condition?: string | null;
  landArea?: number | null;
  strategySlugs?: string[];
  status?: string;
  freshness?: string | null;
  description?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  completenessScore?: number | null;
  priceHistory?: PublicPropertyDto["priceHistory"];
  sources?: PublicPropertyDto["sources"];
  fieldConflicts?: PublicPropertyDto["fieldConflicts"];
  lastSeenAt?: string | null;
  visibility?: string;
};

export function applyUrlFiltersToListings(
  listings: SearchableListing[],
  state: PropertyUrlFilterState,
): SearchableListing[] {
  let items = [...listings];

  const text = state.q || state.lokalita;
  if (text) {
    items = items.filter((p) => {
      const blob = [
        p.title,
        p.location.label,
        p.location.city,
        p.location.district,
        p.location.region,
        ...(p.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ");
      return fuzzyIncludes(blob, text);
    });
  }

  if (state.cenaOd != null) {
    items = items.filter((p) => (p.askingPrice ?? 0) >= state.cenaOd!);
  }
  if (state.cenaDo != null) {
    items = items.filter(
      (p) => p.askingPrice == null || p.askingPrice <= state.cenaDo!,
    );
  }

  if (state.typ.length) {
    const types = new Set<string>();
    for (const t of state.typ) {
      const mapped = TYP_OPTIONS.find((o) => o.value === t)?.propertyType;
      if (mapped) types.add(mapped);
    }
    items = items.filter((p) => types.has(p.propertyType));
  }

  if (state.dispozice.length) {
    const layouts = new Set(state.dispozice.map((d) => d.toLowerCase()));
    items = items.filter((p) => {
      const layout = (p.layout ?? "").toLowerCase();
      return layouts.has(layout);
    });
  }

  if (state.plochaOd != null) {
    items = items.filter((p) => (p.usableArea ?? 0) >= state.plochaOd!);
  }
  if (state.plochaDo != null) {
    items = items.filter(
      (p) => p.usableArea == null || p.usableArea <= state.plochaDo!,
    );
  }

  if (state.pozemekOd != null) {
    items = items.filter((p) => (p.landArea ?? 0) >= state.pozemekOd!);
  }
  if (state.pozemekDo != null) {
    items = items.filter(
      (p) => p.landArea == null || p.landArea <= state.pozemekDo!,
    );
  }

  if (state.stav.length) {
    const conditions = new Set<string>();
    for (const s of state.stav) {
      const mapped = STAV_OPTIONS.find((o) => o.value === s)?.condition;
      if (mapped) conditions.add(mapped);
    }
    items = items.filter((p) => {
      if (!p.condition) return true;
      return conditions.has(p.condition);
    });
  }

  if (state.vlastnictvi.length) {
    const ownerships = new Set<string>();
    for (const v of state.vlastnictvi) {
      const mapped = VLASTNICTVI_OPTIONS.find((o) => o.value === v)?.ownership;
      if (mapped) ownerships.add(mapped);
    }
    items = items.filter((p) => {
      if (!p.ownershipType) return true;
      return ownerships.has(p.ownershipType);
    });
  }

  if (state.energie.length) {
    const set = new Set(state.energie.map((e) => e.toUpperCase()));
    items = items.filter((p) => {
      if (!p.energyRating) return true;
      return set.has(p.energyRating.toUpperCase());
    });
  }

  if (state.strategie.length) {
    items = items.filter((p) => {
      const slugs = p.strategySlugs ?? [];
      const tags = (p.tags ?? []).map((t) => t.toLowerCase());
      return state.strategie.some((s) => {
        if (slugs.includes(s)) return true;
        if (s.includes("pronajem") && tags.some((t) => t.includes("pronájem") || t.includes("pronajem"))) {
          return true;
        }
        if (s === "rekonstrukce" && tags.some((t) => t.includes("rekonstruk"))) {
          return true;
        }
        if (s === "vlastni-bydleni") return true; // soft demo match
        return false;
      });
    });
  }

  if (state.kvalita.length) {
    const qualities = new Set<string>();
    for (const k of state.kvalita) {
      const mapped = KVALITA_OPTIONS.find((o) => o.value === k)?.dataQuality;
      if (mapped) qualities.add(mapped);
    }
    items = items.filter(
      (p) => p.dataQuality != null && qualities.has(p.dataQuality),
    );
  }

  items = sortListings(items, state.razeni);

  return items;
}

function sortListings(
  items: SearchableListing[],
  razeni: PropertyUrlFilterState["razeni"],
): SearchableListing[] {
  const sorted = [...items];
  switch (razeni) {
    case "price_asc":
      sorted.sort((a, b) => (a.askingPrice ?? 0) - (b.askingPrice ?? 0));
      break;
    case "price_desc":
      sorted.sort((a, b) => (b.askingPrice ?? 0) - (a.askingPrice ?? 0));
      break;
    case "price_per_sqm":
      sorted.sort((a, b) => (b.pricePerSqm ?? 0) - (a.pricePerSqm ?? 0));
      break;
    case "price_per_sqm_asc":
      sorted.sort((a, b) => (a.pricePerSqm ?? 0) - (b.pricePerSqm ?? 0));
      break;
    case "area_desc":
      sorted.sort((a, b) => (b.usableArea ?? 0) - (a.usableArea ?? 0));
      break;
    case "recommended":
      // Match score sort is applied by the discovery page (needs Finanční pas).
      sorted.sort((a, b) =>
        (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
      );
      break;
    case "newest":
    default:
      sorted.sort((a, b) =>
        (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
      );
      break;
  }
  return sorted;
}
