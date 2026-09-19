/**
 * Ukázkový katalog pro výpis /nemovitosti.
 * Není to živý trh — slouží k ověření filtrů a štítků.
 */

import { foldDiacritics } from "@/domains/properties/search/text-match";
import type { PropertyUrlFilterState } from "@/domains/properties/search/url-state";
import { CATALOG_DETAIL } from "@/lib/catalog-listing-details";

export type PropertyTransaction = "prodej" | "pronajem";
export type PropertyKind = "byt" | "dum" | "pozemek" | "komerce";
export type ListingPresentation = "premium" | "klasicky";
export type AmenityCategory = "education" | "shopping" | "transport" | "health";

export interface CivicAmenity {
  kategorie: AmenityCategory;
  nazev: string;
  vzdalenost: string;
}

export interface PropertyGps {
  lat: number;
  lng: number;
}

export interface PropertyImages {
  /** Jedna hlavní fotka klasického inzerátu. */
  hlavni?: string;
  /** Premium: stav před úpravou. */
  pred_rekonstrukci?: string;
  /** Premium: stav po homestagingu / rekonstrukci. */
  po_rekonstrukci?: string;
  /** Premium: počet dalších upravených fotek v galerii. */
  pocet_wow_fotek?: number;
}

export interface Property {
  id: number;
  nazev: string;
  typ_transakce: PropertyTransaction;
  typ_nemovitosti: PropertyKind;
  dispozice: string | null;
  lokalita: string;
  cena: number;
  plocha_m2: number;
  stav_inzeratu: ListingPresentation;
  obrazky: PropertyImages;
  /** Delší text inzerátu: stav, okolí, potenciál. Není znalecký posudek. */
  detail_popis: string;
  /** Další fotky mimo hlavní snímek / srovnání před–po. */
  galerie: string[];
  obcanska_vybavenost: CivicAmenity[];
  lokalita_gps: PropertyGps;
  stitky: string[];
  popis_upravy: string;
}

const TYPE_SLUG_TO_KIND: Record<string, PropertyKind> = {
  byt: "byt",
  dum: "dum",
  "dum-na-klic": "dum",
  pozemek: "pozemek",
  komercni: "komerce",
  projekty: "komerce",
};

const catalogSeed: Array<
  Omit<Property, "detail_popis" | "galerie" | "obcanska_vybavenost" | "lokalita_gps">
