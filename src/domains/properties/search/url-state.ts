/**
 * URL-driven property search state (Prompt 8 Part 2).
 * Czech query keys stay readable after refresh, e.g. ?lokalita=praha&cena-do=8000000
 */

import type { SearchSortPreset } from "@/domains/properties/schemas/search";
import {
  getSearchRegion,
  SEARCH_REGION_IDS,
} from "@/domains/properties/search/regions";

export type SearchContextTab =
  | "doporucene"
  | "ulozene"
  | "okoli"
  | "zahranicni";

export const SEARCH_CONTEXT_TABS = [
  { value: "doporucene" as const, label: "Doporučené pro Vás" },
  { value: "ulozene" as const, label: "Moje uložené" },
  { value: "okoli" as const, label: "V okolí" },
  { value: "zahranicni" as const, label: "Zahraniční" },
] as const;

export type PropertyUrlFilterState = {
  q?: string;
  lokalita?: string;
  cenaOd?: number;
  cenaDo?: number;
  /** Kategorie v sekci Nabídka (prodej / nabídky). */
  typ: string[];
  /** Kategorie v sekci Poptávka (oddělený state od nabídky). */
  typPoptavka: string[];
  dispozice: string[];
  plochaOd?: number;
  plochaDo?: number;
  pozemekOd?: number;
  pozemekDo?: number;
  stav: string[];
  vlastnictvi: string[];
  razeni?: SearchSortPreset;
  energie: string[];
  strategie: string[];
  kvalita: string[];
  /** Min. očekávaná roční návratnost (ROI) v %. */
  roiOd?: number;
  /** Min. odhadovaný měsíční cashflow v Kč. */
  cashflowOd?: number;
  /** Odhadovaná cena rekonstrukce — rozsah Od/Do v Kč. */
  rekonstrukceOd?: number;
  rekonstrukceDo?: number;
  /** Selected CZ/SK region slugs (`SEARCH_REGIONS`). */
  kraje: string[];
  /**
   * Discovery context tab:
   * doporucene | ulozene | okoli | zahranicni
   */
  kontext?: SearchContextTab;
  stranka: number;
  /** Market filters — shown only when coverage >= 40 % */
  cenovaHladina?: string;
  vynosVsBenchmark?: string;
  cenovyTrend?: string;
};

export const EMPTY_PROPERTY_URL_STATE: PropertyUrlFilterState = {
  typ: [],
  typPoptavka: [],
  dispozice: [],
  stav: [],
  vlastnictvi: [],
  energie: [],
  strategie: [],
  kvalita: [],
  kraje: [],
  stranka: 1,
};

const SORT_TO_URL: Record<SearchSortPreset, string> = {
  recommended: "doporucene",
  newest: "nejnovejsi",
  price_asc: "cena-vzestupne",
  price_desc: "cena-sestupne",
  price_per_sqm: "cena-m2",
  price_per_sqm_asc: "cena-m2-vzestupne",
  area_desc: "plocha-sestupne",
};

const URL_TO_SORT: Record<string, SearchSortPreset> = Object.fromEntries(
  Object.entries(SORT_TO_URL).map(([k, v]) => [v, k as SearchSortPreset]),
) as Record<string, SearchSortPreset>;

export const TYP_OPTIONS = [
  { value: "byt", label: "Byty", propertyType: "APARTMENT" },
  { value: "dum", label: "Domy", propertyType: "HOUSE" },
  { value: "dum-na-klic", label: "Domy na klíč", propertyType: "HOUSE" },
  { value: "pozemek", label: "Pozemky", propertyType: "LAND" },
  { value: "komercni", label: "Komerční", propertyType: "COMMERCIAL" },
  { value: "projekty", label: "Projekty", propertyType: "COMMERCIAL" },
  { value: "ostatni", label: "Ostatní", propertyType: "OTHER" },
] as const;

export const DISPOZICE_OPTIONS = [
  "1+kk",
  "1+1",
  "2+kk",
  "2+1",
  "3+kk",
  "3+1",
  "4+kk",
  "4+1",
  "5+kk",
] as const;

