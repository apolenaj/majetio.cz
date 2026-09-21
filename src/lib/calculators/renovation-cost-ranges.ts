/**
 * Modelové orientační sazby — ne cenová nabídka stavebních prací.
 * Jednotky jsou Kč. Aktualizujte na jednom místě.
 */
export type RenovationUnit = "m2" | "unit";

export type RenovationItemId =
  | "floors"
  | "paint"
  | "electro"
  | "plumbing"
  | "bathroom"
  | "kitchen"
  | "windows"
  | "doors"
  | "heating"
  | "plaster"
  | "roof"
  | "facade"
  | "insulation"
  | "other";

export type RenovationCostRange = {
  id: RenovationItemId;
  label: string;
  unit: RenovationUnit;
  low: number;
  mid: number;
  high: number;
  houseOnly: boolean;
};

export const RENOVATION_COST_RANGES: RenovationCostRange[] = [
  { id: "floors", label: "Podlahy", unit: "m2", low: 900, mid: 1_600, high: 2_600, houseOnly: false },
  { id: "paint", label: "Malování", unit: "m2", low: 180, mid: 280, high: 420, houseOnly: false },
  { id: "electro", label: "Elektro", unit: "m2", low: 700, mid: 1_200, high: 1_900, houseOnly: false },
  { id: "plumbing", label: "Voda / odpady", unit: "unit", low: 35_000, mid: 70_000, high: 120_000, houseOnly: false },
  { id: "bathroom", label: "Koupelna", unit: "unit", low: 80_000, mid: 140_000, high: 220_000, houseOnly: false },
  { id: "kitchen", label: "Kuchyně", unit: "unit", low: 90_000, mid: 160_000, high: 280_000, houseOnly: false },
  { id: "windows", label: "Okna", unit: "unit", low: 40_000, mid: 80_000, high: 140_000, houseOnly: false },
  { id: "doors", label: "Dveře", unit: "unit", low: 12_000, mid: 25_000, high: 45_000, houseOnly: false },
  { id: "heating", label: "Topení", unit: "unit", low: 40_000, mid: 80_000, high: 150_000, houseOnly: false },
  { id: "plaster", label: "Omítky / sádrokarton", unit: "m2", low: 350, mid: 650, high: 1_100, houseOnly: false },
  { id: "roof", label: "Střecha", unit: "unit", low: 180_000, mid: 320_000, high: 520_000, houseOnly: true },
  { id: "facade", label: "Fasáda", unit: "m2", low: 1_200, mid: 1_900, high: 2_800, houseOnly: true },
  { id: "insulation", label: "Zateplení", unit: "m2", low: 1_400, mid: 2_200, high: 3_200, houseOnly: true },
  { id: "other", label: "Další práce", unit: "unit", low: 20_000, mid: 50_000, high: 100_000, houseOnly: false },
];

export const RENOVATION_RANGES_NOTE =
  "Modelové orientační hodnoty, ne aktuální ceník ani nabídka zhotovitele.";
