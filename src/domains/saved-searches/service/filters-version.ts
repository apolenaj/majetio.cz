/**
 * Saved search filters versioning (Prompt 8 Part 4).
 */

import {
  EMPTY_PROPERTY_URL_STATE,
  type PropertyUrlFilterState,
} from "@/domains/properties/search/url-state";

export const SAVED_SEARCH_FILTERS_VERSION = 1 as const;

export type SavedSearchFiltersV1 = {
  version: typeof SAVED_SEARCH_FILTERS_VERSION;
  state: PropertyUrlFilterState;
};

export function buildSavedSearchFilters(
  state: PropertyUrlFilterState,
): SavedSearchFiltersV1 {
  return {
    version: SAVED_SEARCH_FILTERS_VERSION,
    state: {
      ...EMPTY_PROPERTY_URL_STATE,
      ...state,
      typ: [...state.typ],
      dispozice: [...state.dispozice],
      stav: [...state.stav],
      vlastnictvi: [...state.vlastnictvi],
      energie: [...state.energie],
      strategie: [...state.strategie],
      kvalita: [...state.kvalita],
      kraje: [...(state.kraje ?? [])],
      stranka: 1,
    },
  };
}

export function parseSavedSearchFilters(raw: unknown): SavedSearchFiltersV1 {
  if (!raw || typeof raw !== "object") {
    return buildSavedSearchFilters(EMPTY_PROPERTY_URL_STATE);
  }
  const obj = raw as Record<string, unknown>;
  const version = typeof obj.version === "number" ? obj.version : 1;

  if (version === 1 && obj.state && typeof obj.state === "object") {
    const s = obj.state as Partial<PropertyUrlFilterState>;
    return buildSavedSearchFilters({
      ...EMPTY_PROPERTY_URL_STATE,
      ...s,
      typ: Array.isArray(s.typ) ? s.typ.map(String) : [],
      dispozice: Array.isArray(s.dispozice) ? s.dispozice.map(String) : [],
      stav: Array.isArray(s.stav) ? s.stav.map(String) : [],
      vlastnictvi: Array.isArray(s.vlastnictvi) ? s.vlastnictvi.map(String) : [],
      energie: Array.isArray(s.energie) ? s.energie.map(String) : [],
      strategie: Array.isArray(s.strategie) ? s.strategie.map(String) : [],
      kvalita: Array.isArray(s.kvalita) ? s.kvalita.map(String) : [],
      kraje: Array.isArray(s.kraje) ? s.kraje.map(String) : [],
      stranka: 1,
    });
  }

  // Legacy: treat entire object as flat url-like state
  return buildSavedSearchFilters({
    ...EMPTY_PROPERTY_URL_STATE,
    ...(obj as Partial<PropertyUrlFilterState>),
    typ: Array.isArray(obj.typ) ? (obj.typ as string[]) : [],
    dispozice: Array.isArray(obj.dispozice) ? (obj.dispozice as string[]) : [],
    stav: Array.isArray(obj.stav) ? (obj.stav as string[]) : [],
    vlastnictvi: Array.isArray(obj.vlastnictvi) ? (obj.vlastnictvi as string[]) : [],
    energie: Array.isArray(obj.energie) ? (obj.energie as string[]) : [],
    strategie: Array.isArray(obj.strategie) ? (obj.strategie as string[]) : [],
    kvalita: Array.isArray(obj.kvalita) ? (obj.kvalita as string[]) : [],
    kraje: Array.isArray(obj.kraje) ? (obj.kraje as string[]) : [],
    stranka: 1,
  });
}