export const STAV_OPTIONS = [
  { value: "new", label: "Novostavba", condition: "NEW" },
  { value: "excellent", label: "Výborný", condition: "EXCELLENT" },
  { value: "good", label: "Dobrý", condition: "GOOD" },
  { value: "average", label: "Průměrný", condition: "AVERAGE" },
  { value: "rekonstrukce", label: "K rekonstrukci", condition: "NEEDS_RENOVATION" },
] as const;

export const VLASTNICTVI_OPTIONS = [
  { value: "osobni", label: "Osobní", ownership: "PERSONAL" },
  { value: "druzstevni", label: "Družstevní", ownership: "COOPERATIVE" },
  { value: "obecni", label: "Obecní", ownership: "MUNICIPAL" },
  { value: "firemni", label: "Firemní", ownership: "COMPANY" },
] as const;

export const ENERGIE_OPTIONS = ["A", "B", "C", "D", "E", "F", "G"] as const;

export const STRATEGIE_OPTIONS = [
  { value: "vlastni-bydleni", label: "Vlastní bydlení" },
  { value: "dlouhodoby-pronajem", label: "Dlouhodobý pronájem" },
  { value: "kratkodoby-pronajem", label: "Krátkodobý pronájem" },
  { value: "rekonstrukce", label: "Rekonstrukce" },
  { value: "flip", label: "Flip" },
] as const;

export const KVALITA_OPTIONS = [
  { value: "overena", label: "Ověřená data", dataQuality: "verified" },
  { value: "odhad", label: "Odhad", dataQuality: "estimated" },
  { value: "neuplne", label: "Neúplné", dataQuality: "incomplete" },
  { value: "zastarale", label: "Zastaralé", dataQuality: "stale" },
] as const;

export const RAZENI_OPTIONS = [
  { value: "doporucene" as const, label: "Doporučené", sort: "recommended" as const },
  { value: "nejnovejsi" as const, label: "Nejnovější", sort: "newest" as const },
  { value: "cena-vzestupne" as const, label: "Cena ↑", sort: "price_asc" as const },
  { value: "cena-sestupne" as const, label: "Cena ↓", sort: "price_desc" as const },
  { value: "cena-m2" as const, label: "Kč/m² ↓", sort: "price_per_sqm" as const },
];

