/**
 * Central navigation & IA config for Majetio.cz
 * Only list routes that exist with real content or an honest "Připravujeme" page.
 */

export const NAV_PRIMARY = [
  { href: "/nemovitosti", label: "Nemovitosti", hasMega: true },
  { href: "/analyza", label: "Analyzovat nemovitost", hasMega: false },
  { href: "/kalkulacky", label: "Kalkulačky", hasMega: true },
  { href: "/lokality", label: "Lokality", hasMega: false },
  { href: "/jak-to-funguje", label: "Jak to funguje", hasMega: false },
  { href: "/cenik", label: "Ceník", hasMega: false },
  { href: "/pruvodce", label: "Průvodce", hasMega: false },
] as const;

export const MEGA_NEMOVITOSTI = {
  search: [
    { href: "/nemovitosti", label: "Všechny nemovitosti" },
    { href: "/nemovitosti?typ=byt", label: "Byty" },
    { href: "/nemovitosti?typ=dum", label: "Rodinné domy" },
    { href: "/nemovitosti?typ=pozemek", label: "Pozemky" },
    { href: "/nemovitosti/investicni-prilezitosti", label: "Investiční příležitosti" },
  ],
  strategies: [
    { href: "/strategie/dlouhodoby-pronajem", label: "Dlouhodobý pronájem" },
    { href: "/strategie/kratkodoby-pronajem", label: "Krátkodobý pronájem" },
    { href: "/strategie/rekonstrukce", label: "Rekonstrukce" },
    { href: "/strategie/flip", label: "Flip" },
    { href: "/strategie/vlastni-bydleni", label: "Vlastní bydlení" },
  ],
  tools: [
    { href: "/porovnani", label: "Porovnat nemovitosti" },
    { href: "/ucet/ulozena-hledani", label: "Uložená vyhledávání" },
    { href: "/ucet/oblibene", label: "Oblíbené nemovitosti" },
  ],
} as const;

/** Only calculators with a hub page or honest stub route. */
export const MEGA_KALKULACKY = [
  { href: "/kalkulacky", label: "Přehled kalkulaček", ready: true },
  { href: "/kalkulacky/investicni-vynos", label: "Investiční výnos", ready: true },
  { href: "/kalkulacky/cash-flow", label: "Cash flow", ready: true },
  { href: "/kalkulacky/navratnost", label: "Návratnost investice", ready: true },
  { href: "/kalkulacky/financovani", label: "Financování", ready: true },
  { href: "/kalkulacky/rekonstrukce", label: "Rekonstrukce", ready: true },
  {
    href: "/kalkulacky/maximalni-nabidkova-cena",
    label: "Maximální nabídková cena",
    ready: true,
  },
] as const;

export const FOOTER_GROUPS = [
  {
    title: "Produkt",
    links: [
      { href: "/nemovitosti", label: "Nemovitosti" },
      { href: "/analyza", label: "Analýza" },
      { href: "/kalkulacky", label: "Kalkulačky" },
      { href: "/porovnani", label: "Porovnání" },
      { href: "/cenik", label: "Ceník" },
    ],
  },
  {
    title: "Investování",
    links: [
      { href: "/strategie", label: "Strategie" },
      { href: "/lokality", label: "Lokality" },
      { href: "/pruvodce", label: "Průvodce" },
      { href: "/metodika", label: "Metodika" },
      { href: "/majetio-skore", label: "Majetio skóre" },
    ],
  },
  {
    title: "Společnost",
    links: [
      { href: "/o-majetio", label: "O Majetio" },
      { href: "/kontakt", label: "Kontakt" },
      { href: "/partneri", label: "Partneři" },
    ],
  },
  {
    title: "Důvěra a právo",
    links: [
      { href: "/zdroje-dat", label: "Zdroje dat" },
      { href: "/jak-pocitame-vynos", label: "Jak počítáme výnos" },
      { href: "/jak-odhadujeme-hodnotu", label: "Jak odhadujeme hodnotu" },
      { href: "/ochrana-osobnich-udaju", label: "Ochrana osobních údajů" },
      { href: "/cookies", label: "Cookies" },
      { href: "/obchodni-podminky", label: "Obchodní podmínky" },
      { href: "/pravni-upozorneni", label: "Právní upozornění" },
    ],
  },
] as const;

export const ACCOUNT_NAV = [
  { href: "/ucet", label: "Přehled" },
  { href: "/ucet/financni-profil", label: "Finanční pas" },
  { href: "/ucet/oblibene", label: "Oblíbené" },
  { href: "/ucet/porovnani", label: "Porovnání" },
  { href: "/ucet/analyzy", label: "Analýzy" },
  { href: "/ucet/objednavky", label: "Objednávky" },
  { href: "/ucet/ulozena-hledani", label: "Uložená hledání" },
  { href: "/ucet/upozorneni", label: "Upozornění" },
  { href: "/ucet/nastaveni", label: "Nastavení" },
  { href: "/ucet/souhlasy", label: "Souhlasy" },
] as const;

export const ADMIN_NAV = [
  { href: "/admin", label: "Přehled" },
  { href: "/admin/nemovitosti", label: "Nemovitosti" },
  { href: "/admin/analyzy", label: "Analýzy" },
  { href: "/admin/leady", label: "Leady" },
  { href: "/admin/objednavky", label: "Objednávky" },
  { href: "/admin/uzivatele", label: "Uživatelé" },
  { href: "/admin/lokality", label: "Lokality" },
  { href: "/admin/obsah", label: "Obsah" },
  { href: "/admin/partneri", label: "Partneři" },
  { href: "/admin/data-quality", label: "Kvalita dat" },
  { href: "/admin/nastaveni", label: "Nastavení" },
  { href: "/admin/audit-log", label: "Audit log" },
] as const;

export const MOBILE_APP_NAV = [
  { href: "/ucet", label: "Přehled" },
  { href: "/nemovitosti", label: "Nemovitosti" },
  { href: "/porovnani", label: "Porovnání" },
  { href: "/ucet/oblibene", label: "Oblíbené" },
  { href: "/ucet/nastaveni", label: "Účet" },
] as const;

export const STRATEGIES = [
  {
    slug: "vlastni-bydleni",
    title: "Vlastní bydlení",
    description: "Realistická cena, rizika lokality a financovatelnost.",
  },
  {
    slug: "dlouhodoby-pronajem",
    title: "Dlouhodobý pronájem",
    description: "Výnos, cash flow a provozní náklady v čase.",
  },
  {
    slug: "kratkodoby-pronajem",
    title: "Krátkodobý pronájem",
    description: "Obsazenost, sezónnost a provozní náročnost.",
  },
  {
    slug: "rekonstrukce",
    title: "Rekonstrukce",
    description: "Odhad nákladů, rezervy a dopad na hodnotu.",
  },
  {
    slug: "flip",
    title: "Flip",
    description: "Nákup, zhodnocení a exit cena se scénáři.",
  },
] as const;

/** Secondary nav kept for footer / secondary links (not primary header). */
export const NAV_SECONDARY = [
  { href: "/jak-to-funguje", label: "Jak to funguje" },
  { href: "/metodika", label: "Metodika" },
  { href: "/zdroje-dat", label: "Zdroje dat" },
  { href: "/pruvodce", label: "Průvodce" },
  { href: "/strategie", label: "Strategie" },
] as const;
