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
  /** Dispozice bytů v sekci Nabídka. */
  dispozice: string[];
  /** Dispozice bytů v sekci Poptávka. */
  dispozicePoptavka: string[];
  /** Typ domu v sekci Nabídka. */
  typDomu: string[];
  /** Typ domu v sekci Poptávka. */
  typDomuPoptavka: string[];
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
  /** Offer channel. Dražba and podíl are stored but not applied until a source exists. */
  nabidka?: "prodej" | "pronajem" | "drazba" | "podil";
  cenaM2Od?: number;
  cenaM2Do?: number;
  plochaCelkovaOd?: number;
  plochaCelkovaDo?: number;
  /** Stored for a future map radius. Not applied until a centre point exists. */
  radiusKm?: number;
  typStavby: string[];
  prislusenstvi: string[];
  vybaveni?: "vybaveno" | "castecne" | "nevybaveno";
  patroOd?: number;
  patroDo?: number;
  posledniPatro?: boolean;
  prizemi?: boolean;
  rokOd?: number;
  rokDo?: number;
  rokRekonstrukceOd?: number;
  rokRekonstrukceDo?: number;
  ihned?: boolean;
  pouzeNove?: boolean;
  pouzeZlevnene?: boolean;
  bezRezervovanych?: boolean;
  bezCenyNaVyzadani?: boolean;
  prodejce: string[];
  najemOd?: number;
  najemDo?: number;
  najemM2Od?: number;
  najemM2Do?: number;
  vynosDo?: number;
  cistyVynosOd?: number;
  cistyVynosDo?: number;
  cashflowDo?: number;
  cocOd?: number;
  cocDo?: number;
  navratnostOd?: number;
  navratnostDo?: number;
  urovenRekonstrukce: string[];
  vynosPoRekonstrukci?: number;
  allInOd?: number;
  allInDo?: number;
  diskontOd?: number;
  poptavkaOd?: number;
  poptavkaDo?: number;
  obsazenostOd?: number;
  obsazenostDo?: number;
  riziko: string[];
  scoreOd?: number;
  scoreDo?: number;
  duveraOd?: number;
  /** When true, listings without a calculated investment snapshot are hidden. */
  jenVypoctene?: boolean;
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
  dispozicePoptavka: [],
  typDomu: [],
  typDomuPoptavka: [],
  stav: [],
  vlastnictvi: [],
  energie: [],
  strategie: [],
  kvalita: [],
  kraje: [],
  typStavby: [],
  prislusenstvi: [],
  prodejce: [],
  urovenRekonstrukce: [],
  riziko: [],
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
  rent_desc: "najem-sestupne",
  gross_yield_desc: "hruby-vynos",
  net_yield_desc: "cisty-vynos",
  cashflow_desc: "cashflow",
  cash_on_cash_desc: "cash-on-cash",
  payback_asc: "navratnost",
  tenant_demand_desc: "poptavka",
  occupancy_desc: "obsazenost",
  renovation_asc: "rekonstrukce-nejnizsi",
  discount_desc: "diskont",
  majetio_score_desc: "majetio-score",
};

const URL_TO_SORT: Record<string, SearchSortPreset> = Object.fromEntries(
  Object.entries(SORT_TO_URL).map(([k, v]) => [v, k as SearchSortPreset]),
) as Record<string, SearchSortPreset>;

export const TYP_OPTIONS = [
  { value: "byt", label: "Byt", propertyType: "APARTMENT" },
  { value: "dum", label: "Rodinný dům", propertyType: "HOUSE" },
  { value: "dum-na-klic", label: "Domy na klíč", propertyType: "HOUSE" },
  { value: "vila", label: "Vila", propertyType: "VILLA" },
  { value: "cinzovni", label: "Činžovní dům", propertyType: "TOWNHOUSE" },
  { value: "pozemek", label: "Pozemek", propertyType: "LAND" },
  { value: "komercni", label: "Komerční", propertyType: "COMMERCIAL" },
  { value: "projekty", label: "Developerský projekt", propertyType: "COMMERCIAL" },
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
  "5+1",
  "6plus",
  "atypicky",
] as const;

