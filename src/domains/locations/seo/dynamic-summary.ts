/**
 * Dynamic market summary — factual sentences from metric values only.
 * Never invent trends or narrative filler beyond what metrics provide.
 */

import type { LocationPageProfile } from "@/domains/locations/types/location-page";

function findMetric(profile: LocationPageProfile, key: string) {
  return profile.summary.find((m) => m.key === key) ?? null;
}

/**
 * Build Czech market summary paragraphs from profile metrics.
 * Returns empty string when insufficient data (caller should not invent copy).
 */
export function buildDynamicMarketSummary(profile: LocationPageProfile): string {
  const asking = findMetric(profile, "property_market.median_asking_price_sqm");
  const transaction = findMetric(
    profile,
    "property_market.median_transaction_price_sqm",
  );
  const rent = findMetric(profile, "rental_market.median_asking_rent_sqm");
  const yieldMetric = findMetric(profile, "investment.gross_rental_yield");
  const dom = profile.supplyDemand.medianDom;
  const listings = profile.supplyDemand.activeListings;

  const parts: string[] = [];

  if (asking?.value != null && asking.formattedValue) {
    let sentence = `Medián nabídkových cen v lokalitě ${profile.location.publicLabel} činil ${asking.formattedValue}`;
    if (asking.sampleCount) {
      sentence += ` (vzorek ${asking.sampleCount.toLocaleString("cs-CZ")} pozorování)`;
    }
    if (asking.changeLabel) {
      sentence += `, meziročně ${asking.changeLabel}`;
    }
    sentence += ` · období: ${profile.periodLabel}.`;
    parts.push(sentence);
  }

  if (transaction?.value != null && transaction.formattedValue) {
    let sentence = `Medián transakčních cen byl ${transaction.formattedValue}`;
    if (asking?.value != null && transaction.value < asking.value) {
      const gap = Math.round((1 - transaction.value / asking.value) * 100);
      sentence += ` — zhruba ${gap} % pod mediánem nabídky`;
    }
    if (transaction.sampleCount) {
      sentence += ` (vzorek ${transaction.sampleCount.toLocaleString("cs-CZ")})`;
    }
    sentence += ".";
    parts.push(sentence);
  }

  if (rent?.value != null && rent.formattedValue) {
    let sentence = `Medián nabídkového nájmu činil ${rent.formattedValue}`;
    if (yieldMetric?.value != null && yieldMetric.formattedValue) {
      sentence += `; hrubý nájemní výnos z dostupných párů cena–nájem ${yieldMetric.formattedValue}`;
    }
    sentence += ".";
    parts.push(sentence);
  }

  if (listings?.value != null && dom?.value != null) {
    parts.push(
      `Na trhu bylo evidováno ${listings.formattedValue} aktivních inzerátů, medián days on market ${dom.formattedValue}.`,
    );
  }

  return parts.join(" ");
}
