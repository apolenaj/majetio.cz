export { AeBayutStylePropertySourceAdapter } from "./ae-bayut-style";
export { EsIdealistaStylePropertySourceAdapter } from "./es-idealista-style";

import type { PropertySourceAdapter } from "@/domains/property-sources/service/adapter";
import { AeBayutStylePropertySourceAdapter } from "./ae-bayut-style";
import { EsIdealistaStylePropertySourceAdapter } from "./es-idealista-style";
import { GenericJsonPropertySourceAdapter } from "@/domains/property-sources/service/generic-json-adapter";

/**
 * Resolve import adapter by provider id / market.
 * Each provider maps onto canonical NormalizedListing (+ typed extensions).
 */
export function resolvePropertyImportAdapter(input: {
  provider: string;
  marketCode?: string;
}): PropertySourceAdapter {
  const provider = input.provider.trim().toLowerCase();
  const market = input.marketCode?.trim().toUpperCase();

  if (provider === "bayut" || provider === "propertyfinder") {
    return new AeBayutStylePropertySourceAdapter(provider);
  }
  if (provider === "idealista") {
    return new EsIdealistaStylePropertySourceAdapter(provider);
  }
  if (market === "AE") {
    return new AeBayutStylePropertySourceAdapter(provider || "bayut");
  }
  if (market === "ES") {
    return new EsIdealistaStylePropertySourceAdapter(provider || "idealista");
  }
  return new GenericJsonPropertySourceAdapter(provider || "generic");
}
