/**
 * Client/demo filter application from URL state (Prompt 8 Part 2).
 */

import type {
  PublicPropertyDto,
  PublicPropertyListItemDto,
} from "@/domains/properties/service/dto";
import { fuzzyIncludes } from "./text-match";
import {
  KVALITA_OPTIONS,
  STAV_OPTIONS,
  TYP_OPTIONS,
  VLASTNICTVI_OPTIONS,
  type PropertyUrlFilterState,
} from "./url-state";
import { listingMatchesRegions } from "./regions";
import { hasComputedInvestmentData, metricInRange } from "./metric-filter";

const CONSTRUCTION_TO_ENUM: Record<string, string> = {
  cihla: "BRICK",
  panel: "PANEL",
  drevo: "WOOD",
  skelet: "STEEL",
  smisena: "MIXED",
  ostatni: "OTHER",
};

const AMENITY_TO_FIELD: Record<string, string> = {
  balkon: "balcony",
  lodzie: "loggia",
  terasa: "terrace",
  zahrada: "garden",
  sklep: "cellar",
  garaz: "garage",
  parkovani: "parking",
  vytah: "elevator",
  bezbarierovy: "barrierFree",
};

export type SearchableListing = PublicPropertyListItemDto & {
  energyRating?: string | null;
  ownershipType?: string | null;
  condition?: string | null;
  landArea?: number | null;
  strategySlugs?: string[];
  status?: string;
  freshness?: string | null;
  description?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  completenessScore?: number | null;
  priceHistory?: PublicPropertyDto["priceHistory"];
  sources?: PublicPropertyDto["sources"];
  fieldConflicts?: PublicPropertyDto["fieldConflicts"];
  lastSeenAt?: string | null;
  visibility?: string;
  /** Optional capex estimate for renovation-range filters. */
  estimatedRenovationCostCzk?: number | null;
  transactionType?: string | null;
  floorArea?: number | null;
  floor?: number | null;
  floorsTotal?: number | null;
  yearBuilt?: number | null;
  yearRenovated?: number | null;
  constructionType?: string | null;
  hasElevator?: boolean | null;
  isOffPlan?: boolean | null;
  listingOwnerKind?: string | null;
  organizationId?: string | null;
  originalAskingPrice?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  netYieldPct?: number | null;
  estimatedRentMonthlyCzk?: number | null;
  rentPerSqm?: number | null;
  cashOnCashPct?: number | null;
  paybackYears?: number | null;
  tenantDemandScore?: number | null;
  estimatedOccupancyMinPct?: number | null;
  estimatedOccupancyMaxPct?: number | null;
  discountToEstimatedValuePct?: number | null;
  dataConfidencePct?: number | null;
  yieldAfterRenovationPct?: number | null;
  allInCostCzk?: number | null;
  renovationLevel?: string | null;
  investmentRisk?: string | null;
  hasInvestmentSnapshot?: boolean | null;
  renovationCostMinCzk?: number | null;
  renovationCostMaxCzk?: number | null;
  features?: Record<string, boolean> | null;
};