function first(
  value: string | string[] | undefined,
): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function list(
  value: string | string[] | undefined,
): string[] {
  if (value == null || value === "") return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function num(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value.replace(/\s/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export type SearchParamsLike = Record<string, string | string[] | undefined>;

export function parsePropertySearchParams(
  params: SearchParamsLike,
): PropertyUrlFilterState {
  const razeniRaw = first(params.razeni);
  const razeni = razeniRaw ? URL_TO_SORT[razeniRaw] : undefined;

  const page = Math.max(1, Math.floor(num(first(params.stranka)) ?? 1));

  return {
    q: first(params.q)?.trim() || undefined,
    lokalita: first(params.lokalita)?.trim() || undefined,
    cenaOd: num(first(params["cena-od"])),
    cenaDo: num(first(params["cena-do"])),
    typ: list(params.typ),
    typPoptavka: list(params["typ-poptavka"]),
    dispozice: list(params.dispozice).map(normalizeDisposition),
    plochaOd: num(first(params["plocha-od"])),
    plochaDo: num(first(params["plocha-do"])),
    pozemekOd: num(first(params["pozemek-od"])),
    pozemekDo: num(first(params["pozemek-do"])),
    stav: list(params.stav),
    vlastnictvi: list(params.vlastnictvi),
    razeni,
    energie: list(params.energie).map((e) => e.toUpperCase()),
    strategie: list(params.strategie),
    kvalita: list(params.kvalita),
    roiOd: num(first(params["roi-od"])),
    cashflowOd: num(first(params["cashflow-od"])),
    rekonstrukceOd: num(first(params["rekonstrukce-od"])),
    rekonstrukceDo: num(first(params["rekonstrukce-do"])),
    kraje: list(params.kraje).filter((id) =>
      (SEARCH_REGION_IDS as readonly string[]).includes(id),
    ),
    kontext: parseContextTab(first(params.kontext)),
    stranka: page,
    cenovaHladina: first(params["cenova-hladina"]),
    vynosVsBenchmark: first(params["vynos-benchmark"]),
    cenovyTrend: first(params["cenovy-trend"]),
  };
}

function normalizeDisposition(value: string): string {
  const v = value.toLowerCase().replace(/\s+/g, "");
  if (/^\d\+kk$/.test(v) || /^\d\+\d$/.test(v)) return v;
  if (/^\dkk$/.test(v)) return `${v[0]}+kk`;
  return v;
}

function parseContextTab(
  raw: string | undefined,
): SearchContextTab | undefined {
  if (!raw) return undefined;
  const allowed = SEARCH_CONTEXT_TABS.map((t) => t.value);
  return (allowed as readonly string[]).includes(raw)
    ? (raw as SearchContextTab)
    : undefined;
}

/** Serialize state → query object (omit empties). */
export function serializePropertySearchParams(
  state: PropertyUrlFilterState,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (state.q) out.q = state.q;
  if (state.lokalita) out.lokalita = state.lokalita;
  if (state.cenaOd != null) out["cena-od"] = String(state.cenaOd);
  if (state.cenaDo != null) out["cena-do"] = String(state.cenaDo);
  if (state.typ.length) out.typ = state.typ.join(",");
  if (state.typPoptavka.length) out["typ-poptavka"] = state.typPoptavka.join(",");
  if (state.dispozice.length) out.dispozice = state.dispozice.join(",");
  if (state.plochaOd != null) out["plocha-od"] = String(state.plochaOd);
  if (state.plochaDo != null) out["plocha-do"] = String(state.plochaDo);
  if (state.pozemekOd != null) out["pozemek-od"] = String(state.pozemekOd);
  if (state.pozemekDo != null) out["pozemek-do"] = String(state.pozemekDo);
  if (state.stav.length) out.stav = state.stav.join(",");
  if (state.vlastnictvi.length) out.vlastnictvi = state.vlastnictvi.join(",");
  if (state.razeni) out.razeni = SORT_TO_URL[state.razeni] ?? state.razeni;
  if (state.energie.length) out.energie = state.energie.join(",");
  if (state.strategie.length) out.strategie = state.strategie.join(",");
  if (state.kvalita.length) out.kvalita = state.kvalita.join(",");
  if (state.roiOd != null) out["roi-od"] = String(state.roiOd);
  if (state.cashflowOd != null) out["cashflow-od"] = String(state.cashflowOd);
  if (state.rekonstrukceOd != null) {
    out["rekonstrukce-od"] = String(state.rekonstrukceOd);
  }
  if (state.rekonstrukceDo != null) {
    out["rekonstrukce-do"] = String(state.rekonstrukceDo);
  }
  if (state.kraje.length) out.kraje = state.kraje.join(",");
  if (state.kontext && state.kontext !== "doporucene") {
    out.kontext = state.kontext;
  }
  if (state.cenovaHladina) out["cenova-hladina"] = state.cenovaHladina;
  if (state.vynosVsBenchmark) out["vynos-benchmark"] = state.vynosVsBenchmark;
  if (state.cenovyTrend) out["cenovy-trend"] = state.cenovyTrend;
  if (state.stranka > 1) out.stranka = String(state.stranka);
  return out;
}

export function buildPropertySearchHref(
  state: PropertyUrlFilterState,
  basePath = "/nemovitosti",
): string {
  const params = serializePropertySearchParams(state);
  const qs = new URLSearchParams(params).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function countActiveFilters(state: PropertyUrlFilterState): number {
  let n = 0;
  if (state.q) n += 1;
  if (state.lokalita) n += 1;
  if (state.cenaOd != null || state.cenaDo != null) n += 1;
  n += state.typ.length;
  n += state.typPoptavka.length;
  n += state.dispozice.length;
  if (state.plochaOd != null || state.plochaDo != null) n += 1;
  if (state.pozemekOd != null || state.pozemekDo != null) n += 1;
  n += state.stav.length;
  n += state.vlastnictvi.length;
  n += state.energie.length;
  n += state.strategie.length;
  n += state.kvalita.length;
  if (state.roiOd != null) n += 1;
  if (state.cashflowOd != null) n += 1;
  if (state.rekonstrukceOd != null || state.rekonstrukceDo != null) n += 1;
  n += state.kraje.length;
  if (state.kontext && state.kontext !== "doporucene") n += 1;
  if (state.cenovaHladina) n += 1;
  if (state.vynosVsBenchmark) n += 1;
  if (state.cenovyTrend) n += 1;
  return n;
}

export type ActiveFilterChip = {
  id: string;
  label: string;
  /** Patch that removes this chip when applied. */
  clear: Partial<PropertyUrlFilterState>;
};

export function getActiveFilterChips(
  state: PropertyUrlFilterState,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  if (state.q) {
    chips.push({ id: "q", label: `„${state.q}“`, clear: { q: undefined } });
  }
  if (state.lokalita) {
    chips.push({
      id: "lokalita",
      label: state.lokalita,
      clear: { lokalita: undefined },
    });
  }
  if (state.cenaOd != null || state.cenaDo != null) {
    const label =
      state.cenaOd != null && state.cenaDo != null
        ? `${formatMil(state.cenaOd)}–${formatMil(state.cenaDo)}`
        : state.cenaDo != null
          ? `Do ${formatMil(state.cenaDo)}`
          : `Od ${formatMil(state.cenaOd!)}`;
    chips.push({
      id: "cena",
      label,
      clear: { cenaOd: undefined, cenaDo: undefined },
    });
  }
  for (const t of state.typ) {
    const opt = TYP_OPTIONS.find((o) => o.value === t);
    chips.push({
      id: `typ-${t}`,
      label: `Nabídka: ${opt?.label ?? t}`,
      clear: { typ: state.typ.filter((x) => x !== t) },
    });
  }
  for (const t of state.typPoptavka) {
    const opt = TYP_OPTIONS.find((o) => o.value === t);
    chips.push({
      id: `typ-p-${t}`,
      label: `Poptávka: ${opt?.label ?? t}`,
      clear: { typPoptavka: state.typPoptavka.filter((x) => x !== t) },
    });
  }
  for (const d of state.dispozice) {
    chips.push({
      id: `disp-${d}`,
      label: d,
      clear: { dispozice: state.dispozice.filter((x) => x !== d) },
    });
  }
  if (state.plochaOd != null || state.plochaDo != null) {
    chips.push({
      id: "plocha",
      label:
        state.plochaOd != null && state.plochaDo != null
          ? `${state.plochaOd}–${state.plochaDo} m²`
          : state.plochaDo != null
            ? `Do ${state.plochaDo} m²`
            : `Od ${state.plochaOd} m²`,
      clear: { plochaOd: undefined, plochaDo: undefined },
    });
  }
  for (const s of state.stav) {
    chips.push({
      id: `stav-${s}`,
      label: STAV_OPTIONS.find((o) => o.value === s)?.label ?? s,
      clear: { stav: state.stav.filter((x) => x !== s) },
    });
  }
  for (const v of state.vlastnictvi) {
    chips.push({
      id: `vl-${v}`,
      label: VLASTNICTVI_OPTIONS.find((o) => o.value === v)?.label ?? v,
      clear: { vlastnictvi: state.vlastnictvi.filter((x) => x !== v) },
    });
  }
  for (const e of state.energie) {
    chips.push({
      id: `en-${e}`,
      label: `PENB ${e}`,
      clear: { energie: state.energie.filter((x) => x !== e) },
    });
  }
  for (const s of state.strategie) {
    chips.push({
      id: `st-${s}`,
      label: STRATEGIE_OPTIONS.find((o) => o.value === s)?.label ?? s,
      clear: { strategie: state.strategie.filter((x) => x !== s) },
    });
  }
  for (const k of state.kvalita) {
    chips.push({
      id: `kq-${k}`,
      label: KVALITA_OPTIONS.find((o) => o.value === k)?.label ?? k,
      clear: { kvalita: state.kvalita.filter((x) => x !== k) },
    });
  }
  if (state.roiOd != null) {
    chips.push({
      id: "roi",
      label: `ROI od ${formatPct(state.roiOd)}`,
      clear: { roiOd: undefined },
    });
  }
  if (state.cashflowOd != null) {
    chips.push({
      id: "cashflow",
      label: `Cashflow od ${formatCzk(state.cashflowOd)}/měs.`,
      clear: { cashflowOd: undefined },
    });
  }
  if (state.rekonstrukceOd != null || state.rekonstrukceDo != null) {
    const label =
      state.rekonstrukceOd != null && state.rekonstrukceDo != null
        ? `Rekonstrukce ${formatCzk(state.rekonstrukceOd)}–${formatCzk(state.rekonstrukceDo)}`
        : state.rekonstrukceDo != null
          ? `Rekonstrukce do ${formatCzk(state.rekonstrukceDo)}`
          : `Rekonstrukce od ${formatCzk(state.rekonstrukceOd!)}`;
    chips.push({
      id: "rekonstrukce",
      label,
      clear: { rekonstrukceOd: undefined, rekonstrukceDo: undefined },
    });
  }
  for (const k of state.kraje) {
    const region = getSearchRegion(k);
    chips.push({
      id: `kraj-${k}`,
      label: region?.short ?? k,
      clear: { kraje: state.kraje.filter((x) => x !== k) },
    });
  }
  if (state.kontext && state.kontext !== "doporucene") {
    const tab = SEARCH_CONTEXT_TABS.find((t) => t.value === state.kontext);
    chips.push({
      id: "kontext",
      label: tab?.label ?? state.kontext,
      clear: { kontext: "doporucene" },
    });
  }
  return chips;
}

function formatMil(czk: number): string {
  if (czk >= 1_000_000) {
    const mil = czk / 1_000_000;
    return `${Number.isInteger(mil) ? mil : mil.toFixed(1)} mil.`;
  }
  return new Intl.NumberFormat("cs-CZ").format(czk);
}

function formatCzk(czk: number): string {
  return `${new Intl.NumberFormat("cs-CZ").format(czk)} Kč`;
}

function formatPct(value: number): string {
  return `${new Intl.NumberFormat("cs-CZ", {
    maximumFractionDigits: 2,
  }).format(value)} %`;
}

/** Map URL state → backend PropertySearchInput (extended UI fields stay client-side). */
export function urlStateToSearchInput(state: PropertyUrlFilterState) {
  const propertyType = state.typ
    .map((t) => TYP_OPTIONS.find((o) => o.value === t)?.propertyType)
    .filter(Boolean) as string[];

  return {
    query: state.q || state.lokalita,
    city: state.lokalita,
    priceMin: state.cenaOd,
    priceMax: state.cenaDo,
    propertyType: propertyType.length ? propertyType : undefined,
    layout: state.dispozice.length ? state.dispozice : undefined,
    usableAreaMin: state.plochaOd,
    usableAreaMax: state.plochaDo,
    landAreaMin: state.pozemekOd,
    landAreaMax: state.pozemekDo,
    condition: state.stav
      .map((s) => STAV_OPTIONS.find((o) => o.value === s)?.condition)
      .filter(Boolean) as string[],
    ownershipType: state.vlastnictvi
      .map((v) => VLASTNICTVI_OPTIONS.find((o) => o.value === v)?.ownership)
      .filter(Boolean) as string[],
    sort: state.razeni ?? "newest",
    page: state.stranka,
  };
}
