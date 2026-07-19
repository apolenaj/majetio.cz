/**
 * UI-only context overlays for property detail (Prompt 9 Part 4).
 * Risks, location benchmarks, similar alternatives, market timing extras.
 * Never invent zeros — omit slug or leave null when unavailable.
 */

import type { RiskLevel } from "@/components/ui/badge";

export type RiskSeverity = Extract<
  RiskLevel,
  "critical" | "high" | "medium" | "low"
>;

export type PropertyRiskItem = {
  id: string;
  title: string;
  severity: RiskSeverity;
  text: string;
};

export type DueDiligenceStatus = "unverified" | "partial" | "verified";

export type VerifyChecklistItem = {
  id: string;
  label: string;
  hint?: string;
};

export type LocationBenchmarkDemo = {
  propertyPricePerSqmCzk: number | null;
  localAvgPricePerSqmCzk: number | null;
  /** Precomputed % difference vs local avg; null if either price missing */
  diffPct: number | null;
  rentIndexPct: number | null;
  priceTrendPct: number | null;
  commuteMinutes: number | null;
  vacancyNote: string | null;
  districtLabel: string | null;
};

export type MarketTimingDemo = {
  /** Override days on market; null → derive from publishedAt */
  daysOnMarket: number | null;
  relisted: boolean;
  relistNote: string | null;
};

export type SimilarAlternativeDemo = {
  slug: string;
  reason: string;
};

export type PropertyContextDemo = {
  slug: string;
  isDemo: true;
  risks: PropertyRiskItem[];
  checklist: VerifyChecklistItem[];
  dueDiligenceStatus: DueDiligenceStatus;
  dueDiligenceNote: string;
  location: LocationBenchmarkDemo | null;
  market: MarketTimingDemo | null;
  similar: SimilarAlternativeDemo[];
};

const VINOHRADY: PropertyContextDemo = {
  slug: "demo-byt-3kk-vinohrady",
  isDemo: true,
  risks: [
    {
      id: "price-above",
      title: "Cena nad středem odhadu",
      severity: "medium",
      text: "Nabídková cena je nad demonstračním středním odhadem — ověřte prostor pro slevu.",
    },
    {
      id: "area-conflict",
      title: "Konflikt v ploše mezi zdroji",
      severity: "medium",
      text: "Zdroje uvádějí rozdílnou plochu (72–74 m²). Před rozhodnutím ověřte katastr / výpis.",
    },
    {
      id: "svj",
      title: "SVJ a fond oprav neověřen",
      severity: "high",
      text: "Výše fondu oprav a plánované investice domu nejsou v datech ověřené.",
    },
  ],
  checklist: [
    { id: "svj", label: "SVJ — stanovy, zápisy, výše fondu oprav", hint: "Vyžádejte poslední zápis" },
    { id: "burdens", label: "Věcná břemena a zástavy v katastru" },
    { id: "energy", label: "PENB a skutečná spotřeba energií" },
    { id: "building", label: "Stav společných částí a plánované rekonstrukce domu" },
    { id: "rent", label: "Realističnost nájmu oproti lokálním inzerátům" },
  ],
  dueDiligenceStatus: "partial",
  dueDiligenceNote:
    "Částečně ověřeno: cena a lokalita z demonstračních zdrojů. SVJ, břemena a stavební stav nejsou ověřené.",
  location: {
    propertyPricePerSqmCzk: 87_703,
    localAvgPricePerSqmCzk: 84_200,
    diffPct: 4.2,
    rentIndexPct: 4.2,
    priceTrendPct: 3.8,
    commuteMinutes: 18,
    vacancyNote: "Orientační neobsazenost (demo): nízká",
    districtLabel: "Vinohrady",
  },
  market: {
    daysOnMarket: 20,
    relisted: true,
    relistNote: "Nabídka byla znovu zveřejněna po krátkém stažení (demo).",
  },
  similar: [
    {
      slug: "demo-byt-2kk-brno",
      reason: "Vyšší cash flow v demonstračním modelu",
    },
    {
      slug: "demo-byt-2kk-nizka-cena",
      reason: "Nižší vstupní cena (vyšší riziko dat)",
    },
    {
      slug: "demo-dum-rekonstrukce",
      reason: "Jiná strategie — rekonstrukční potenciál",
    },
  ],
};

const BRNO: PropertyContextDemo = {
  slug: "demo-byt-2kk-brno",
  isDemo: true,
  risks: [
    {
      id: "size",
      title: "Menší dispozice",
      severity: "low",
      text: "2+kk omezuje cílovou skupinu nájemců i vlastní bydlení pro větší domácnost.",
    },
    {
      id: "approx",
      title: "Přibližná lokalizace",
      severity: "medium",
      text: "Adresa je APPROXIMATE — mapa ukazuje bublinu čtvrti, ne přesný dům.",
    },
  ],
  checklist: [
    { id: "svj", label: "SVJ a fond oprav" },
    { id: "burdens", label: "Věcná břemena v katastru" },
    { id: "noise", label: "Hluk a doprava v lokalitě (prohlídka)" },
    { id: "rent", label: "Srovnání nájmu s lokálními nabídkami" },
  ],
  dueDiligenceStatus: "partial",
  dueDiligenceNote:
    "Částečně ověřeno z demonstračních zdrojů. Právní a stavební due diligence chybí.",
  location: {
    propertyPricePerSqmCzk: 80_769,
    localAvgPricePerSqmCzk: 78_500,
    diffPct: 2.9,
    rentIndexPct: 3.9,
    priceTrendPct: 2.5,
    commuteMinutes: 22,
    vacancyNote: "Orientační neobsazenost (demo): střední",
    districtLabel: "Brno — střed",
  },
  market: {
    daysOnMarket: null,
    relisted: false,
    relistNote: null,
  },
  similar: [
    {
      slug: "demo-byt-3kk-vinohrady",
      reason: "Větší dispozice, podobný výnosový profil",
    },
    {
      slug: "demo-byt-2kk-nizka-cena",
      reason: "Vyšší hrubý výnos (ale záporné CF)",
    },
    {
      slug: "demo-dum-rekonstrukce",
      reason: "Alternativa s rekonstrukčním scénářem",
    },
  ],
};

