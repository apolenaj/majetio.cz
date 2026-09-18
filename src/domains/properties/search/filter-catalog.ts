/**
 * Transparent investor presets.
 * Each preset only sets public filter fields — no hidden ranking.
 */

import type { PropertyUrlFilterState } from "@/domains/properties/search/url-state";

export type InvestorPreset = {
  id: string;
  label: string;
  description: string;
  patch: Partial<PropertyUrlFilterState>;
};

export const INVESTOR_PRESETS: InvestorPreset[] = [
  {
    id: "vysoky-vynos",
    label: "Vysoký výnos",
    description: "Jen nabídky, které mají ve štítcích „Vysoký výnos“.",
    patch: { roiOd: 6 },
  },
  {
    id: "cashflow",
    label: "Pozitivní cashflow",
    description: "Jen nabídky, které mají ve štítcích „Pozitivní cashflow“.",
    patch: { cashflowOd: 0 },
  },
  {
    id: "fix-rent",
    label: "Fix & Rent",
    description: "Jen nabídky, které mají ve štítcích „Fix & Rent“.",
    patch: { stav: ["rekonstrukce"], roiOd: 5 },
  },
  {
    id: "pod-odhadem",
    label: "Pod tržním odhadem",
    description: "Jen nabídky, které mají ve štítcích „Pod tržním odhadem“.",
    patch: { diskontOd: 10 },
  },
  {
    id: "stabilni",
    label: "Stabilní pronájem",
    description: "Jen nabídky, které mají ve štítcích „Stabilní pronájem“.",
    patch: { poptavkaOd: 65, obsazenostOd: 95 },
  },
  {
    id: "bez-rekonstrukce",
    label: "Bez rekonstrukce",
    description: "Jen nabídky, které mají ve štítcích „Bez rekonstrukce“.",
    patch: { urovenRekonstrukce: ["bez"] },
  },
];

export const YIELD_QUICK = [4, 5, 6, 7, 8] as const;
export const CASHFLOW_QUICK = [0, 2_500, 5_000, 10_000] as const;
export const PAYBACK_QUICK = [10, 15, 20, 25] as const;
export const DISCOUNT_QUICK = [5, 10, 15, 20] as const;
export const OCCUPANCY_QUICK = [90, 95, 97] as const;
export const SCORE_QUICK = [60, 70, 80, 90] as const;

export const CONSTRUCTION_OPTIONS = [
  { value: "cihla", label: "Cihlová" },
  { value: "panel", label: "Panelová" },
  { value: "drevo", label: "Dřevostavba" },
  { value: "skelet", label: "Skeletová" },
  { value: "smisena", label: "Smíšená" },
  { value: "ostatni", label: "Ostatní" },
] as const;

export const AMENITY_OPTIONS = [
  { value: "balkon", label: "Balkon" },
  { value: "lodzie", label: "Lodžie" },
  { value: "terasa", label: "Terasa" },
  { value: "zahrada", label: "Zahrada" },
  { value: "sklep", label: "Sklep" },
  { value: "garaz", label: "Garáž" },
  { value: "parkovani", label: "Parkovací stání" },
  { value: "vytah", label: "Výtah" },
  { value: "bezbarierovy", label: "Bezbariérový přístup" },
] as const;

export const FURNISHING_OPTIONS = [
  { value: "vybaveno" as const, label: "Vybaveno" },
  { value: "castecne" as const, label: "Částečně vybaveno" },
  { value: "nevybaveno" as const, label: "Nevybaveno" },
];

export const SELLER_OPTIONS = [
  { value: "soukromnik", label: "Soukromník" },
  { value: "rk", label: "Realitní kancelář" },
  { value: "developer", label: "Developer" },
] as const;

export const RENOVATION_LEVELS = [
  { value: "bez", label: "Bez rekonstrukce" },
  { value: "kosmeticka", label: "Kosmetická" },
  { value: "castecna", label: "Částečná" },
  { value: "kompletni", label: "Kompletní" },
  { value: "rozsahla", label: "Rozsáhlá" },
] as const;

export const RISK_OPTIONS = [
  { value: "low", label: "Nízké" },
  { value: "medium", label: "Střední" },
  { value: "high", label: "Vysoké" },
] as const;

export const OFFER_OPTIONS = [
  { value: "prodej" as const, label: "Prodej" },
  { value: "pronajem" as const, label: "Pronájem" },
  { value: "drazba" as const, label: "Dražba", unavailable: true },
  { value: "podil" as const, label: "Podíl", unavailable: true },
] as const;
