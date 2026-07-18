import type { PropertyCardData } from "@/components/property/property-card";

/** Clearly labelled demo listings for IA / UI — not live market offers. */
export const DEMO_PROPERTIES: PropertyCardData[] = [
  {
    href: "/nemovitosti/demo-byt-3kk-vinohrady",
    title: "Ukázkový byt 3+kk (demo)",
    location: "Demonstrační lokalita — Vinohrady",
    disposition: "3+kk",
    areaSqm: 78,
    priceCzk: 6_490_000,
    pricePerSqmCzk: 83_205,
    grossYieldPct: 5.4,
    cashFlowMonthlyCzk: 2_400,
    majetioScore: 72,
    dataQuality: "estimated",
    risk: "medium",
    isDemo: true,
  },
  {
    href: "/nemovitosti/demo-dum-rekonstrukce",
    title: "Ukázkový dům k rekonstrukci (demo)",
    location: "Demonstrační lokalita",
    disposition: "5+1",
    areaSqm: 160,
    priceCzk: 12_400_000,
    pricePerSqmCzk: 77_500,
    grossYieldPct: 2.1,
    cashFlowMonthlyCzk: -1_800,
    majetioScore: 48,
    dataQuality: "incomplete",
    risk: "high",
    isDemo: true,
  },
  {
    href: "/nemovitosti/demo-byt-2kk-brno",
    title: "Ukázkový byt 2+kk (demo)",
    location: "Demonstrační lokalita — Brno",
    disposition: "2+kk",
    areaSqm: 52,
    priceCzk: 4_200_000,
    pricePerSqmCzk: 80_769,
    grossYieldPct: 5.2,
    cashFlowMonthlyCzk: 3_100,
    majetioScore: 76,
    dataQuality: "estimated",
    risk: "low",
    isDemo: true,
  },
  {
    href: "/nemovitosti/demo-byt-2kk-nizka-cena",
    title: "Ukázkový byt 2+kk — nízká cena (demo)",
    location: "Demonstrační lokalita",
    disposition: "2+kk",
    areaSqm: 48,
    priceCzk: 3_890_000,
    pricePerSqmCzk: 81_042,
    grossYieldPct: 6.8,
    cashFlowMonthlyCzk: -2_200,
    majetioScore: 49,
    dataQuality: "incomplete",
    risk: "high",
    isDemo: true,
  },
];

export function getDemoProperty(slug: string): PropertyCardData | undefined {
  return DEMO_PROPERTIES.find((p) => p.href.endsWith(slug));
}
