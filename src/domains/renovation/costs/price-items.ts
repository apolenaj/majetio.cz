/**
 * Price scope line items from RenovationCostCatalog + regional coefficient.
 */

import { lookupCatalogEntry, type RenovationCostCatalog } from "./catalog";
import { costBandFromUnitRates, type CostBand } from "./bands";
import { costBucketForCategory } from "./furnishing";
import type { CostWarning, PricedRenovationItem } from "./types";
import type { RenovationItem } from "../scope/types";

export type PriceItemsInput = {
  items: RenovationItem[];
  catalog: RenovationCostCatalog;
  regionalCoefficient: number;
  locationRegion: "praha" | "cz_other";
  propertyAreaSqm?: number | null;
};

export type PriceItemsResult = {
  pricedItems: PricedRenovationItem[];
  constructionBands: CostBand[];
  furnishingBands: CostBand[];
  warnings: CostWarning[];
};

function resolveQuantity(
  item: RenovationItem,
  propertyAreaSqm?: number | null,
): { quantity: number | null; inferred: boolean } {
  if (item.quantity !== null && item.quantity > 0) {
    return { quantity: item.quantity, inferred: false };
  }

  if (item.unit === "m2" && propertyAreaSqm != null && propertyAreaSqm > 0) {
    return { quantity: Math.round(propertyAreaSqm), inferred: true };
  }

  if (item.unit === "mistnost") {
    return { quantity: 1, inferred: true };
  }

  if (item.unit === "celek") {
    return { quantity: 1, inferred: true };
  }

  return { quantity: null, inferred: false };
}

export function priceScopeItems(input: PriceItemsInput): PriceItemsResult {
  const warnings: CostWarning[] = [];
  const pricedItems: PricedRenovationItem[] = [];
  const constructionBands: CostBand[] = [];
  const furnishingBands: CostBand[] = [];

  if (input.catalog.isDemo) {
    warnings.push({
      code: "demo_catalog",
      severity: "info",
      message:
        "Odhad vychází z demo ceníku — není založen na aktuálních tržních datech.",
    });
  }

  for (const item of input.items) {
    const unit = item.unit ?? "celek";
    const { quantity, inferred } = resolveQuantity(item, input.propertyAreaSqm);

    if (quantity === null) {
      warnings.push({
        code: "missing_quantity",
        severity: "warning",
        message: `Chybí množství pro položku „${item.scope}“ (${item.category}) — nelze nacenit.`,
      });
      pricedItems.push({
        ...item,
        costLow: null,
        costBase: null,
        costHigh: null,
        catalogEntryId: null,
        pricingNotes: "Chybí množství",
        costBucket: costBucketForCategory(item.category),
      });
      continue;
    }

    const catalogEntry = lookupCatalogEntry(input.catalog, {
      category: item.category,
      unit,
      qualityLevel: item.qualityLevel,
      region: input.locationRegion,
    });

    if (!catalogEntry) {
      warnings.push({
        code: "unpriced_items",
        severity: "critical",
        message: `Položka „${item.scope}“ nemá odpovídající záznam v ceníku.`,
      });
      pricedItems.push({
        ...item,
        quantity,
        costLow: null,
        costBase: null,
        costHigh: null,
        catalogEntryId: null,
        pricingNotes: "Chybí záznam v ceníku",
        costBucket: costBucketForCategory(item.category),
      });
      continue;
    }

    const usedFallback =
      catalogEntry.category === "other" && item.category !== "other";
    if (usedFallback) {
      warnings.push({
        code: "catalog_fallback",
        severity: "warning",
        message: `Položka „${item.scope}“ naceněna obecným fallbackem ceníku.`,
      });
    }

    const band = costBandFromUnitRates(
      catalogEntry.lowCost,
      catalogEntry.baseCost,
      catalogEntry.highCost,
      quantity,
      input.regionalCoefficient,
    );

    const notes: string[] = [];
    if (inferred) {
      notes.push("Množství odhadnuto");
    }
    if (usedFallback) {
      notes.push("Fallback ceník");
    }
    if (input.regionalCoefficient !== 1) {
      notes.push(
        `Regionální koeficient ×${input.regionalCoefficient.toFixed(2)}`,
      );
    }

    const priced: PricedRenovationItem = {
      ...item,
      quantity,
      unit,
      costLow: band.lowCzk,
      costBase: band.baseCzk,
      costHigh: band.highCzk,
      catalogEntryId: catalogEntry.id,
      pricingNotes: notes.length > 0 ? notes.join("; ") : null,
      costBucket: costBucketForCategory(item.category),
    };
    pricedItems.push(priced);

    if (priced.costBucket === "furnishing") {
      furnishingBands.push(band);
    } else {
      constructionBands.push(band);
    }
  }

  return { pricedItems, constructionBands, furnishingBands, warnings };
}
