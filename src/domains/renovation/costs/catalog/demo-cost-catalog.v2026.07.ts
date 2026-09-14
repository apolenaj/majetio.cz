/**
 * DEMO DATA ONLY — not live market rates.
 * Replace with DB-backed RenovationCostCatalog in production.
 * Version: cost-catalog.v2026.07-demo
 */

import type {
  RenovationCostCatalog,
  RenovationCostCatalogEntry,
} from "./types";

export const DEMO_COST_CATALOG_VERSION = "cost-catalog.v2026.07-demo";

type DemoRateRow = {
  category: RenovationCostCatalogEntry["category"];
  item: string;
  unit: RenovationCostCatalogEntry["unit"];
  qualityLevel: RenovationCostCatalogEntry["qualityLevel"];
  lowCost: number;
  baseCost: number;
  highCost: number;
};

/** DEMO unit rates (CZK major) — illustrative placeholders for development & tests. */
const DEMO_RATES: DemoRateRow[] = [
  { category: "painting", item: "Malířské práce vč. penetrace", unit: "m2", qualityLevel: "economy", lowCost: 120, baseCost: 180, highCost: 260 },
  { category: "painting", item: "Malířské práce vč. penetrace", unit: "m2", qualityLevel: "standard", lowCost: 180, baseCost: 260, highCost: 380 },
  { category: "painting", item: "Malířské práce vč. penetrace", unit: "m2", qualityLevel: "premium", lowCost: 280, baseCost: 420, highCost: 620 },

  { category: "floors", item: "Podlahy — pokládka", unit: "m2", qualityLevel: "economy", lowCost: 450, baseCost: 750, highCost: 1100 },
  { category: "floors", item: "Podlahy — pokládka", unit: "m2", qualityLevel: "standard", lowCost: 800, baseCost: 1200, highCost: 1800 },
  { category: "floors", item: "Podlahy — pokládka", unit: "m2", qualityLevel: "premium", lowCost: 1400, baseCost: 2200, highCost: 3200 },

  { category: "electrical", item: "Elektroinstalace byt", unit: "m2", qualityLevel: "economy", lowCost: 350, baseCost: 550, highCost: 800 },
  { category: "electrical", item: "Elektroinstalace byt", unit: "m2", qualityLevel: "standard", lowCost: 550, baseCost: 850, highCost: 1200 },
  { category: "electrical", item: "Elektroinstalace byt", unit: "m2", qualityLevel: "premium", lowCost: 900, baseCost: 1400, highCost: 2000 },

  { category: "plumbing", item: "Rozvody TZB", unit: "m2", qualityLevel: "standard", lowCost: 400, baseCost: 650, highCost: 950 },
  { category: "plumbing", item: "Rozvody TZB", unit: "celek", qualityLevel: "standard", lowCost: 45000, baseCost: 75000, highCost: 110000 },

  { category: "bathroom", item: "Rekonstrukce koupelny", unit: "mistnost", qualityLevel: "economy", lowCost: 80000, baseCost: 120000, highCost: 170000 },
  { category: "bathroom", item: "Rekonstrukce koupelny", unit: "mistnost", qualityLevel: "standard", lowCost: 120000, baseCost: 180000, highCost: 260000 },
  { category: "bathroom", item: "Rekonstrukce koupelny", unit: "mistnost", qualityLevel: "premium", lowCost: 200000, baseCost: 320000, highCost: 480000 },

  { category: "kitchen", item: "Rekonstrukce kuchyně", unit: "mistnost", qualityLevel: "economy", lowCost: 100000, baseCost: 160000, highCost: 230000 },
  { category: "kitchen", item: "Rekonstrukce kuchyně", unit: "mistnost", qualityLevel: "standard", lowCost: 160000, baseCost: 250000, highCost: 380000 },
  { category: "kitchen", item: "Rekonstrukce kuchyně", unit: "mistnost", qualityLevel: "premium", lowCost: 280000, baseCost: 450000, highCost: 680000 },

  { category: "windows", item: "Výměna oken", unit: "ks", qualityLevel: "economy", lowCost: 8000, baseCost: 14000, highCost: 22000 },
  { category: "windows", item: "Výměna oken", unit: "ks", qualityLevel: "standard", lowCost: 14000, baseCost: 22000, highCost: 35000 },
  { category: "windows", item: "Výměna oken", unit: "ks", qualityLevel: "premium", lowCost: 25000, baseCost: 40000, highCost: 65000 },

  { category: "lighting", item: "Osvětlení — materiál + montáž", unit: "celek", qualityLevel: "economy", lowCost: 15000, baseCost: 28000, highCost: 45000 },
  { category: "lighting", item: "Osvětlení — materiál + montáž", unit: "celek", qualityLevel: "standard", lowCost: 28000, baseCost: 45000, highCost: 70000 },
  { category: "lighting", item: "Osvětlení — materiál + montáž", unit: "celek", qualityLevel: "premium", lowCost: 50000, baseCost: 85000, highCost: 130000 },

  { category: "demolition", item: "Demontáže a odvoz", unit: "mistnost", qualityLevel: "standard", lowCost: 8000, baseCost: 15000, highCost: 25000 },
  { category: "demolition", item: "Demontáže a odvoz", unit: "celek", qualityLevel: "standard", lowCost: 35000, baseCost: 65000, highCost: 110000 },

  { category: "walls", item: "Úpravy stěn", unit: "m2", qualityLevel: "standard", lowCost: 350, baseCost: 550, highCost: 850 },
  { category: "ceilings", item: "Úpravy stropů", unit: "m2", qualityLevel: "standard", lowCost: 300, baseCost: 480, highCost: 750 },

  { category: "heating", item: "Vytápění — rozvody / radiátory", unit: "m2", qualityLevel: "standard", lowCost: 400, baseCost: 650, highCost: 950 },
  { category: "heating", item: "Vytápění — rozvody / radiátory", unit: "celek", qualityLevel: "standard", lowCost: 55000, baseCost: 95000, highCost: 145000 },

  { category: "HVAC", item: "Větrání / klimatizace", unit: "celek", qualityLevel: "standard", lowCost: 45000, baseCost: 85000, highCost: 140000 },
  { category: "HVAC", item: "Větrání / klimatizace", unit: "celek", qualityLevel: "premium", lowCost: 90000, baseCost: 160000, highCost: 260000 },

  { category: "doors", item: "Interiérové dveře vč. zárubní", unit: "ks", qualityLevel: "standard", lowCost: 6000, baseCost: 10000, highCost: 18000 },

  { category: "built_in_furniture", item: "Vestavěný nábytek", unit: "celek", qualityLevel: "economy", lowCost: 40000, baseCost: 70000, highCost: 110000 },
  { category: "built_in_furniture", item: "Vestavěný nábytek", unit: "celek", qualityLevel: "standard", lowCost: 80000, baseCost: 140000, highCost: 220000 },
  { category: "built_in_furniture", item: "Vestavěný nábytek", unit: "celek", qualityLevel: "premium", lowCost: 150000, baseCost: 280000, highCost: 450000 },

  { category: "insulation", item: "Zateplení", unit: "m2", qualityLevel: "standard", lowCost: 800, baseCost: 1400, highCost: 2200 },
  { category: "facade", item: "Fasáda", unit: "m2", qualityLevel: "standard", lowCost: 1200, baseCost: 2000, highCost: 3200 },

  { category: "structural", item: "Statické zásahy", unit: "celek", qualityLevel: "standard", lowCost: 150000, baseCost: 350000, highCost: 750000 },

  { category: "other", item: "Ostatní práce — obecný fallback", unit: "celek", qualityLevel: "standard", lowCost: 20000, baseCost: 45000, highCost: 90000 },
];

function toEntry(row: DemoRateRow): RenovationCostCatalogEntry {
  return {
    id: `demo-${row.category}-${row.unit}-${row.qualityLevel}`,
    category: row.category,
    item: row.item,
    unit: row.unit,
    qualityLevel: row.qualityLevel,
    lowCost: row.lowCost,
    baseCost: row.baseCost,
    highCost: row.highCost,
    currency: "CZK",
    market: "CZ",
    region: "national",
    validFrom: "2026-07-01",
    validTo: null,
    source: "majetio-demo-catalog",
    version: DEMO_COST_CATALOG_VERSION,
  };
}

export const DEMO_COST_CATALOG_V2026_07: RenovationCostCatalog = {
  version: DEMO_COST_CATALOG_VERSION,
  market: "CZ",
  isDemo: true,
  entries: DEMO_RATES.map(toEntry),
  effectiveFrom: "2026-07-01",
  source: "majetio-demo-catalog — NOT FOR PRODUCTION PRICING",
};