export function applyUrlFiltersToListings(
  listings: SearchableListing[],
  state: PropertyUrlFilterState,
): SearchableListing[] {
  let items = [...listings];

  const text = state.q || state.lokalita;
  if (text) {
    items = items.filter((p) => {
      const blob = [
        p.title,
        p.location.label,
        p.location.city,
        p.location.district,
        p.location.region,
        ...(p.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ");
      return fuzzyIncludes(blob, text);
    });
  }

  if (state.cenaOd != null) {
    items = items.filter(
      (p) => p.askingPrice != null && p.askingPrice >= state.cenaOd!,
    );
  }
  if (state.cenaDo != null) {
    items = items.filter(
      (p) => p.askingPrice == null || p.askingPrice <= state.cenaDo!,
    );
  }

  if (state.typ.length) {
    const types = new Set<string>();
    for (const t of state.typ) {
      const mapped = TYP_OPTIONS.find((o) => o.value === t)?.propertyType;
      if (mapped) types.add(mapped);
    }
    items = items.filter((p) => types.has(p.propertyType));
  }

  if (state.dispozice.length) {
    const layouts = new Set(state.dispozice.map((d) => d.toLowerCase()));
    items = items.filter((p) => {
      const layout = (p.layout ?? "").toLowerCase();
      return layouts.has(layout);
    });
  }

  if (state.plochaOd != null) {
    items = items.filter(
      (p) => p.usableArea != null && p.usableArea >= state.plochaOd!,
    );
  }
  if (state.plochaDo != null) {
    items = items.filter(
      (p) => p.usableArea == null || p.usableArea <= state.plochaDo!,
    );
  }

  if (state.pozemekOd != null) {
    items = items.filter((p) => (p.landArea ?? 0) >= state.pozemekOd!);
  }
  if (state.pozemekDo != null) {
    items = items.filter(
      (p) => p.landArea == null || p.landArea <= state.pozemekDo!,
    );
  }

  if (state.stav.length) {
    const conditions = new Set<string>();
    for (const s of state.stav) {
      const mapped = STAV_OPTIONS.find((o) => o.value === s)?.condition;
      if (mapped) conditions.add(mapped);
    }
    items = items.filter((p) => {
      if (!p.condition) return true;
      return conditions.has(p.condition);
    });
  }

  if (state.vlastnictvi.length) {
    const ownerships = new Set<string>();
    for (const v of state.vlastnictvi) {
      const mapped = VLASTNICTVI_OPTIONS.find((o) => o.value === v)?.ownership;
      if (mapped) ownerships.add(mapped);
    }
    items = items.filter((p) => {
      if (!p.ownershipType) return true;
      return ownerships.has(p.ownershipType);
    });
  }

  if (state.energie.length) {
    const set = new Set(state.energie.map((e) => e.toUpperCase()));
    items = items.filter((p) => {
      if (!p.energyRating) return true;
      return set.has(p.energyRating.toUpperCase());
    });
  }

  if (state.strategie.length) {
    items = items.filter((p) => {
      const slugs = p.strategySlugs ?? [];
      const tags = (p.tags ?? []).map((t) => t.toLowerCase());
      return state.strategie.some((s) => {
        if (slugs.includes(s)) return true;
        if (s.includes("pronajem") && tags.some((t) => t.includes("pronájem") || t.includes("pronajem"))) {
          return true;
        }
        if (s === "rekonstrukce" && tags.some((t) => t.includes("rekonstruk"))) {
          return true;
        }
        if (s === "vlastni-bydleni") return true; // soft demo match
        return false;
      });
    });
  }

  if (state.kvalita.length) {
    const qualities = new Set<string>();
    for (const k of state.kvalita) {
      const mapped = KVALITA_OPTIONS.find((o) => o.value === k)?.dataQuality;
      if (mapped) qualities.add(mapped);
    }
    items = items.filter(
      (p) => p.dataQuality != null && qualities.has(p.dataQuality),
    );
  }

  if (state.nabidka === "prodej") {
    items = items.filter((p) => !p.transactionType || p.transactionType === "SALE");
  } else if (state.nabidka === "pronajem") {
    items = items.filter((p) => p.transactionType === "RENT");
  }

  if (state.cenaM2Od != null) {
    items = items.filter(
      (p) => p.pricePerSqm != null && p.pricePerSqm >= state.cenaM2Od!,
    );
  }
  if (state.cenaM2Do != null) {
    items = items.filter(
      (p) => p.pricePerSqm == null || p.pricePerSqm <= state.cenaM2Do!,
    );
  }
  if (state.plochaCelkovaOd != null) {
    items = items.filter(
      (p) => p.floorArea != null && p.floorArea >= state.plochaCelkovaOd!,
    );
  }
  if (state.plochaCelkovaDo != null) {
    items = items.filter(
      (p) => p.floorArea == null || p.floorArea <= state.plochaCelkovaDo!,
    );
  }

  if (state.typStavby.length) {
    const types = new Set(
      state.typStavby
        .map((value) => CONSTRUCTION_TO_ENUM[value])
        .filter(Boolean),
    );
    items = items.filter((p) => !p.constructionType || types.has(p.constructionType));
  }

  if (state.prislusenstvi.length) {
    const fields = state.prislusenstvi
      .map((value) => AMENITY_TO_FIELD[value])
      .filter((field): field is string => Boolean(field));
    items = items.filter((p) => {
      if (!p.features) return true;
      return fields.every((field) => p.features?.[field] === true);
    });
  }

  if (state.patroOd != null) {
    items = items.filter((p) => p.floor == null || p.floor >= state.patroOd!);
  }
  if (state.patroDo != null) {
    items = items.filter((p) => p.floor == null || p.floor <= state.patroDo!);
  }
  if (state.prizemi) {
    items = items.filter((p) => p.floor == null || p.floor === 0);
  }
  if (state.rokOd != null) {
    items = items.filter((p) => p.yearBuilt == null || p.yearBuilt >= state.rokOd!);
  }
  if (state.rokDo != null) {
    items = items.filter((p) => p.yearBuilt == null || p.yearBuilt <= state.rokDo!);
  }
  if (state.bezCenyNaVyzadani) {
    items = items.filter((p) => p.askingPrice != null);
  }
  if (state.bezRezervovanych) {
    items = items.filter((p) => p.status !== "RESERVED");
  }
  if (state.pouzeZlevnene) {
    items = items.filter(
      (p) =>
        p.originalAskingPrice == null ||
        (p.askingPrice != null && p.originalAskingPrice > p.askingPrice),
    );
  }
  if (state.prodejce.includes("soukromnik")) {
    items = items.filter((p) => !p.listingOwnerKind && !p.organizationId);
  }
  if (state.typ.includes("projekty")) {
    items = items.filter((p) => p.isOffPlan !== false);
  }

  const only = state.jenVypoctene === true;
  if (only) {
    items = items.filter((p) => hasComputedInvestmentData(p));
  }

  items = items.filter(
    (p) =>
      metricInRange(p.grossYieldPct, state.roiOd, state.vynosDo, only) &&
      metricInRange(p.netYieldPct, state.cistyVynosOd, state.cistyVynosDo, only) &&
      metricInRange(p.cashFlowMonthlyCzk, state.cashflowOd, state.cashflowDo, only) &&
      metricInRange(p.cashOnCashPct, state.cocOd, state.cocDo, only) &&
      metricInRange(p.paybackYears, state.navratnostOd, state.navratnostDo, only) &&
      metricInRange(p.estimatedRentMonthlyCzk, state.najemOd, state.najemDo, only) &&
      metricInRange(p.rentPerSqm, state.najemM2Od, state.najemM2Do, only) &&
      metricInRange(
        p.renovationCostMinCzk ?? p.estimatedRenovationCostCzk,
        state.rekonstrukceOd,
        state.rekonstrukceDo,
        only,
      ) &&
      metricInRange(p.allInCostCzk, state.allInOd, state.allInDo, only) &&
      metricInRange(p.discountToEstimatedValuePct, state.diskontOd, undefined, only) &&
      metricInRange(p.tenantDemandScore, state.poptavkaOd, state.poptavkaDo, only) &&
      metricInRange(
        p.estimatedOccupancyMinPct,
        state.obsazenostOd,
        state.obsazenostDo,
        only,
      ) &&
      metricInRange(p.majetioScore, state.scoreOd, state.scoreDo, only) &&
      metricInRange(p.dataConfidencePct, state.duveraOd, undefined, only) &&
      metricInRange(
        p.yieldAfterRenovationPct,
        state.vynosPoRekonstrukci,
        undefined,
        only,
      ),
  );

  if (state.urovenRekonstrukce.length) {
    const levels = new Set(state.urovenRekonstrukce);
    items = items.filter(
      (p) => p.renovationLevel == null || levels.has(p.renovationLevel),
    );
  }
  if (state.riziko.length) {
    const risks = new Set(state.riziko);
    items = items.filter(
      (p) => p.investmentRisk == null || risks.has(p.investmentRisk),
    );
  }

  if (state.kraje.length) {
    items = items.filter((p) => listingMatchesRegions(p, state.kraje));
  }

  items = sortListings(items, state.razeni);

  return items;
}

function compareNullable(
  a: number | null | undefined,
  b: number | null | undefined,
  direction: "asc" | "desc",
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return direction === "asc" ? a - b : b - a;
}

function sortListings(
  items: SearchableListing[],
  razeni: PropertyUrlFilterState["razeni"],
): SearchableListing[] {
  const sorted = [...items];
  switch (razeni) {
    case "price_asc":
      sorted.sort((a, b) => (a.askingPrice ?? 0) - (b.askingPrice ?? 0));
      break;
    case "price_desc":
      sorted.sort((a, b) => (b.askingPrice ?? 0) - (a.askingPrice ?? 0));
      break;
    case "price_per_sqm":
      sorted.sort((a, b) => (b.pricePerSqm ?? 0) - (a.pricePerSqm ?? 0));
      break;
    case "price_per_sqm_asc":
      sorted.sort((a, b) => (a.pricePerSqm ?? 0) - (b.pricePerSqm ?? 0));
      break;
    case "area_desc":
      sorted.sort((a, b) => (b.usableArea ?? 0) - (a.usableArea ?? 0));
      break;
    case "rent_desc":
      sorted.sort((a, b) =>
        compareNullable(a.estimatedRentMonthlyCzk, b.estimatedRentMonthlyCzk, "desc"),
      );
      break;
    case "gross_yield_desc":
      sorted.sort((a, b) => compareNullable(a.grossYieldPct, b.grossYieldPct, "desc"));
      break;
    case "net_yield_desc":
      sorted.sort((a, b) => compareNullable(a.netYieldPct, b.netYieldPct, "desc"));
      break;
    case "cashflow_desc":
      sorted.sort((a, b) =>
        compareNullable(a.cashFlowMonthlyCzk, b.cashFlowMonthlyCzk, "desc"),
      );
      break;
    case "cash_on_cash_desc":
      sorted.sort((a, b) => compareNullable(a.cashOnCashPct, b.cashOnCashPct, "desc"));
      break;
    case "payback_asc":
      sorted.sort((a, b) => compareNullable(a.paybackYears, b.paybackYears, "asc"));
      break;
    case "tenant_demand_desc":
      sorted.sort((a, b) =>
        compareNullable(a.tenantDemandScore, b.tenantDemandScore, "desc"),
      );
      break;
    case "occupancy_desc":
      sorted.sort((a, b) =>
        compareNullable(a.estimatedOccupancyMinPct, b.estimatedOccupancyMinPct, "desc"),
      );
      break;
    case "renovation_asc":
      sorted.sort((a, b) =>
        compareNullable(
          a.renovationCostMinCzk ?? a.estimatedRenovationCostCzk,
          b.renovationCostMinCzk ?? b.estimatedRenovationCostCzk,
          "asc",
        ),
      );
      break;
    case "discount_desc":
      sorted.sort((a, b) =>
        compareNullable(a.discountToEstimatedValuePct, b.discountToEstimatedValuePct, "desc"),
      );
      break;
    case "majetio_score_desc":
      sorted.sort((a, b) => compareNullable(a.majetioScore, b.majetioScore, "desc"));
      break;
    case "recommended":
      // Match score sort is applied by the discovery page (needs Finanční pas).
      sorted.sort((a, b) =>
        (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
      );
      break;
    case "newest":
    default:
      sorted.sort((a, b) =>
        (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
      );
      break;
  }
  return sorted;
}