> = [
  {
    id: 1,
    nazev: "Světlý byt 2+kk blízko metra",
    typ_transakce: "prodej",
    typ_nemovitosti: "byt",
    dispozice: "2+kk",
    lokalita: "Praha 9 - Vysočany",
    cena: 6500000,
    plocha_m2: 54,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1490006388477-9ab871431fb6?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 5,
    },
    stitky: ["Vysoký výnos", "Bez rekonstrukce"],
    popis_upravy:
      "Premium: Profesionální fotky, homestaging, 3D scan a optimalizovaný copywriting pro maximální dosah.",
  },
  {
    id: 2,
    nazev: "Byt 3+1 v původním stavu",
    typ_transakce: "prodej",
    typ_nemovitosti: "byt",
    dispozice: "3+1",
    lokalita: "Ostrava - Poruba",
    cena: 2100000,
    plocha_m2: 72,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1770233447535-d557efaa1550?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Pod tržním odhadem", "Fix & Rent"],
    popis_upravy: "Klasika: Fotky z mobilu, stručný popis od majitele, bez přípravy.",
  },
  {
    id: 3,
    nazev: "Investiční garsonka v centru",
    typ_transakce: "pronajem",
    typ_nemovitosti: "byt",
    dispozice: "1+kk",
    lokalita: "Brno - Střed",
    cena: 12000,
    plocha_m2: 28,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1490006388477-9ab871431fb6?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 4,
    },
    stitky: ["Stabilní pronájem", "Pozitivní cashflow"],
    popis_upravy:
      "Premium: Vyladěný inzerát cílící na studenty a mladé profíky, profi svícení fotek.",
  },
  {
    id: 4,
    nazev: "Pronájem 2+1 s balkonem",
    typ_transakce: "pronajem",
    typ_nemovitosti: "byt",
    dispozice: "2+1",
    lokalita: "Olomouc",
    cena: 14500,
    plocha_m2: 61,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Stabilní pronájem"],
    popis_upravy: "Klasika: Běžný inzerát, prázdné místnosti s horším světlem.",
  },
  {
    id: 5,
    nazev: "Rodinný dům se zahradou",
    typ_transakce: "prodej",
    typ_nemovitosti: "dum",
    dispozice: "4+1",
    lokalita: "Krnov",
    cena: 5200000,
    plocha_m2: 145,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1687255634768-71ca855616c6?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1676578116771-8b5e17e9ce2d?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 6,
    },
    stitky: ["Bez rekonstrukce"],
    popis_upravy: "Premium: Dronové záběry okolí, vyčištěná zahrada, virtuální prohlídka.",
  },
  {
    id: 6,
    nazev: "Starší dům k rekonstrukci",
    typ_transakce: "prodej",
    typ_nemovitosti: "dum",
    dispozice: "5+kk",
    lokalita: "Kladno",
    cena: 3800000,
    plocha_m2: 180,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1676578116771-8b5e17e9ce2d?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Pod tržním odhadem"],
    popis_upravy: "Klasika: Pouze venkovní fotky a pár tmavých fotek interiéru.",
  },
  {
    id: 7,
    nazev: "Luxusní mezonet s výhledem",
    typ_transakce: "prodej",
    typ_nemovitosti: "byt",
    dispozice: "4+kk",
    lokalita: "Praha 2 - Vinohrady",
    cena: 18500000,
    plocha_m2: 130,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1490006388477-9ab871431fb6?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 8,
    },
    stitky: ["Bez rekonstrukce"],
    popis_upravy:
      "Premium: Video prohlídka, prémiový copywriting zdůrazňující lokalitu a materiály.",
  },
  {
    id: 8,
    nazev: "Pronájem moderního domu",
    typ_transakce: "pronajem",
    typ_nemovitosti: "dum",
    dispozice: "5+kk",
    lokalita: "Říčany u Prahy",
    cena: 45000,
    plocha_m2: 160,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1676578116771-8b5e17e9ce2d?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 5,
    },
    stitky: ["Stabilní pronájem"],
    popis_upravy: "Premium: Zaměření na expaty, anglický překlad, perfektní fotky detailů.",
  },
  {
    id: 9,
    nazev: "Byt 1+1 před rekonstrukcí",
    typ_transakce: "prodej",
    typ_nemovitosti: "byt",
    dispozice: "1+1",
    lokalita: "Plzeň - Slovany",
    cena: 2800000,
    plocha_m2: 41,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1490006388477-9ab871431fb6?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Fix & Rent", "Pod tržním odhadem"],
    popis_upravy: "Klasika: Neuklizený byt, osobní věci majitele na fotkách.",
  },
  {
    id: 10,
    nazev: "Prostorný byt 3+kk novostavba",
    typ_transakce: "prodej",
    typ_nemovitosti: "byt",
    dispozice: "3+kk",
    lokalita: "Brno - Královo Pole",
    cena: 8900000,
    plocha_m2: 82,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 3,
    },
    stitky: ["Bez rekonstrukce"],
    popis_upravy: "Premium: Vizualizace možného zařízení pro prázdné novostavby.",
  },
  {
    id: 11,
    nazev: "Stavební pozemek na kraji lesa",
    typ_transakce: "prodej",
    typ_nemovitosti: "pozemek",
    dispozice: null,
    lokalita: "Čeladná",
    cena: 4200000,
    plocha_m2: 1100,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1676578116771-8b5e17e9ce2d?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 7,
    },
    stitky: [],
    popis_upravy:
      "Premium: Zakreslení inženýrských sítí do fotky z dronu, vizualizace možného domu.",
  },
  {
    id: 12,
    nazev: "Komerční prostor pro kavárnu",
    typ_transakce: "pronajem",
    typ_nemovitosti: "komerce",
    dispozice: null,
    lokalita: "Ostrava - Centrum",
    cena: 25000,
    plocha_m2: 85,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Vysoký výnos"],
    popis_upravy: "Klasika: Strohý text, fotky prázdného zaprášeného prostoru.",
  },
  {
    id: 13,
    nazev: "Menší dům v řadové zástavbě",
    typ_transakce: "pronajem",
    typ_nemovitosti: "dum",
    dispozice: "3+kk",
    lokalita: "Pardubice",
    cena: 22000,
    plocha_m2: 95,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1687255634768-71ca855616c6?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Stabilní pronájem"],
    popis_upravy: "Klasika: Běžný popis, fotky za špatného počasí.",
  },
  {
    id: 14,
    nazev: "Apartmán na horách",
    typ_transakce: "prodej",
    typ_nemovitosti: "byt",
    dispozice: "2+kk",
    lokalita: "Špindlerův Mlýn",
    cena: 11500000,
    plocha_m2: 52,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 6,
    },
    stitky: ["Vysoký výnos", "Pozitivní cashflow", "Bez rekonstrukce"],
    popis_upravy:
      "Premium: Lifestyle fotky, detailní kalkulace ROI pro krátkodobé pronájmy v textu.",
  },
  {
    id: 15,
    nazev: "Chata u přehrady",
    typ_transakce: "prodej",
    typ_nemovitosti: "dum",
    dispozice: "2+1",
    lokalita: "Lipno nad Vltavou",
    cena: 6800000,
    plocha_m2: 70,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 4,
    },
    stitky: ["Vysoký výnos"],
    popis_upravy:
      "Premium: Dron s ukázkou vzdálenosti k vodě, zútulnění interiéru před focením.",
  },
  {
    id: 16,
    nazev: "Sdílený pokoj pro studenty",
    typ_transakce: "pronajem",
    typ_nemovitosti: "byt",
    dispozice: "4+1",
    lokalita: "Praha 6 - Dejvice",
    cena: 8000,
    plocha_m2: 15,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Stabilní pronájem"],
    popis_upravy: "Klasika: Rychlá fotka na mobil, inzerát formou inzerce na Facebooku.",
  },
  {
    id: 17,
    nazev: "Skladovací hala",
    typ_transakce: "pronajem",
    typ_nemovitosti: "komerce",
    dispozice: null,
    lokalita: "Brno - Slatina",
    cena: 85000,
    plocha_m2: 450,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 5,
    },
    stitky: ["Stabilní pronájem"],
    popis_upravy: "Premium: 3D model haly, přesně kótovaný plánek, logistická dostupnost v textu.",
  },
  {
    id: 18,
    nazev: "Zemědělská půda",
    typ_transakce: "prodej",
    typ_nemovitosti: "pozemek",
    dispozice: null,
    lokalita: "Znojmo (okolí)",
    cena: 1500000,
    plocha_m2: 25000,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=70",
    },
    stitky: [],
    popis_upravy: "Klasika: Jen screen z katastrální mapy.",
  },
  {
    id: 19,
    nazev: "Byt 4+1 ideální na spolubydlení",
    typ_transakce: "pronajem",
    typ_nemovitosti: "byt",
    dispozice: "4+1",
    lokalita: "Hradec Králové",
    cena: 24000,
    plocha_m2: 88,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1770233447535-d557efaa1550?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 7,
    },
    stitky: ["Vysoký výnos", "Pozitivní cashflow"],
    popis_upravy: "Premium: Natočené Reels/TikTok video pro cílovou skupinu studentů.",
  },
  {
    id: 20,
    nazev: "Dům v insolvenci",
    typ_transakce: "prodej",
    typ_nemovitosti: "dum",
    dispozice: "4+kk",
    lokalita: "Teplice",
    cena: 2900000,
    plocha_m2: 110,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1676578116771-8b5e17e9ce2d?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Pod tržním odhadem", "Fix & Rent"],
    popis_upravy: "Klasika: Těžko čitelné fotky, strohé právní informace.",
  },
];

