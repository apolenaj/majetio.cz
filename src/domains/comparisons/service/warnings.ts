import type { ComparisonWarning } from "../types";
import { appendCrossMarketWarnings } from "@/domains/comparisons/cross-market/warnings";

export type WarningPropertyInput = {
  propertyId: string;
  title: string;
  propertyType: string | null;
  /** e.g. long_term_rent / short_term / own_home tags */
  strategyTags: string[];
  valuationConfidence: "high" | "medium" | "low" | null;
  marketCode?: string | null;
  currency?: string | null;
};

function isHouse(type: string | null): boolean {
  if (!type) return false;
  const t = type.toUpperCase();
  return t === "HOUSE" || t.includes("HOUSE") || t.includes("DŮM") || t.includes("DUM");
}

function isApartment(type: string | null): boolean {
  if (!type) return false;
  const t = type.toUpperCase();
  return (
    t === "APARTMENT" ||
    t.includes("APARTMENT") ||
    t.includes("BYT") ||
    t.includes("FLAT")
  );
}

function isShortTerm(tags: string[]): boolean {
  return tags.some((t) =>
    /short|airbnb|krátkodob|kratkodob|str/i.test(t),
  );
}

function isLongTerm(tags: string[]): boolean {
  return tags.some((t) =>
    /long|dlouhodob|pronájem|pronajem|rent/i.test(t),
  );
}

export function buildComparisonWarnings(
  properties: WarningPropertyInput[],
): ComparisonWarning[] {
  const warnings: ComparisonWarning[] = [];
  if (properties.length < 2) return warnings;

  const types = properties.map((p) => p.propertyType);
  const hasApt = types.some(isApartment);
  const hasHouse = types.some(isHouse);
  if (hasApt && hasHouse) {
    warnings.push({
      id: "apple-orange-type",
      severity: "warning",
      title: "Srovnáváte různé typy nemovitostí",
      body: "Byt a dům mají jinou likviditu, náklady i financování. Metriky berte s rezervou — nejde o jablka s jablky.",
    });
  }

  const shortOnes = properties.filter((p) => isShortTerm(p.strategyTags));
  const longOnes = properties.filter((p) => isLongTerm(p.strategyTags));
  if (shortOnes.length > 0 && longOnes.length > 0) {
    warnings.push({
      id: "apple-orange-strategy",
      severity: "warning",
      title: "Krátkodobý vs. dlouhodobý záměr",
      body: "Výnosy a rizika short-term a long-term se nemíchají. Porovnávejte v kontextu stejné strategie.",
    });
  }

  const confidences = properties
    .map((p) => p.valuationConfidence)
    .filter((c): c is NonNullable<typeof c> => c != null);
  if (confidences.length >= 2) {
    const hasHigh = confidences.includes("high");
    const hasLow = confidences.includes("low");
    if (hasHigh && hasLow) {
      warnings.push({
        id: "valuation-confidence-spread",
        severity: "info",
        title: "Rozdílná spolehlivost odhadů",
        body: "Některé odhady mají vysokou, jiné nízkou valuation confidence. Nesrovnávejte je jako stejně přesná čísla.",
      });
    }
  }

  const missingConfidence = properties.filter((p) => p.valuationConfidence == null);
  if (missingConfidence.length > 0 && properties.length > missingConfidence.length) {
    warnings.push({
      id: "valuation-confidence-missing",
      severity: "info",
      title: "Chybí spolehlivost odhadu",
      body: `U ${missingConfidence.length === 1 ? "jedné nemovitosti" : "některých nemovitostí"} není k dispozici valuation confidence — buňky ukazují „Není k dispozici“, nikoli nulu.`,
    });
  }

  const marketCodes = properties
    .map((p) => p.marketCode)
    .filter((m): m is string => Boolean(m));
  const currencies = properties
    .map((p) => p.currency)
    .filter((c): c is string => Boolean(c));

  if (marketCodes.length >= 2 || currencies.length >= 2) {
    return appendCrossMarketWarnings(warnings, { marketCodes, currencies });
  }

  return warnings;
}
