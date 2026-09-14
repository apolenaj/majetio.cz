export const brand = {
  name: "Majetio",
  domains: {
    cz: "Majetio.cz",
    com: "Majetio.com",
  },
  claims: {
    primary: "Než koupíte, mějte jasno.",
    secondary: "Nemovitosti. Analýza. Rozhodnutí.",
    short: "Jasno před koupí.",
    english: "Clarity before you buy.",
    hero: "Vyplatí se tuto nemovitost koupit?",
  },
  logo: {
    concept: "Layered Asset",
    conceptId: "C",
    minSizePx: 16,
    clearSpace: "0.25× symbol height",
  },
} as const;

/** Lucide icon mapping for brand-consistent UI (single library). */
export const brandIconKeys = {
  property: "Building2",
  price: "Banknote",
  yield: "TrendingUp",
  cashFlow: "Wallet",
  location: "MapPin",
  renovation: "Hammer",
  risk: "AlertTriangle",
  financing: "Landmark",
  equity: "PiggyBank",
  mortgage: "Home",
  area: "Square",
  disposition: "LayoutGrid",
  energy: "Leaf",
  compare: "Columns2",
  favourite: "Heart",
  verified: "BadgeCheck",
  estimated: "HelpCircle",
  stale: "Clock",
} as const;
