import {
  CZ_MORTGAGE_REGULATORY_CATALOG,
} from "@/config/mortgage-regulatory/cz-market.v2026.07";
import type {
  MortgageMarketCountry,
  MortgageRegulatoryConfig,
} from "@/config/mortgage-regulatory/types";

const CATALOG_BY_COUNTRY: Record<MortgageMarketCountry, readonly MortgageRegulatoryConfig[]> = {
  CZ: CZ_MORTGAGE_REGULATORY_CATALOG,
};

function isActiveOnDate(
  config: MortgageRegulatoryConfig,
  at: Date,
): boolean {
  const day = at.toISOString().slice(0, 10);
  if (day < config.validFrom) return false;
  if (config.validTo && day > config.validTo) return false;
  return true;
}

export function resolveActiveMortgageRegulatoryConfig(input: {
  marketCountry?: string;
  at?: Date;
}): MortgageRegulatoryConfig | null {
  const country = (input.marketCountry ?? "CZ").toUpperCase() as MortgageMarketCountry;
  const catalog = CATALOG_BY_COUNTRY[country];
  if (!catalog) return null;

  const at = input.at ?? new Date();
  const active = catalog
    .filter((c) => isActiveOnDate(c, at))
    .sort((a, b) => b.validFrom.localeCompare(a.validFrom));

  return active[0] ?? null;
}

export function getApplicableMaxLtvPct(input: {
  propertyPurpose: "primary_residence" | "investment";
  marketCountry?: string;
  at?: Date;
}): number | null {
  const config = resolveActiveMortgageRegulatoryConfig({
    marketCountry: input.marketCountry,
    at: input.at,
  });
  if (!config) return null;

  return input.propertyPurpose === "primary_residence"
    ? config.limits.maxLtvPctPrimaryResidence
    : config.limits.maxLtvPctInvestment;
}