const REKO: PropertyContextDemo = {
  slug: "demo-dum-rekonstrukce",
  isDemo: true,
  risks: [
    {
      id: "reno-cost",
      title: "Vysoké náklady na rekonstrukci",
      severity: "critical",
      text: "Odhad nákladů a rezervy je široký. Překročení rozpočtu je hlavní riziko scénáře.",
    },
    {
      id: "cf-neg",
      title: "Záporné cash flow před úpravami",
      severity: "high",
      text: "Do dokončení rekonstrukce demonstrační CF vychází záporně.",
    },
    {
      id: "confidence",
      title: "Nízká spolehlivost odhadu hodnoty",
      severity: "high",
      text: "Široké pásmo odhadu kvůli nejistotě stavebního stavu.",
    },
  ],
  checklist: [
    { id: "survey", label: "Stavebně-technický průzkum / posudek" },
    { id: "permits", label: "Povolení, SVJ / územní omezení" },
    { id: "budget", label: "Podrobný rozpočet + rezerva min. 20 %" },
    { id: "burdens", label: "Katastr — břemena a zástavy" },
    { id: "exit", label: "Realističnost exit ceny po rekonstrukci" },
  ],
  dueDiligenceStatus: "unverified",
  dueDiligenceNote:
    "Neověřeno: demonstrační data bez stavebního průzkumu ani právního auditu.",
  location: {
    propertyPricePerSqmCzk: 77_500,
    localAvgPricePerSqmCzk: 82_000,
    diffPct: -5.5,
    rentIndexPct: 3.2,
    priceTrendPct: 1.8,
    commuteMinutes: 35,
    vacancyNote: "Rodinný dům — neobsazenost N/A (demo)",
    districtLabel: "Praha okolí (demo)",
  },
  market: {
    daysOnMarket: 45,
    relisted: false,
    relistNote: null,
  },
  similar: [
    {
      slug: "demo-byt-3kk-vinohrady",
      reason: "Hotovější produkt — méně stavebního rizika",
    },
    {
      slug: "demo-byt-2kk-brno",
      reason: "Nižší kapitálový vstup",
    },
  ],
};

const LOW_PRICE: PropertyContextDemo = {
  slug: "demo-byt-2kk-nizka-cena",
  isDemo: true,
  risks: [
    {
      id: "incomplete",
      title: "Neúplná a zastaralá data",
      severity: "critical",
      text: "Kvalita dat je incomplete a freshness STALE — dostupnost nabídky je nejistá.",
    },
    {
      id: "yield-trap",
      title: "Lákavý hrubý výnos vs. záporné CF",
      severity: "high",
      text: "Vysoký hrubý výnos zakrývá záporné cash flow po nákladech a splátce.",
    },
    {
      id: "hidden-addr",
      title: "Skrytá přesná adresa",
      severity: "medium",
      text: "Mapa se nezobrazuje — lokalita je HIDDEN. Ověřte na prohlídce.",
    },
  ],
  checklist: [
    { id: "availability", label: "Je nabídka stále aktivní? Kontaktujte inzerenta" },
    { id: "burdens", label: "Věcná břemena a právní vady" },
    { id: "condition", label: "Skutečný technický stav (prohlídka)" },
    { id: "coop", label: "Podmínky družstevního vlastnictví" },
  ],
  dueDiligenceStatus: "unverified",
  dueDiligenceNote: "Neověřeno — data jsou neúplná a dlouho neaktualizovaná (demo).",
  location: {
    propertyPricePerSqmCzk: 81_042,
    localAvgPricePerSqmCzk: 72_000,
    diffPct: 12.6,
    rentIndexPct: null,
    priceTrendPct: null,
    commuteMinutes: null,
    vacancyNote: null,
    districtLabel: "Ostrava (orientačně)",
  },
  market: {
    daysOnMarket: 25,
    relisted: false,
    relistNote: null,
  },
  similar: [
    {
      slug: "demo-byt-2kk-brno",
      reason: "Lepší kvalita dat a kladné CF",
    },
    {
      slug: "demo-byt-3kk-vinohrady",
      reason: "Transparentnější historie ceny",
    },
  ],
};

const BY_SLUG: Record<string, PropertyContextDemo> = {
  [VINOHRADY.slug]: VINOHRADY,
  [BRNO.slug]: BRNO,
  [REKO.slug]: REKO,
  [LOW_PRICE.slug]: LOW_PRICE,
};

export function getPropertyContextDemo(
  slug: string,
): PropertyContextDemo | null {
  return BY_SLUG[slug] ?? null;
}

export function dueDiligenceLabel(status: DueDiligenceStatus): string {
  if (status === "verified") return "Ověřeno";
  if (status === "partial") return "Částečně ověřeno";
  return "Neověřeno";
}

export function severityLabel(severity: RiskSeverity): string {
  if (severity === "critical") return "Kritické";
  if (severity === "high") return "Důležité";
  if (severity === "medium") return "Střední";
  return "Nízké";
}

export function severityOrder(severity: RiskSeverity): number {
  if (severity === "critical") return 0;
  if (severity === "high") return 1;
  if (severity === "medium") return 2;
  return 3;
}
