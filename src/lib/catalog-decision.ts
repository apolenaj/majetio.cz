/**
 * Rozhodovací vrstva ukázkového katalogu.
 * Skutečný trh se neodhaduje. Čísla pro ukazka-1 jsou jeden modelový balík
 * a výnos počítá calculateRentalDecision.
 */

import Decimal from "decimal.js";

import { calculateRentalDecision } from "@/domains/investment/engine/calculations/rental-decision";
import { mockProperties, type Property } from "@/lib/mock-properties";

export const MODEL_LISTING_ID = 1;

const MODEL = {
  monthlyRent: 24_500,
  rentLow: 23_000,
  rentHigh: 26_000,
  occupancy: 0.95,
  equityShare: 0.2,
  annualRate: 0.049,
  termYears: 30,
  acquisitionCosts: 100_000,
  annualOwnerOpex: 36_000,
  annualCapexReserve: 12_000,
  /** Není medián trhu. Jen aby šla ukázat komponenta „cena vs. model“. */
  illustrativeMedianPerM2: 129_500,
} as const;

export function pricePerSquareMetre(price: number, area: number): number | null {
  if (!(area > 0) || !Number.isFinite(price)) return null;
  return price / area;
}

export function priceGapPercent(subjectPerM2: number, referencePerM2: number): number | null {
  if (!(referencePerM2 > 0) || !Number.isFinite(subjectPerM2)) return null;
  return ((subjectPerM2 - referencePerM2) / referencePerM2) * 100;
}

function cityOf(locality: string): string {
  const head = locality.split(" - ")[0]?.trim() ?? locality;
  return head.startsWith("Praha") ? "Praha" : head;
}

export type CatalogComparable = {
  property: Property;
  pricePerM2: number;
  deltaPct: number;
};

/**
 * Srovnatelná nabídka musí sedět typem, dispozicí a plochou.
 * Nesmí spadnout na vzdálený větší byt jen proto, že je ve stejném městě.
 */
export function matchCatalogComparables(
  property: Property,
  limit = 6,
): { items: CatalogComparable[]; note: string } {
  const area = property.plocha_m2;
  const subjectPerM2 = pricePerSquareMetre(property.cena, area);
  const city = cityOf(property.lokalita);
  const district = property.lokalita.split(" - ")[0]?.trim() ?? property.lokalita;

  const pool = mockProperties.filter((item) => {
    if (item.id === property.id) return false;
    if (item.typ_transakce !== property.typ_transakce) return false;
    if (item.typ_nemovitosti !== property.typ_nemovitosti) return false;
    if (property.dispozice && item.dispozice !== property.dispozice) return false;
    if (!(area > 0) || !(item.plocha_m2 > 0)) return false;
    const ratio = item.plocha_m2 / area;
    if (ratio < 0.75 || ratio > 1.25) return false;
    return cityOf(item.lokalita) === city;
  });

  const ranked = pool
    .map((item) => {
      const pricePerM2 = pricePerSquareMetre(item.cena, item.plocha_m2);
      const deltaPct =
        subjectPerM2 != null && pricePerM2 != null
          ? priceGapPercent(pricePerM2, subjectPerM2)
          : null;
      return pricePerM2 != null && deltaPct != null
        ? { property: item, pricePerM2, deltaPct }
        : null;
    })
    .filter((item): item is CatalogComparable => item != null)
    .sort((a, b) => {
      const aDistrict = a.property.lokalita.startsWith(district) ? 0 : 1;
      const bDistrict = b.property.lokalita.startsWith(district) ? 0 : 1;
      if (aDistrict !== bDistrict) return aDistrict - bDistrict;
      return Math.abs(a.deltaPct) - Math.abs(b.deltaPct);
    });

  if (ranked.length === 0) {
    return {
      items: [],
      note: `V ukázkovém katalogu není další nabídka se stejnou dispozicí a podobnou plochou v lokalitě ${city}. Větší byty z jiné čtvrti sem nepatří.`,
    };
  }
  return {
    items: ranked.slice(0, limit),
    note: "Stejný typ, dispozice a plocha v rozmezí ±25 %. Pořád jde o ukázkový katalog, ne o výběr z trhu.",
  };
}

export function renovationBands(area: number): Array<{ id: string; label: string; low: number; high: number }> {
  if (!(area > 0)) return [];
  const row = (id: string, label: string, perLow: number, perHigh: number) => ({
    id,
    label,
    low: Math.round(area * perLow),
    high: Math.round(area * perHigh),
  });
  return [
    { id: "zadna", label: "Žádná", low: 0, high: 0 },
    row("lehka", "Lehká", 2_800, 5_500),
    row("stredni", "Střední", 6_500, 13_000),
    row("kompletni", "Kompletní", 13_000, 24_000),
  ];
}

export function projectValue(price: number, annualRate: number, years: number): Array<{ label: string; value: number }> {
  const points = [];
  for (let year = 0; year <= years; year += 1) {
    points.push({
      label: year === 0 ? "Dnes" : `${year} r.`,
      value: Math.round(price * (1 + annualRate) ** year),
    });
  }
  return points;
}

