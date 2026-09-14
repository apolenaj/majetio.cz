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
      { href: "/o-nas", label: "O nás" },
      { href: "/duvera-a-bezpecnost", label: "Důvěra a bezpečnost" },
      { href: "/kontakt", label: "Kontakt" },
      { href: "/partneri", label: "Partneři" },
    ],
  },
  {
    title: "Důvěra a právo",
    links: [
      { href: "/zdroje-dat", label: "Zdroje dat" },
      { href: "/metodika", label: "Metodika" },
      { href: "/slovnik", label: "Slovník" },
      { href: "/ochrana-soukromi", label: "Ochrana soukromí" },
      { href: "/cookies", label: "Cookies" },
      { href: "/podminky", label: "Obchodní podmínky" },
      { href: "/pravni-upozorneni", label: "Právní upozornění" },
    ],
  },
] as const;

export const BROKER_NAV = [
  { href: "/profi", label: "Dashboard" },
  { href: "/profi/onboarding", label: "Onboarding" },
  { href: "/profi/profil", label: "Profil" },
  { href: "/profi/analytics", label: "Analytics" },
  { href: "/profi/leady", label: "Kvalifikovaní zájemci" },
  { href: "/profi/pipeline", label: "CRM pipeline" },
] as const;

export const ACCOUNT_NAV = [
  { href: "/ucet", label: "Rozhodování" },
  { href: "/ucet/financni-profil", label: "Finanční pas" },
  { href: "/ucet/financovani", label: "Financování" },
  { href: "/ucet/oblibene", label: "Oblíbené" },
  { href: "/ucet/porovnani", label: "Porovnání" },
  { href: "/ucet/analyzy", label: "Analýzy" },
  { href: "/ucet/objednavky", label: "Objednávky" },
  { href: "/ucet/ulozena-hledani", label: "Uložená hledání" },
  { href: "/ucet/upozorneni", label: "Upozornění" },
  { href: "/ucet/nastaveni", label: "Nastavení" },
  { href: "/ucet/soukromi", label: "Privacy Center" },
] as const;

export const ADMIN_NAV = [
  { href: "/admin", label: "Přehled" },
  { href: "/admin/monetizace", label: "Monetizace" },
  { href: "/admin/trhy", label: "Trhy" },
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

/**
 * Operations Control Center IA — sectioned nav with required permission keys.
 * Layout filters by hasPermission(role, item.permission).
 */
export const ADMIN_NAV_SECTIONS = [
  {
    id: "overview",
    label: "Přehled",
    items: [
      {
        href: "/admin",
        label: "Operations dashboard",
        permission: "ops.dashboard.read" as const,
      },
    ],
  },
  {
    id: "properties",
    label: "Nemovitosti",
    items: [
      {
        href: "/admin/nemovitosti",
        label: "Nemovitosti",
        permission: "property.read" as const,
      },
      {
        href: "/admin/nemovitosti/moderace",
        label: "Moderace",
        permission: "property.moderate" as const,
      },
      {
        href: "/admin/nemovitosti/duplikaty",
        label: "Duplikáty",
        permission: "property.merge" as const,
      },
    ],
  },
  {
    id: "imports",
    label: "Importy",
    items: [
      {
        href: "/admin/importy",
        label: "Import jobs",
        permission: "import.read" as const,
      },
      {
        href: "/admin/zdroje",
        label: "Zdroje",
        permission: "import.read" as const,
      },
      {
        href: "/admin/freshness",
        label: "Freshness",
        permission: "dataQuality.read" as const,
      },
    ],
  },
  {
    id: "data-quality",
    label: "Data Quality",
    items: [
      {
        href: "/admin/data-quality",
        label: "DQ Center",
        permission: "dataQuality.read" as const,
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytika modelů",
    items: [
      {
        href: "/admin/analyzy",
        label: "Analytics hub",
        permission: "analytics.models.read" as const,
      },
      {
        href: "/admin/analyzy/valuation",
        label: "Valuation",
        permission: "analytics.models.read" as const,
      },
      {
        href: "/admin/analyzy/assumptions",
        label: "Assumptions",
        permission: "analytics.models.read" as const,
      },
      {
        href: "/admin/analyzy/renovation",
        label: "Renovation catalog",
        permission: "analytics.models.read" as const,
      },
      {
        href: "/admin/analyzy/hypoteka",
        label: "HypotekaJasne",
        permission: "analytics.models.read" as const,
      },
      {
        href: "/admin/lokality",
        label: "Lokality",
        permission: "analytics.models.read" as const,
      },
    ],
  },
  {
    id: "users",
    label: "Uživatelé",
    items: [
      {
        href: "/admin/uzivatele",
        label: "Uživatelé",
        permission: "users.read" as const,
      },
    ],
  },
  {
    id: "orgs",
    label: "Organizace",
    items: [
      {
        href: "/admin/organizace",
        label: "B2B organizace",
        permission: "orgs.read" as const,
      },
    ],
  },
  {
    id: "leads",
    label: "Leady",
    items: [
      {
        href: "/admin/leady",
        label: "Lead Operations",
        permission: "leads.read" as const,
      },
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    items: [
      {
        href: "/admin/objednavky",
        label: "Objednávky",
        permission: "payments.read" as const,
      },
      {
        href: "/admin/cenik",
        label: "Ceník / Pricing",
        permission: "pricing.read" as const,
      },
      {
        href: "/admin/monetizace",
        label: "Monetizace",
        permission: "payments.read" as const,
      },
      {
        href: "/admin/audit-log",
        label: "Audit log",
        permission: "platform.audit.read" as const,
      },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      {
        href: "/admin/trhy",
        label: "Trhy / kill switches",
        permission: "platform.markets.write" as const,
      },
      {
        href: "/admin/nastaveni",
        label: "Flags & nastavení",
        permission: "platform.flags.read" as const,
      },
      {
        href: "/admin/monitoring",
        label: "Health & Jobs",
        permission: "ops.health.read" as const,
      },
      {
        href: "/admin/obsah",
        label: "Obsah & regulace",
        permission: "platform.content.read" as const,
      },
      {
        href: "/admin/incidenty",
        label: "Incidenty",
        permission: "platform.incidents.read" as const,
      },
      {
        href: "/admin/lokality",
        label: "Lokality",
        permission: "ops.dashboard.read" as const,
      },
      {
        href: "/admin/partneri",
        label: "Partneři",
        permission: "ops.dashboard.read" as const,
      },
    ],
  },
] as const;

export const MOBILE_APP_NAV = [
  { href: "/ucet", label: "Rozhodování" },
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
