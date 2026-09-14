/**
 * DEMO DATA ONLY — illustrative HypotekaJasne partner offers.
 * NOT live market rates. Replace when production API is connected.
 */

import type { ExternalMortgageOffer } from "../schemas";

export const DEMO_MORTGAGE_OFFERS: ExternalMortgageOffer[] = [
  {
    externalId: "demo-hj-bank-a-fix-5",
    bank: { id: "bank-a", name: "Demo Banka A" },
    product: { name: "Hypotéka Standard 5 let", slug: "standard-5" },
    rates: { interestFromPct: 5.19, aprFromPct: 5.42, fixationYears: 5 },
    ltv: { minPct: 0, maxPct: 80 },
    fees: { arrangementCzk: 0, valuationCzk: 3500 },
    termsUrl: "https://www.hypotekajasne.cz/produkty/standard-5",
  },
  {
    externalId: "demo-hj-bank-b-fix-3",
    bank: { id: "bank-b", name: "Demo Banka B" },
    product: { name: "Start 3 roky", slug: "start-3" },
    rates: { interestFromPct: 5.49, aprFromPct: 5.71, fixationYears: 3 },
    ltv: { minPct: 0, maxPct: 85 },
    fees: { arrangementCzk: 1200 },
    isSponsored: true,
    termsUrl: "https://www.hypotekajasne.cz/produkty/start-3",
  },
  {
    externalId: "demo-hj-bank-c-fix-10",
    bank: { id: "bank-c", name: "Demo Banka C" },
    product: { name: "Premium Fix 10", slug: "premium-10" },
    rates: { interestFromPct: 5.89, aprFromPct: 6.05, fixationYears: 10 },
    ltv: { minPct: 10, maxPct: 70 },
    fees: { arrangementCzk: 2900, valuationCzk: 4200 },
  },
  {
    externalId: "demo-hj-bank-d-anomaly",
    bank: { id: "bank-d", name: "Demo Banka D (anomaly)" },
    product: { name: "Review Required Sample", slug: "review-sample" },
    rates: { interestFromPct: 8.5, aprFromPct: 5.1, fixationYears: null },
    ltv: { maxPct: 90 },
  },
];
