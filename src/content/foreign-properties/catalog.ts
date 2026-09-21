/**
 * Foreign property product catalog — separate from CZ marketplace listings.
 * Model examples; not live inventory.
 */

export type ForeignPurpose = "bydleni" | "investice" | "rekreace";

export type ForeignCountry = {
  slug: string;
  name: string;
  nameEn: string;
  heroNote: string;
  currency: "EUR" | "AED" | "USD";
};

export type ForeignListing = {
  id: string;
  slug: string;
  countrySlug: string;
  title: string;
  cityRegion: string;
  propertyType: string;
  priceLocal: number;
  currency: "EUR" | "AED" | "USD";
  /** Explicit CZK approx when curated; else derive from FX assumptions. */
  priceCzkApprox?: number;
  areaM2: number | null;
  purpose: ForeignPurpose;
  rentEstimateLabel: string | null;
  yieldLabel: string | null;
  opexLabel: string | null;
  image: string;
  gallery: string[];
  description: string;
  badge: "Modelový příklad" | "Ukázková nabídka";
  statusHint?: "novostavba" | "ready" | "off-plan";
  countrySpecifics: {
    ownership: string;
    taxesFees: string;
    financing: string;
    opex: string;
    currencyNote: string;
    legalProcess: string;
    management: string;
  };
};

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=75`;

const IMG = {
  coast: u("photo-1499793983690-e29dafd12df4"),
  dubai: u("photo-1512453979798-5ea266f8880c"),
  croatia: u("photo-1555881400-74d7acaacd8b"),
  italy: u("photo-1516483638261-f4dbaf036963"),
  bali: u("photo-1537996194471-e657df975ab4"),
  skyline: u("photo-1486406146926-c627a92ad1ab"),
  houseCountry: u("photo-1564013799919-ab600027ffc6"),
} as const;

export const FOREIGN_COUNTRIES: ForeignCountry[] = [
  {
    slug: "spanelsko",
    name: "Španělsko",
    nameEn: "Spain",
    heroNote: "Costa a města — bydlení i krátkodobý nájem.",
    currency: "EUR",
  },
  {
    slug: "uae",
    name: "Spojené arabské emiráty",
    nameEn: "UAE",
    heroNote: "Dubai a freehold zóny — ověřte režim vlastnictví.",
    currency: "AED",
  },
  {
    slug: "chorvatsko",
    name: "Chorvatsko",
    nameEn: "Croatia",
    heroNote: "Pobřeží a sezónní výnos — silná sezónnost.",
    currency: "EUR",
  },
  {
    slug: "italie",
    name: "Itálie",
    nameEn: "Italy",
    heroNote: "Jih i města — daně a notářské náklady ověřte lokálně.",
    currency: "EUR",
  },
  {
    slug: "indonesie",
    name: "Indonésie · Bali",
    nameEn: "Indonesia",
    heroNote: "Často leasehold — délku a převod vždy ověřte.",
    currency: "USD",
  },
];

const VERIFY = "Nutno ověřit";

export const FOREIGN_LISTINGS: ForeignListing[] = [
  {
    id: "za-1",
    slug: "spanelsko-costa",
    countrySlug: "spanelsko",
    title: "Apartmán — Costa del Sol",
    cityRegion: "Marbella okolí",
    propertyType: "Apartmán",
    priceLocal: 250_000,
    currency: "EUR",
    priceCzkApprox: 6_250_000,
    areaM2: 78,
    purpose: "rekreace",
    rentEstimateLabel: "1 400 EUR / měs.",
    yieldLabel: "cca 6,7 % hrubě",
    opexLabel: "Komunity + energie — ověřit",
    image: IMG.coast,
    gallery: [IMG.coast, IMG.croatia],
    description: "Přímořský apartmán — modelový krátkodobý nájem.",
    badge: "Modelový příklad",
    statusHint: "ready",
    countrySpecifics: {
      ownership: VERIFY,
      taxesFees: VERIFY,
      financing: VERIFY,
      opex: VERIFY,
      currencyNote: "EUR — přepočet do CZK je orientační",
      legalProcess: VERIFY,
      management: VERIFY,
    },
  },
  {
    id: "za-2",
    slug: "dubai-studio",
    countrySlug: "uae",
    title: "Studio / 1BR — Dubai Marina",
    cityRegion: "Dubai Marina",
    propertyType: "Studio / 1BR",
    priceLocal: 1_100_000,
    currency: "AED",
    priceCzkApprox: 7_150_000,
    areaM2: 55,
    purpose: "investice",
    rentEstimateLabel: "75 000 AED / rok",
    yieldLabel: "cca 6,8 % hrubě",
    opexLabel: "Service charge — ověřit",
    image: IMG.dubai,
    gallery: [IMG.dubai, IMG.skyline],
    description: "Modelový výnos z dlouhodobého pronájmu v Marině.",
    badge: "Ukázková nabídka",
    statusHint: "ready",
    countrySpecifics: {
      ownership: "Freehold zóny — ověřit konkrétní zónu",
      taxesFees: VERIFY,
      financing: VERIFY,
      opex: VERIFY,
      currencyNote: "AED — přepočet do CZK je orientační",
      legalProcess: VERIFY,
      management: VERIFY,
    },
  },
  {
    id: "za-3",
    slug: "chorvatsko-more",
    countrySlug: "chorvatsko",
    title: "Apartmán u moře — Dalmácie",
    cityRegion: "Dalmácie",
    propertyType: "Apartmán",
    priceLocal: 220_000,
    currency: "EUR",
    priceCzkApprox: 5_500_000,
    areaM2: 68,
    purpose: "rekreace",
    rentEstimateLabel: "1 100 EUR / měs. prům.",
    yieldLabel: "cca 6,0 % hrubě",
    opexLabel: "Sezónní údržba — ověřit",
    image: IMG.croatia,
    gallery: [IMG.croatia, IMG.coast],
    description: "Sezónní apartmán blízko pobřeží.",
    badge: "Modelový příklad",
    statusHint: "ready",
    countrySpecifics: {
      ownership: VERIFY,
      taxesFees: VERIFY,
      financing: VERIFY,
      opex: "Sezónnost silně ovlivní cashflow",
      currencyNote: "EUR — přepočet do CZK je orientační",
      legalProcess: VERIFY,
      management: VERIFY,
    },
  },
  {
    id: "za-4",
    slug: "italie-dum",
    countrySlug: "italie",
    title: "Dům / apartmán — Apulie",
    cityRegion: "Apulie",
    propertyType: "Dům",
    priceLocal: 180_000,
    currency: "EUR",
    priceCzkApprox: 4_500_000,
    areaM2: 110,
    purpose: "investice",
    rentEstimateLabel: "750 EUR / měs.",
    yieldLabel: "cca 5,0 % hrubě",
    opexLabel: "Notářské a daňové náklady navíc",
    image: IMG.italy,
    gallery: [IMG.italy, IMG.houseCountry],
    description: "Menší objekt v jižní Itálii — rekonstrukční potenciál.",
    badge: "Modelový příklad",
    statusHint: "ready",
    countrySpecifics: {
      ownership: VERIFY,
      taxesFees: "Notářské a daňové náklady — ověřit",
      financing: VERIFY,
      opex: VERIFY,
      currencyNote: "EUR — přepočet do CZK je orientační",
      legalProcess: VERIFY,
      management: VERIFY,
    },
  },
  {
    id: "za-5",
    slug: "bali-villa",
    countrySlug: "indonesie",
    title: "Villa — Bali · Canggu",
    cityRegion: "Bali · Canggu",
    propertyType: "Villa",
    priceLocal: 190_000,
    currency: "USD",
    priceCzkApprox: 4_370_000,
    areaM2: 140,
    purpose: "investice",
    rentEstimateLabel: "1 800 USD / měs.",
    yieldLabel: "cca 11 % hrubě (model)",
    opexLabel: "Správa short-term — ověřit",
    image: IMG.bali,
    gallery: [IMG.bali, IMG.coast],
    description: "Villa na leasehold — krátkodobý nájem v modelu.",
    badge: "Modelový příklad",
    statusHint: "ready",
    countrySpecifics: {
      ownership: "Leasehold — ověřit délku a převoditelnost",
      taxesFees: VERIFY,
      financing: VERIFY,
      opex: VERIFY,
      currencyNote: "USD — přepočet do CZK je orientační",
      legalProcess: VERIFY,
      management: VERIFY,
    },
  },
];

export function getForeignCountry(slug: string): ForeignCountry | undefined {
  return FOREIGN_COUNTRIES.find((c) => c.slug === slug);
}

export function getForeignListing(
  countrySlug: string,
  listingSlug: string,
): ForeignListing | undefined {
  return FOREIGN_LISTINGS.find(
    (l) => l.countrySlug === countrySlug && l.slug === listingSlug,
  );
}

export function listingsForCountry(countrySlug: string): ForeignListing[] {
  return FOREIGN_LISTINGS.filter((l) => l.countrySlug === countrySlug);
}

export const PURPOSE_LABEL: Record<ForeignPurpose, string> = {
  bydleni: "Bydlení",
  investice: "Investice",
  rekreace: "Rekreace",
};
