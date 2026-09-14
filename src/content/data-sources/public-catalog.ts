/**
 * Public data-sources catalog for /zdroje-dat.
 * No internal license keys, contract IDs, or fee schedules.
 */

export type PublicDataSourceCategory =
  | "property_listings"
  | "public_registries"
  | "partner_data"
  | "user_and_derived";

export type PublicDataSourceEntry = {
  id: string;
  name: string;
  category: PublicDataSourceCategory;
  type: string;
  updateFrequency: string;
  usedFor: string[];
  limitations: string[];
};

export const DATA_SOURCE_CATEGORY_LABELS: Record<
  PublicDataSourceCategory,
  { title: string; description: string }
> = {
  property_listings: {
    title: "Property listings",
    description:
      "Nabídky nemovitostí z portálů a feedů. Jde o nabídkové ceny, ne nutně o realizované transakce.",
  },
  public_registries: {
    title: "Public registries",
    description:
      "Veřejné a oficiální registry (katastrální / statistické podklady dle trhu). Použití jen v rozsahu povoleném pro daný trh.",
  },
  partner_data: {
    title: "Partner data",
    description:
      "Data od smluvních partnerů (např. hypoteční nabídky). Vždy s časovou platností a souhlasem, kde je vyžadován.",
  },
  user_and_derived: {
    title: "Uživatel a odvozená data",
    description:
      "Údaje, které zadáte vy, a metriky spočtené Majetiem z primárních vstupů.",
  },
};

export const PUBLIC_DATA_SOURCES: PublicDataSourceEntry[] = [
  {
    id: "listing-feeds",
    name: "Inzertní feedy a portálové nabídky",
    category: "property_listings",
    type: "Nabídková data (listing)",
    updateFrequency: "Průběžně až denně podle poskytovatele; u každého listingu uvádíme last seen",
    usedFor: [
      "Karty nemovitostí a vyhledávání",
      "Comparables pro modelovaný odhad (kde je to licenčně a věcně vhodné)",
    ],
    limitations: [
      "Nabídková cena ≠ kupní cena",
      "Duplicity a neaktuální inzeráty — řešíme merge a freshness, 100% čistotu nelze garantovat",
      "Ne všechny atributy jsou vždy vyplněné",
    ],
  },
  {
    id: "manual-listings",
    name: "Ručně zadané / ověřené listingy",
    category: "property_listings",
    type: "Kurátorovaný záznam",
    updateFrequency: "Při kontrole analytikem nebo importu",
    usedFor: ["Doplnění coverage", "Kontrolní vzorky kvality"],
    limitations: [
      "Menší objem než automatické feedy",
      "Stále podléhá časovému zastarávání",
    ],
  },
  {
    id: "public-cadastral-stats",
    name: "Veřejné registry a oficiální statistiky (dle trhu)",
    category: "public_registries",
    type: "Oficiální / veřejný podklad",
    updateFrequency: "Podle vydavatele (často měsíčně až ročně)",
    usedFor: [
      "Kontext lokality a trhu",
      "Kde je povoleno: podpora valuace / regulatory packs",
    ],
    limitations: [
      "Zpoždění oproti aktuální nabídce",
      "Granularita nemusí sedět na konkrétní adresu",
      "Přesné názvy a rozsah se liší trh od trhu — neuvádíme interní licenční detaily",
    ],
  },
  {
    id: "location-aggregates",
    name: "Agregace lokalitních metrik Majetio",
    category: "user_and_derived",
    type: "Odvozená statistika",
    updateFrequency: "Dle pipeline (typicky denně / po batchi)",
    usedFor: ["Skóre lokality", "Trend a mediány jako kontext"],
    limitations: [
      "Agregát ≠ ocenění konkrétního bytu",
      "Při řídkých datech klesá spolehlivost",
    ],
  },
  {
    id: "mortgage-partner",
    name: "Partnerské hypoteční indikativní nabídky",
    category: "partner_data",
    type: "Partner API / cache",
    updateFrequency: "Cache s TTL; při zastarání označeno jako stale",
    usedFor: ["Orientační sazby a splátky", "Handoff do HypotekaJasne po souhlasu"],
    limitations: [
      "Nezávazné do schválení bankou",
      "Vyžaduje platný souhlas se sdílením údajů",
      "Bez souhlasu data partnerovi neodesíláme",
    ],
  },
  {
    id: "user-passport",
    name: "Finanční pas a scénáře uživatele",
    category: "user_and_derived",
    type: "Uživatelský vstup",
    updateFrequency: "Okamžitě po uložení uživatelem",
    usedFor: ["Match", "Kapacita financování", "Investiční scénáře"],
    limitations: [
      "Přesnost závisí na tom, co zadáte",
      "Není ověřením příjmu bankou",
    ],
  },
  {
    id: "engine-outputs",
    name: "Výstupy výpočetního jádra Majetio",
    category: "user_and_derived",
    type: "Modelovaný výstup",
    updateFrequency: "Při výpočtu / přepočtu scénáře",
    usedFor: ["Odhad hodnoty", "IRR / NOI / ROI", "ARV, Maximum Offer, skóre"],
    limitations: [
      "Orientační model — viz /metodika",
      "AI shrnutí těchto výstupů nemění primární čísla",
    ],
  },
];

export function groupPublicDataSources(): Array<{
  category: PublicDataSourceCategory;
  label: (typeof DATA_SOURCE_CATEGORY_LABELS)[PublicDataSourceCategory];
  items: PublicDataSourceEntry[];
}> {
  const order: PublicDataSourceCategory[] = [
    "property_listings",
    "public_registries",
    "partner_data",
    "user_and_derived",
  ];
  return order.map((category) => ({
    category,
    label: DATA_SOURCE_CATEGORY_LABELS[category],
    items: PUBLIC_DATA_SOURCES.filter((s) => s.category === category),
  }));
}
