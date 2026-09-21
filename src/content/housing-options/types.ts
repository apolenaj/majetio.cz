/**
 * Modelové příklady alternativních režimů bydlení / investování.
 * Oddělené od live property listings — nikdy nemíchat s DB nabídkami.
 */

export type HousingOptionSlug =
  | "sdilena-investice"
  | "castecna-koupe"
  | "sdileny-najem"
  | "nabidnete-cenu"
  | "aukce"
  | "bydleni-za-vypomoc"
  | "smena"
  | "zahranicni";

export type HousingMetric = {
  label: string;
  value: string;
  emphasize?: boolean;
};

export type SwapSide = {
  title: string;
  location: string;
  propertyType: string;
  valueLabel: string;
  image: string;
};

export type HousingOptionExample = {
  id: string;
  slug: string;
  title: string;
  location: string;
  propertyType: string;
  /** Primary price line shown on card */
  priceLabel: string;
  currency?: string;
  image: string;
  gallery?: string[];
  description: string;
  badge: "Modelový příklad" | "Ukázková nabídka";
  metrics: HousingMetric[];
  /** Extra body paragraphs for detail */
  howItWorks?: string[];
  scenario?: string;
  /** Směna: two sides */
  swap?: { left: SwapSide; right: SwapSide; settlementLabel: string };
};

export type HousingOptionCategory = {
  slug: HousingOptionSlug;
  title: string;
  seoTitle: string;
  seoDescription: string;
  subtitle: string;
  explanation: string;
  benefits: { title: string; text: string }[];
  steps: { title: string; text: string }[];
  risks: string[];
  ctaLabel: string;
  ctaHref: string;
  interestMode: string;
  showSharePct?: boolean;
  showAmount?: boolean;
  examples: HousingOptionExample[];
};