export type ModelDecision = {
  label: "Modelová data";
  disclaimer: string;
  pricePerM2: number;
  medianPerM2: number;
  gapPct: number;
  monthlyRent: number;
  rentLow: number;
  rentHigh: number;
  equity: number;
  loan: number;
  monthlyPayment: number;
  grossYieldPct: number;
  netYieldPct: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  noi: number;
  totalInvestment: number;
  cashOnCashPct: number | null;
  ownerOpexMonthly: number;
  reserveMonthly: number;
  score: {
    total: number;
    note: string;
    parts: Array<{ label: string; value: number; how: string }>;
  };
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildModelDecision(property: Property): ModelDecision | null {
  if (property.id !== MODEL_LISTING_ID || property.typ_transakce !== "prodej") return null;
  const pricePerM2 = pricePerSquareMetre(property.cena, property.plocha_m2);
  const gapPct = pricePerM2 == null ? null : priceGapPercent(pricePerM2, MODEL.illustrativeMedianPerM2);
  if (pricePerM2 == null || gapPct == null) return null;

  const loan = Math.round(property.cena * (1 - MODEL.equityShare));
  const result = calculateRentalDecision({
    purchasePrice: new Decimal(property.cena),
    acquisitionCosts: new Decimal(MODEL.acquisitionCosts),
    renovation: new Decimal(0),
    furnishing: new Decimal(0),
    loanAmount: new Decimal(loan),
    annualInterestRate: new Decimal(MODEL.annualRate),
    termYears: MODEL.termYears,
    monthlyNetRent: new Decimal(MODEL.monthlyRent),
    occupancy: new Decimal(MODEL.occupancy),
    annualOwnerOpex: new Decimal(MODEL.annualOwnerOpex),
    annualCapexReserve: new Decimal(MODEL.annualCapexReserve),
  });
  if (result.monthlyPayment == null || result.grossYieldOnPurchase == null || result.netOperatingYield == null) {
    return null;
  }

  const grossYieldPct = result.grossYieldOnPurchase.mul(100).toNumber();
  const netYieldPct = result.netOperatingYield.mul(100).toNumber();
  const monthlyCashFlow = result.disposableMonthlyCashFlow.toNumber();
  const priceScore = Math.round(clamp(50 - gapPct * 2, 0, 100));
  const yieldScore = Math.round(clamp((grossYieldPct / 6) * 100, 0, 100));
  const cashScore = Math.round(
    monthlyCashFlow >= 0 ? 80 : clamp(50 + monthlyCashFlow / 200, 0, 70),
  );
  const locationScore = Math.min(100, property.obcanska_vybavenost.length * 20);
  const riskScore = 62;
  const parts = [
    {
      label: "Cena vůči modelu",
      value: priceScore,
      how: "50 bodů minus dvojnásobek rozdílu ceny za m² proti modelové hladině. Není to sleva proti trhu.",
    },
    {
      label: "Hrubý výnos",
      value: yieldScore,
      how: "Podíl ročního nájmu z modelu a kupní ceny. 6 % odpovídá 100 bodům.",
    },
    {
      label: "Cash-flow",
      value: cashScore,
      how: "Měsíční cash-flow po splátce, nákladech a rezervě z téhož modelu.",
    },
    {
      label: "Vybavenost v textu",
      value: locationScore,
      how: "Počet uvedených bodů občanské vybavenosti v ukázce. Není to skóre lokality.",
    },
    {
      label: "Chybějící podklady",
      value: riskScore,
      how: "PENB a dokumenty SVJ v ukázce nejsou. Body proto zůstávají níž.",
    },
  ];
  const total = Math.round(parts.reduce((sum, part) => sum + part.value, 0) / parts.length);

  return {
    label: "Modelová data",
    disclaimer:
      "Ukázková analýza. Nájem, hladina ceny za m² i náklady jsou předpoklady, ne odhad trhu a ne znalecký posudek.",
    pricePerM2,
    medianPerM2: MODEL.illustrativeMedianPerM2,
    gapPct,
    monthlyRent: MODEL.monthlyRent,
    rentLow: MODEL.rentLow,
    rentHigh: MODEL.rentHigh,
    equity: result.equity.toNumber(),
    loan,
    monthlyPayment: result.monthlyPayment.toNumber(),
    grossYieldPct,
    netYieldPct,
    monthlyCashFlow,
    annualCashFlow: result.disposableAnnualCashFlow.toNumber(),
    noi: result.noi.toNumber(),
    totalInvestment: result.totalInvestment.toNumber(),
    cashOnCashPct: result.cashOnCash?.mul(100).toNumber() ?? null,
    ownerOpexMonthly: MODEL.annualOwnerOpex / 12,
    reserveMonthly: MODEL.annualCapexReserve / 12,
    score: {
      total,
      note: "Ukázkové skóre z modelových předpokladů. Není to hodnocení trhu.",
      parts,
    },
  };
}