export const mockProperties: Property[] = catalogSeed.map((item) => {
  const extra = CATALOG_DETAIL[item.id];
  if (!extra) {
    throw new Error(`Chybí detail ukázkového inzerátu ${item.id}`);
  }
  return { ...item, ...extra };
});

const CATALOG_SLUG_PREFIX = "ukazka-";

export function catalogPropertyHref(id: number): string {
  return `/nemovitosti/${CATALOG_SLUG_PREFIX}${id}`;
}

export function findCatalogPropertyBySlug(slug: string): Property | undefined {
  const match = new RegExp(`^${CATALOG_SLUG_PREFIX}(\\d+)$`).exec(slug);
  if (!match) return undefined;
  const id = Number(match[1]);
  return mockProperties.find((item) => item.id === id);
}

function includesText(haystack: string, needle: string | undefined): boolean {
  if (!needle) return true;
  return foldDiacritics(haystack).includes(foldDiacritics(needle));
}

/**
 * Keeps a listing only when every active filter matches.
 * A selected štítek must appear in `stitky` — missing tags do not pass.
 */
export function filterProperties(
  items: readonly Property[],
  state: PropertyUrlFilterState,
): Property[] {
  const text = state.q || state.lokalita;
  const kinds = new Set(
    state.typ
      .map((slug) => TYPE_SLUG_TO_KIND[slug])
      .filter((kind): kind is PropertyKind => Boolean(kind)),
  );
  const layouts = new Set(state.dispozice.map((value) => value.toLowerCase()));
  const tags = state.stitky ?? [];

  return items.filter((property) => {
    if (text) {
      const blob = `${property.nazev} ${property.lokalita}`;
      if (!includesText(blob, text)) return false;
    }
    if (state.nabidka === "prodej" && property.typ_transakce !== "prodej") return false;
    if (state.nabidka === "pronajem" && property.typ_transakce !== "pronajem") return false;
    if (state.nabidka === "drazba" || state.nabidka === "podil") return false;
    if (kinds.size > 0 && !kinds.has(property.typ_nemovitosti)) return false;
    if (layouts.size > 0) {
      if (!property.dispozice) return false;
      if (!layouts.has(property.dispozice.toLowerCase())) return false;
    }
    if (state.cenaOd != null && property.cena < state.cenaOd) return false;
    if (state.cenaDo != null && property.cena > state.cenaDo) return false;
    if (state.plochaOd != null && property.plocha_m2 < state.plochaOd) return false;
    if (state.plochaDo != null && property.plocha_m2 > state.plochaDo) return false;
    if (state.pozemekOd != null || state.pozemekDo != null) {
      if (property.typ_nemovitosti !== "pozemek") return false;
      if (state.pozemekOd != null && property.plocha_m2 < state.pozemekOd) return false;
      if (state.pozemekDo != null && property.plocha_m2 > state.pozemekDo) return false;
    }
    if (tags.length > 0 && !tags.every((tag) => property.stitky.includes(tag))) {
      return false;
    }
    return true;
  });
}