export const STAV_OPTIONS = [
  { value: "new", label: "Novostavba", condition: "NEW" },
  { value: "excellent", label: "Velmi dobrý", condition: "EXCELLENT" },
  { value: "good", label: "Dobrý", condition: "GOOD" },
  { value: "average", label: "Průměrný", condition: "AVERAGE" },
  { value: "rekonstrukce", label: "Před rekonstrukcí", condition: "NEEDS_RENOVATION" },
  { value: "demolice", label: "K demolici", condition: "SHELL" },
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
  { value: "nejnovejsi" as const, label: "Nejnovější", sort: "newest" as const },
  { value: "cena-vzestupne" as const, label: "Nejlevnější", sort: "price_asc" as const },
  { value: "cena-sestupne" as const, label: "Nejdražší", sort: "price_desc" as const },
  { value: "cena-m2-vzestupne" as const, label: "Cena/m² nejnižší", sort: "price_per_sqm_asc" as const },
  { value: "cena-m2" as const, label: "Cena/m² nejvyšší", sort: "price_per_sqm" as const },
  { value: "najem-sestupne" as const, label: "Nejvyšší odhadované nájemné", sort: "rent_desc" as const },
  { value: "hruby-vynos" as const, label: "Nejvyšší hrubý výnos", sort: "gross_yield_desc" as const },
  { value: "cisty-vynos" as const, label: "Nejvyšší čistý výnos", sort: "net_yield_desc" as const },
  { value: "cashflow" as const, label: "Nejvyšší cashflow", sort: "cashflow_desc" as const },
  { value: "cash-on-cash" as const, label: "Nejvyšší cash-on-cash", sort: "cash_on_cash_desc" as const },
  { value: "navratnost" as const, label: "Nejkratší návratnost", sort: "payback_asc" as const },
  { value: "poptavka" as const, label: "Nejvyšší poptávka nájemníků", sort: "tenant_demand_desc" as const },
  { value: "obsazenost" as const, label: "Nejvyšší odhadovaná obsazenost", sort: "occupancy_desc" as const },
  { value: "rekonstrukce-nejnizsi" as const, label: "Nejnižší náklady na rekonstrukci", sort: "renovation_asc" as const },
  { value: "diskont" as const, label: "Největší diskont vůči odhadu", sort: "discount_desc" as const },
  { value: "majetio-score" as const, label: "Nejvyšší Majetio Score", sort: "majetio_score_desc" as const },
  { value: "doporucene" as const, label: "Doporučené", sort: "recommended" as const },
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
  const n = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function signedNum(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function flag(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  if (value === "1" || value === "true" || value === "ano") return true;
  return undefined;
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
    dispozicePoptavka: list(params["dispozice-poptavka"]).map(normalizeDisposition),
    typDomu: list(params["typ-domu"]).filter((id) => DUM_TYPE_IDS.has(id)),
    typDomuPoptavka: list(params["typ-domu-poptavka"]).filter((id) =>
      DUM_TYPE_IDS.has(id),
    ),
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
    rekonstrukceOd: num(first(params["rekonstrukce-od"])),
    rekonstrukceDo: num(first(params["rekonstrukce-do"])),
    kraje: list(params.kraje).filter((id) =>
      (SEARCH_REGION_IDS as readonly string[]).includes(id),
    ),
    nabidka: parseOffer(first(params.nabidka)),
    cenaM2Od: num(first(params["cena-m2-od"])),
    cenaM2Do: num(first(params["cena-m2-do"])),
    plochaCelkovaOd: num(first(params["plocha-celkova-od"])),
    plochaCelkovaDo: num(first(params["plocha-celkova-do"])),
    radiusKm: num(first(params.radius)),
    typStavby: list(params["typ-stavby"]),
    prislusenstvi: list(params.prislusenstvi),
    vybaveni: parseFurnishing(first(params.vybaveni)),
    patroOd: num(first(params["patro-od"])),
    patroDo: num(first(params["patro-do"])),
    posledniPatro: flag(first(params["posledni-patro"])),
    prizemi: flag(first(params.prizemi)),
    rokOd: num(first(params["rok-od"])),
    rokDo: num(first(params["rok-do"])),
    rokRekonstrukceOd: num(first(params["rok-rekonstrukce-od"])),
    rokRekonstrukceDo: num(first(params["rok-rekonstrukce-do"])),
    ihned: flag(first(params.ihned)),
    pouzeNove: flag(first(params["pouze-nove"])),
    pouzeZlevnene: flag(first(params.zlevnene)),
    bezRezervovanych: flag(first(params["bez-rezervace"])),
    bezCenyNaVyzadani: flag(first(params["s-cenou"])),
    prodejce: list(params.prodejce),
    najemOd: num(first(params["najem-od"])),
    najemDo: num(first(params["najem-do"])),
    najemM2Od: num(first(params["najem-m2-od"])),
    najemM2Do: num(first(params["najem-m2-do"])),
    vynosDo: num(first(params["vynos-do"])),
    cistyVynosOd: num(first(params["cisty-vynos-od"])),
    cistyVynosDo: num(first(params["cisty-vynos-do"])),
    cashflowOd: signedNum(first(params["cashflow-od"])),
    cashflowDo: signedNum(first(params["cashflow-do"])),
    cocOd: num(first(params["coc-od"])),
    cocDo: num(first(params["coc-do"])),
    navratnostOd: num(first(params["navratnost-od"])),
    navratnostDo: num(first(params["navratnost-do"])),
    urovenRekonstrukce: list(params["uroven-rekonstrukce"]),
    vynosPoRekonstrukci: num(first(params["vynos-po-rekonstrukci"])),
    allInOd: num(first(params["all-in-od"])),
    allInDo: num(first(params["all-in-do"])),
    diskontOd: num(first(params["diskont-od"])),
    poptavkaOd: num(first(params["poptavka-od"])),
    poptavkaDo: num(first(params["poptavka-do"])),
    obsazenostOd: num(first(params["obsazenost-od"])),
    obsazenostDo: num(first(params["obsazenost-do"])),
    riziko: list(params.riziko),
    scoreOd: num(first(params["score-od"])),
    scoreDo: num(first(params["score-do"])),
    duveraOd: num(first(params["duvera-od"])),
    jenVypoctene: flag(first(params["jen-vypoctene"])),
    kontext: parseContextTab(first(params.kontext)),
    stranka: page,
    cenovaHladina: first(params["cenova-hladina"]),
    vynosVsBenchmark: first(params["vynos-benchmark"]),
    cenovyTrend: first(params["cenovy-trend"]),
  };
}

const DUM_TYPE_IDS = new Set([
  "rodinny",
  "vila",
  "chalupa",
  "chata",
  "pamatka",
]);

function normalizeDisposition(value: string): string {
  const folded = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
  if (folded === "5+" || folded === "5plus" || folded === "5avice") return "5plus";
  if (folded === "6+" || folded === "6plus") return "6plus";
  if (folded === "atypicky") return "atypicky";
  if (/^\d\+kk$/.test(folded) || /^\d\+\d$/.test(folded)) return folded;
  if (/^\dkk$/.test(folded)) return `${folded[0]}+kk`;
  return folded;
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

function parseOffer(
  raw: string | undefined,
): PropertyUrlFilterState["nabidka"] {
  if (raw === "prodej" || raw === "pronajem" || raw === "drazba" || raw === "podil") {
    return raw;
  }
  return undefined;
}

function parseFurnishing(
  raw: string | undefined,
): PropertyUrlFilterState["vybaveni"] {
  if (raw === "vybaveno" || raw === "castecne" || raw === "nevybaveno") return raw;
  return undefined;
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
  if (state.dispozicePoptavka.length) {
    out["dispozice-poptavka"] = state.dispozicePoptavka.join(",");
  }
  if (state.typDomu.length) out["typ-domu"] = state.typDomu.join(",");
  if (state.typDomuPoptavka.length) {
    out["typ-domu-poptavka"] = state.typDomuPoptavka.join(",");
  }
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
  if (state.nabidka) out.nabidka = state.nabidka;
  if (state.cenaM2Od != null) out["cena-m2-od"] = String(state.cenaM2Od);
  if (state.cenaM2Do != null) out["cena-m2-do"] = String(state.cenaM2Do);
  if (state.plochaCelkovaOd != null) out["plocha-celkova-od"] = String(state.plochaCelkovaOd);
  if (state.plochaCelkovaDo != null) out["plocha-celkova-do"] = String(state.plochaCelkovaDo);
  if (state.radiusKm != null) out.radius = String(state.radiusKm);
  if (state.typStavby.length) out["typ-stavby"] = state.typStavby.join(",");
  if (state.prislusenstvi.length) out.prislusenstvi = state.prislusenstvi.join(",");
  if (state.vybaveni) out.vybaveni = state.vybaveni;
  if (state.patroOd != null) out["patro-od"] = String(state.patroOd);
  if (state.patroDo != null) out["patro-do"] = String(state.patroDo);
  if (state.posledniPatro) out["posledni-patro"] = "1";
  if (state.prizemi) out.prizemi = "1";
  if (state.rokOd != null) out["rok-od"] = String(state.rokOd);
  if (state.rokDo != null) out["rok-do"] = String(state.rokDo);
  if (state.rokRekonstrukceOd != null) out["rok-rekonstrukce-od"] = String(state.rokRekonstrukceOd);
  if (state.rokRekonstrukceDo != null) out["rok-rekonstrukce-do"] = String(state.rokRekonstrukceDo);
  if (state.ihned) out.ihned = "1";
  if (state.pouzeNove) out["pouze-nove"] = "1";
  if (state.pouzeZlevnene) out.zlevnene = "1";
  if (state.bezRezervovanych) out["bez-rezervace"] = "1";
  if (state.bezCenyNaVyzadani) out["s-cenou"] = "1";
  if (state.prodejce.length) out.prodejce = state.prodejce.join(",");
  if (state.najemOd != null) out["najem-od"] = String(state.najemOd);
  if (state.najemDo != null) out["najem-do"] = String(state.najemDo);
  if (state.najemM2Od != null) out["najem-m2-od"] = String(state.najemM2Od);
  if (state.najemM2Do != null) out["najem-m2-do"] = String(state.najemM2Do);
  if (state.vynosDo != null) out["vynos-do"] = String(state.vynosDo);
  if (state.cistyVynosOd != null) out["cisty-vynos-od"] = String(state.cistyVynosOd);
  if (state.cistyVynosDo != null) out["cisty-vynos-do"] = String(state.cistyVynosDo);
  if (state.cashflowDo != null) out["cashflow-do"] = String(state.cashflowDo);
  if (state.cocOd != null) out["coc-od"] = String(state.cocOd);
  if (state.cocDo != null) out["coc-do"] = String(state.cocDo);
  if (state.navratnostOd != null) out["navratnost-od"] = String(state.navratnostOd);
  if (state.navratnostDo != null) out["navratnost-do"] = String(state.navratnostDo);
  if (state.urovenRekonstrukce.length) {
    out["uroven-rekonstrukce"] = state.urovenRekonstrukce.join(",");
  }
  if (state.vynosPoRekonstrukci != null) {
    out["vynos-po-rekonstrukci"] = String(state.vynosPoRekonstrukci);
  }
  if (state.allInOd != null) out["all-in-od"] = String(state.allInOd);
  if (state.allInDo != null) out["all-in-do"] = String(state.allInDo);
  if (state.diskontOd != null) out["diskont-od"] = String(state.diskontOd);
  if (state.poptavkaOd != null) out["poptavka-od"] = String(state.poptavkaOd);
  if (state.poptavkaDo != null) out["poptavka-do"] = String(state.poptavkaDo);
  if (state.obsazenostOd != null) out["obsazenost-od"] = String(state.obsazenostOd);
  if (state.obsazenostDo != null) out["obsazenost-do"] = String(state.obsazenostDo);
  if (state.riziko.length) out.riziko = state.riziko.join(",");
  if (state.scoreOd != null) out["score-od"] = String(state.scoreOd);
  if (state.scoreDo != null) out["score-do"] = String(state.scoreDo);
  if (state.duveraOd != null) out["duvera-od"] = String(state.duveraOd);
  if (state.jenVypoctene) out["jen-vypoctene"] = "1";
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
  n += state.dispozicePoptavka.length;
  n += state.typDomu.length;
  n += state.typDomuPoptavka.length;
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
  if (state.nabidka) n += 1;
  if (state.cenaM2Od != null || state.cenaM2Do != null) n += 1;
  if (state.plochaCelkovaOd != null || state.plochaCelkovaDo != null) n += 1;
  if (state.radiusKm != null) n += 1;
  n += state.typStavby.length;
  n += state.prislusenstvi.length;
  if (state.vybaveni) n += 1;
  if (state.patroOd != null || state.patroDo != null) n += 1;
  if (state.posledniPatro) n += 1;
  if (state.prizemi) n += 1;
  if (state.rokOd != null || state.rokDo != null) n += 1;
  if (state.rokRekonstrukceOd != null || state.rokRekonstrukceDo != null) n += 1;
  if (state.ihned) n += 1;
  if (state.pouzeNove) n += 1;
  if (state.pouzeZlevnene) n += 1;
  if (state.bezRezervovanych) n += 1;
  if (state.bezCenyNaVyzadani) n += 1;
  n += state.prodejce.length;
  if (state.najemOd != null || state.najemDo != null) n += 1;
  if (state.najemM2Od != null || state.najemM2Do != null) n += 1;
  if (state.vynosDo != null) n += 1;
  if (state.cistyVynosOd != null || state.cistyVynosDo != null) n += 1;
  if (state.cashflowDo != null) n += 1;
  if (state.cocOd != null || state.cocDo != null) n += 1;
  if (state.navratnostOd != null || state.navratnostDo != null) n += 1;
  n += state.urovenRekonstrukce.length;
  if (state.vynosPoRekonstrukci != null) n += 1;
  if (state.allInOd != null || state.allInDo != null) n += 1;
  if (state.diskontOd != null) n += 1;
  if (state.poptavkaOd != null || state.poptavkaDo != null) n += 1;
  if (state.obsazenostOd != null || state.obsazenostDo != null) n += 1;
  n += state.riziko.length;
  if (state.scoreOd != null || state.scoreDo != null) n += 1;
  if (state.duveraOd != null) n += 1;
  if (state.jenVypoctene) n += 1;
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
      label: `Byt: ${layoutLabel(d)}`,
      clear: { dispozice: state.dispozice.filter((x) => x !== d) },
    });
  }
  for (const d of state.dispozicePoptavka) {
    chips.push({
      id: `disp-p-${d}`,
      label: `Poptávka byt: ${layoutLabel(d)}`,
      clear: {
        dispozicePoptavka: state.dispozicePoptavka.filter((x) => x !== d),
      },
    });
  }
  for (const d of state.typDomu) {
    chips.push({
      id: `dum-${d}`,
      label: `Dům: ${houseLabel(d)}`,
      clear: { typDomu: state.typDomu.filter((x) => x !== d) },
    });
  }
  for (const d of state.typDomuPoptavka) {
    chips.push({
      id: `dum-p-${d}`,
      label: `Poptávka dům: ${houseLabel(d)}`,
      clear: { typDomuPoptavka: state.typDomuPoptavka.filter((x) => x !== d) },
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
  if (state.nabidka) {
    const labels = {
      prodej: "Prodej",
      pronajem: "Pronájem",
      drazba: "Dražba",
      podil: "Podíl",
    } as const;
    chips.push({
      id: "nabidka",
      label: labels[state.nabidka],
      clear: { nabidka: undefined },
    });
  }
  if (state.roiOd != null) {
    chips.push({
      id: "roi",
      label: `Výnos ${formatPct(state.roiOd)}+`,
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
  if (state.jenVypoctene) {
    chips.push({
      id: "jen-vypoctene",
      label: "Jen s investičními daty",
      clear: { jenVypoctene: undefined },
    });
  }
  if (state.diskontOd != null) {
    chips.push({
      id: "diskont",
      label: `${formatPct(state.diskontOd)} pod odhadem`,
      clear: { diskontOd: undefined },
    });
  }
  if (state.poptavkaOd != null) {
    chips.push({
      id: "poptavka",
      label: `Poptávka ${state.poptavkaOd}+`,
      clear: { poptavkaOd: undefined },
    });
  }
  if (state.scoreOd != null) {
    chips.push({
      id: "score",
      label: `Majetio Score ${state.scoreOd}+`,
      clear: { scoreOd: undefined },
    });
  }
  if (state.cistyVynosOd != null) {
    chips.push({
      id: "cisty",
      label: `Čistý výnos ${formatPct(state.cistyVynosOd)}+`,
      clear: { cistyVynosOd: undefined },
    });
  }
  if (state.navratnostDo != null) {
    chips.push({
      id: "navratnost",
      label: `Návratnost do ${state.navratnostDo} let`,
      clear: { navratnostOd: undefined, navratnostDo: undefined },
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

function layoutLabel(value: string): string {
  if (value === "5plus") return "5+ a více";
  if (value === "6plus") return "6+";
  if (value === "atypicky") return "Atypický";
  return value;
}

function houseLabel(value: string): string {
  const labels: Record<string, string> = {
    rodinny: "Rodinný",
    vila: "Vila",
    chalupa: "Chalupa",
    chata: "Chata",
    pamatka: "Památka",
  };
  return labels[value] ?? value;
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
const CONSTRUCTION_TO_ENUM: Record<string, string> = {
  cihla: "BRICK",
  panel: "PANEL",
  drevo: "WOOD",
  skelet: "STEEL",
  smisena: "MIXED",
  ostatni: "OTHER",
};

const AMENITY_TO_FIELD: Record<string, string> = {
  balkon: "balcony",
  lodzie: "loggia",
  terasa: "terrace",
  zahrada: "garden",
  sklep: "cellar",
  garaz: "garage",
  parkovani: "parking",
  vytah: "elevator",
  bezbarierovy: "barrierFree",
};

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
    transactionType:
      state.nabidka === "prodej"
        ? "SALE"
        : state.nabidka === "pronajem"
          ? "RENT"
          : undefined,
    pricePerSqmMin: state.cenaM2Od,
    pricePerSqmMax: state.cenaM2Do,
    floorAreaMin: state.plochaCelkovaOd,
    floorAreaMax: state.plochaCelkovaDo,
    energyRating: state.energie.length ? state.energie : undefined,
    constructionType: state.typStavby
      .map((value) => CONSTRUCTION_TO_ENUM[value])
      .filter((value): value is string => Boolean(value)),
    amenities: state.prislusenstvi
      .map((value) => AMENITY_TO_FIELD[value])
      .filter((value): value is string => Boolean(value)),
    floorMin: state.patroOd,
    floorMax: state.patroDo,
    groundFloor: state.prizemi,
    topFloor: state.posledniPatro,
    yearBuiltMin: state.rokOd,
    yearBuiltMax: state.rokDo,
    yearRenovatedMin: state.rokRekonstrukceOd,
    yearRenovatedMax: state.rokRekonstrukceDo,
    isOffPlan: state.typ.includes("projekty") ? true : undefined,
    privateSeller: state.prodejce.includes("soukromnik") ? true : undefined,
    listingOwnerKind: state.prodejce.includes("rk")
      ? ["AGENT", "AGENCY"]
      : state.prodejce.includes("developer")
        ? ["DEVELOPER"]
        : undefined,
    requirePrice: state.bezCenyNaVyzadani,
    grossYieldMin: state.roiOd,
    grossYieldMax: state.vynosDo,
    netYieldMin: state.cistyVynosOd,
    netYieldMax: state.cistyVynosDo,
    cashflowMin: state.cashflowOd,
    cashflowMax: state.cashflowDo,
    cashOnCashMin: state.cocOd,
    cashOnCashMax: state.cocDo,
    paybackYearsMin: state.navratnostOd,
    paybackYearsMax: state.navratnostDo,
    rentEstimateMin: state.najemOd,
    rentEstimateMax: state.najemDo,
    rentPerSqmMin: state.najemM2Od,
    rentPerSqmMax: state.najemM2Do,
    renovationCostMin: state.rekonstrukceOd,
    renovationCostMax: state.rekonstrukceDo,
    renovationLevel: state.urovenRekonstrukce.length
      ? state.urovenRekonstrukce
      : undefined,
    yieldAfterRenovationMin: state.vynosPoRekonstrukci,
    allInCostMin: state.allInOd,
    allInCostMax: state.allInDo,
    discountMin: state.diskontOd,
    tenantDemandMin: state.poptavkaOd,
    tenantDemandMax: state.poptavkaDo,
    occupancyMin: state.obsazenostOd,
    occupancyMax: state.obsazenostDo,
    investmentRisk: state.riziko.length ? state.riziko : undefined,
    majetioScoreMin: state.scoreOd,
    majetioScoreMax: state.scoreDo,
    dataConfidenceMin: state.duveraOd,
    onlyComputedInvestment: state.jenVypoctene,
  };
}

function asStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

/** Fill missing arrays so saved searches and partial patches stay valid. */
export function normalizeFilterState(
  state: Partial<PropertyUrlFilterState>,
): PropertyUrlFilterState {
  return {
    ...EMPTY_PROPERTY_URL_STATE,
    ...state,
    typ: asStrings(state.typ),
    typPoptavka: asStrings(state.typPoptavka),
    dispozice: asStrings(state.dispozice),
    dispozicePoptavka: asStrings(state.dispozicePoptavka),
    typDomu: asStrings(state.typDomu),
    typDomuPoptavka: asStrings(state.typDomuPoptavka),
    stav: asStrings(state.stav),
    vlastnictvi: asStrings(state.vlastnictvi),
    energie: asStrings(state.energie),
    strategie: asStrings(state.strategie),
    kvalita: asStrings(state.kvalita),
    kraje: asStrings(state.kraje),
    typStavby: asStrings(state.typStavby),
    prislusenstvi: asStrings(state.prislusenstvi),
    prodejce: asStrings(state.prodejce),
    urovenRekonstrukce: asStrings(state.urovenRekonstrukce),
    riziko: asStrings(state.riziko),
    stranka: state.stranka && state.stranka > 0 ? Math.floor(state.stranka) : 1,
  };
}
