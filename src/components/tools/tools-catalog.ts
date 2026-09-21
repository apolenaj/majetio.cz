export type ToolFilter =
  | "all"
  | "investice"
  | "bydleni"
  | "financovani"
  | "rekonstrukce";

export type ToolTag =
  | "Bydlení"
  | "Investice"
  | "Financování"
  | "Analýza"
  | "Rekonstrukce";

export type CatalogTool = {
  id: string;
  href: string;
  title: string;
  description: string;
  tags: ToolTag[];
  filters: Exclude<ToolFilter, "all">[];
  badge?: string;
  icon:
    | "overview"
    | "cashflow"
    | "finance"
    | "maxprice"
    | "yield"
    | "payback"
    | "reno";
};

export type FeaturedTool = {
  id: string;
  href: string;
  title: string;
  description: string;
  useCase: string;
  badge?: string;
  icon: "yield" | "reno" | "finance" | "studies";
};

export const TOOL_FILTERS: { id: ToolFilter; label: string }[] = [
  { id: "all", label: "Vše" },
  { id: "investice", label: "Investice" },
  { id: "bydleni", label: "Bydlení" },
  { id: "financovani", label: "Financování" },
  { id: "rekonstrukce", label: "Rekonstrukce" },
];

export const FEATURED_TOOLS: FeaturedTool[] = [
  {
    id: "featured-yield",
    href: "/kalkulacky/investicni-vynos",
    title: "Výnos a cash flow",
    description: "Modelujte nájem, náklady a měsíční bilanci.",
    useCase: "Vhodné pro investory i porovnání více scénářů.",
    badge: "Nejpoužívanější",
    icon: "yield",
  },
  {
    id: "featured-reno",
    href: "/kalkulacky/rekonstrukce",
    title: "Náklady rekonstrukce",
    description: "Odhadněte rozsah prací, rezervu a dopad na investici.",
    useCase: "Rychlý orientační rozpočet před prohlídkou.",
    badge: "Praktické",
    icon: "reno",
  },
  {
    id: "featured-finance",
    href: "/kalkulacky/financovani",
    title: "Financování",
    description: "Spočítejte splátku, vlastní zdroje a orientační dostupnost.",
    useCase: "LTV, splátka a scénáře s různou pákou.",
    badge: "Oblíbené",
    icon: "finance",
  },
  {
    id: "featured-studies",
    href: "/ukazky",
    title: "Modelové studie",
    description: "Prohlédněte si ověřené ukázky metodiky analýzy.",
    useCase: "Jak vypadá hotová analýza v praxi.",
    icon: "studies",
  },
];

export const CATALOG_TOOLS: CatalogTool[] = [
  {
    id: "overview",
    href: "/kalkulacky",
    title: "Přehled kalkulaček",
    description: "Všechny výpočtové nástroje na jednom místě.",
    tags: ["Analýza"],
    filters: ["investice", "bydleni", "financovani", "rekonstrukce"],
    badge: "Rozcestník",
    icon: "overview",
  },
  {
    id: "cash-flow",
    href: "/kalkulacky/cash-flow",
    title: "Cash flow",
    description:
      "Spočítejte příjmy, náklady a měsíční bilanci investiční nemovitosti.",
    tags: ["Investice"],
    filters: ["investice"],
    badge: "Rychlý výpočet",
    icon: "cashflow",
  },
  {
    id: "financovani",
    href: "/kalkulacky/financovani",
    title: "Financování",
    description:
      "Porovnejte orientační splátku, vlastní zdroje a možnosti úvěru.",
    tags: ["Financování", "Bydlení"],
    filters: ["financovani", "bydleni"],
    badge: "Oblíbené",
    icon: "finance",
  },
  {
    id: "max-offer",
    href: "/kalkulacky/maximalni-nabidkova-cena",
    title: "Maximální nabídková cena",
    description:
      "Zjistěte, jakou maximální cenu dává při daných parametrech ještě smysl nabídnout.",
    tags: ["Investice", "Analýza"],
    filters: ["investice"],
    badge: "Doporučeno",
    icon: "maxprice",
  },
  {
    id: "yield",
    href: "/kalkulacky/investicni-vynos",
    title: "Investiční výnos",
    description: "Odhadněte hrubý i čistý výnos investice do nemovitosti.",
    tags: ["Investice"],
    filters: ["investice"],
    badge: "Nejpoužívanější",
    icon: "yield",
  },
  {
    id: "payback",
    href: "/kalkulacky/navratnost",
    title: "Návratnost investice",
    description: "Spočítejte, za jak dlouho se vám investice může vrátit.",
    tags: ["Investice"],
    filters: ["investice"],
    badge: "Rychlý výpočet",
    icon: "payback",
  },
  {
    id: "reno",
    href: "/kalkulacky/rekonstrukce",
    title: "Rekonstrukce",
    description:
      "Odhadněte rozpočet úprav, rezervu a dopad na ekonomiku projektu.",
    tags: ["Rekonstrukce", "Bydlení"],
    filters: ["rekonstrukce", "bydleni"],
    badge: "Praktické",
    icon: "reno",
  },
];
