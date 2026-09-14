import type { ContentBase } from "@/content/types";

export type StrategyContent = ContentBase & {
  audience: string;
  pros: string[];
  risks: string[];
  capital: string;
  metrics: string[];
  mistakes: string[];
  howMajetioHelps: string;
  relatedCalculators: { href: string; label: string }[];
};

export const STRATEGY_CONTENT: StrategyContent[] = [
  {
    id: "strategy-vlastni-bydleni",
    slug: "vlastni-bydleni",
    title: "Vlastní bydlení",
    perex: "Realistická cena, rizika lokality a financovatelnost před podpisem.",
    status: "published",
    audience: "Kupující, kteří hledají bydlení pro sebe, ne primárně výnos.",
    pros: [
      "Stabilita bydlení a dlouhodobá jistota",
      "Možnost přizpůsobit nemovitost potřebám domácnosti",
      "Transparentní porovnání nabídkové ceny s odhadem hodnoty",
    ],
    risks: [
      "Přeplacení nabídkové ceny",
      "Skryté technické vady",
      "Financování mimo reálný rozpočet domácnosti",
    ],
    capital: "Vlastní kapitál + hypotéka podle bankovních pravidel (řeší HypotekaJasne).",
    metrics: ["Odhad hodnoty vs. nabídka", "Měsíční splátka (orientačně)", "Rizika lokality"],
    mistakes: [
      "Rozhodnutí jen podle fotek a dojmu z prohlídky",
      "Ignorování nákladů na provoz a rekonstrukci",
      "Podcenění rezervy při financování",
    ],
    howMajetioHelps:
      "Oddělí odhad od nabídky, ukáže rizika a připraví orientační financování bez nahrazování banky.",
    relatedCalculators: [
      { href: "/kalkulacky/financovani", label: "Financování" },
      { href: "/kalkulacky/maximalni-nabidkova-cena", label: "Maximální nabídková cena" },
    ],
    cta: { label: "Analyzovat nemovitost", href: "/analyza" },
  },
  {
    id: "strategy-dlouhodoby-pronajem",
    slug: "dlouhodoby-pronajem",
    title: "Dlouhodobý pronájem",
    perex: "Výnos, cash flow a provozní náklady v čase — bez garantovaných výnosů.",
    status: "published",
    audience: "Investoři hledající stabilní nájemní výnos.",
    pros: ["Předvídatelnější cash flow", "Nižší provozní náročnost než short-term", "Dlouhodobý nájemní vztah"],
    risks: ["Neobsazenost", "Růst nákladů a oprav", "Regulace a právní rizika nájmu"],
    capital: "Typicky vyšší vstupní kapitál; LTV a cash flow závisí na konkrétní nabídce.",
    metrics: ["Hrubý / čistý výnos", "Měsíční cash flow", "Návratnost vlastního kapitálu"],
    mistakes: ["Počítat jen hrubý výnos", "Ignorovat fond oprav", "Podcenit správu"],
    howMajetioHelps: "Spočítá scénáře výnosu a cash flow a porovná nabídky vedle sebe.",
    relatedCalculators: [
      { href: "/kalkulacky/investicni-vynos", label: "Investiční výnos" },
      { href: "/kalkulacky/cash-flow", label: "Cash flow" },
      { href: "/kalkulacky/navratnost", label: "Návratnost" },
    ],
    cta: { label: "Procházet nemovitosti", href: "/nemovitosti" },
  },
  {
    id: "strategy-kratkodoby-pronajem",
    slug: "kratkodoby-pronajem",
    title: "Krátkodobý pronájem",
    perex: "Obsazenost, sezónnost a provoz — model, ne slib.",
    status: "published",
    audience: "Investoři ochotní řídit vyšší provozní náročnost.",
    pros: ["Potenciálně vyšší tržby v atraktivních lokalitách", "Flexibilita využití"],
    risks: ["Sezónnost", "Regulace short-term", "Vysoké provozní náklady"],
    capital: "Kapitál + provozní polštář na období nízké obsazenosti.",
    metrics: ["Obsazenost", "RevPAR / průměrná noc", "Provozní náklady"],
    mistakes: ["Extrapolovat špičkové měsíce na celý rok", "Ignorovat regulaci"],
    howMajetioHelps: "Ukáže rizika a scénáře; negarantuje obsazenost ani výnos.",
    relatedCalculators: [
      { href: "/kalkulacky/cash-flow", label: "Cash flow" },
      { href: "/kalkulacky/investicni-vynos", label: "Investiční výnos" },
    ],
    cta: { label: "Analyzovat nemovitost", href: "/analyza" },
  },
  {
    id: "strategy-rekonstrukce",
    slug: "rekonstrukce",
    title: "Koupě a rekonstrukce",
    perex: "Náklady, rezervy a dopad na hodnotu po úpravách.",
    status: "published",
    audience: "Kupující plánující zásadní úpravy před bydlením nebo pronájmem.",
    pros: ["Možnost zvýšit hodnotu", "Přizpůsobení dispozice"],
    risks: ["Překročení rozpočtu", "Zpoždění", "Přecenění exit hodnoty"],
    capital: "Kupní cena + rekonstrukce + rezerva (typicky významná).",
    metrics: ["Odhad nákladů", "Hodnota po rekonstrukci", "Maximální nabídková cena"],
    mistakes: ["Žádná rezerva", "Ignorovat stavební povolení / SVJ"],
    howMajetioHelps: "Struktura scénáře rekonstrukce a vazba na nabídkovou cenu.",
    relatedCalculators: [
      { href: "/kalkulacky/rekonstrukce", label: "Rekonstrukce" },
      { href: "/kalkulacky/maximalni-nabidkova-cena", label: "Maximální nabídková cena" },
    ],
    cta: { label: "Spočítat rekonstrukci", href: "/kalkulacky/rekonstrukce" },
  },
  {
    id: "strategy-flip",
    slug: "flip",
    title: "Flip",
    perex: "Nákup, zhodnocení a exit — se scénáři, bez garantovaného zisku.",
    status: "published",
    audience: "Zkušenější investoři s kapitálem a tolerancí k riziku času.",
    pros: ["Krátký investiční horizont (v ideálním případě)", "Potenciál zhodnocení"],
    risks: ["Tržní pokles", "Likvidita", "Náklady držení"],
    capital: "Vyšší vlastní kapitál nebo krátkodobé financování — individuální.",
    metrics: ["Nákup vs. exit", "Náklady držení", "Čas do prodeje"],
    mistakes: ["Optimistický exit bez scénářů", "Podcenění daní a transakčních nákladů"],
    howMajetioHelps: "Porovná scénáře a rizika; neprodává garantovaný zisk.",
    relatedCalculators: [
      { href: "/kalkulacky/maximalni-nabidkova-cena", label: "Maximální nabídková cena" },
      { href: "/kalkulacky/navratnost", label: "Návratnost" },
    ],
    cta: { label: "Objednat kompletní analýzu", href: "/cenik" },
  },
];

export function getStrategyBySlug(slug: string) {
  return STRATEGY_CONTENT.find((s) => s.slug === slug);
}
