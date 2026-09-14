/**
 * Estimate transaction costs from a versioned market pack.
 */

import { buildRegulatoryDisclaimerBundle } from "@/domains/regulatory/disclaimer";
import {
  AE_TRANSACTION_COST_PACK_V2026_07,
  CZ_TRANSACTION_COST_PACK_V2026_07,
} from "@/domains/regulatory/transaction-costs/packs";
import type {
  BuyerProfile,
  TransactionCostEstimateResult,
  TransactionCostLineDef,
  TransactionCostLineEstimate,
  TransactionCostPack,
} from "@/domains/regulatory/transaction-costs/types";

const PACKS: Record<string, TransactionCostPack> = {
  [CZ_TRANSACTION_COST_PACK_V2026_07.packId]: CZ_TRANSACTION_COST_PACK_V2026_07,
  [AE_TRANSACTION_COST_PACK_V2026_07.packId]: AE_TRANSACTION_COST_PACK_V2026_07,
};

const DEFAULT_PACK_BY_MARKET: Record<string, string> = {
  CZ: CZ_TRANSACTION_COST_PACK_V2026_07.packId,
  AE: AE_TRANSACTION_COST_PACK_V2026_07.packId,
};

export function getTransactionCostPack(
  packIdOrMarket: string,
): TransactionCostPack | null {
  if (PACKS[packIdOrMarket]) return PACKS[packIdOrMarket]!;
  const byMarket = DEFAULT_PACK_BY_MARKET[packIdOrMarket.toUpperCase()];
  return byMarket ? PACKS[byMarket]! : null;
}

export function listTransactionCostPacks(): TransactionCostPack[] {
  return Object.values(PACKS);
}

function lineApplies(
  line: TransactionCostLineDef,
  input: {
    buyer: BuyerProfile;
    propertyType: string;
    side: "buyer" | "seller";
  },
): boolean {
  const a = line.appliesTo;
  if (a.side !== "either" && a.side !== input.side) return false;
  if (
    a.buyerResidency &&
    input.side === "buyer" &&
    !a.buyerResidency.includes(input.buyer.residency)
  ) {
    return false;
  }
  if (
    a.buyerEntity &&
    input.side === "buyer" &&
    !a.buyerEntity.includes(input.buyer.entity)
  ) {
    return false;
  }
  if (
    a.propertyTypes &&
    !a.propertyTypes.includes(input.propertyType.toUpperCase())
  ) {
    return false;
  }
  return true;
}

function lineAmountMinor(
  line: TransactionCostLineDef,
  purchasePriceMinor: number,
): number {
  if (line.basis === "FIXED_MINOR") {
    return Math.round(line.amountMinor ?? 0);
  }
  if (line.basis === "BPS_OF_PRICE") {
    return Math.round((purchasePriceMinor * (line.amountBps ?? 0)) / 10_000);
  }
  // PCT_OF_PRICE
  return Math.round((purchasePriceMinor * (line.amountPct ?? 0)) / 100);
}

export function estimateTransactionCosts(input: {
  marketCode: string;
  purchasePriceMinor: number;
  propertyType: string;
  buyer: BuyerProfile;
  /** Optional: exclude VAT new-build line unless primary new-build. */
  includeVatNewBuild?: boolean;
  locale?: string;
}): TransactionCostEstimateResult | null {
  const pack = getTransactionCostPack(input.marketCode);
  if (!pack) return null;

  const buyerLines: TransactionCostLineEstimate[] = [];
  const sellerLines: TransactionCostLineEstimate[] = [];

  for (const line of pack.lines) {
    if (line.code === "cz.vat.new_build" && !input.includeVatNewBuild) {
      continue;
    }
    for (const side of ["buyer", "seller"] as const) {
      if (!lineApplies(line, { ...input, side })) continue;
      const estimate: TransactionCostLineEstimate = {
        kind: line.kind,
        code: line.code,
        labelEn: line.labelEn,
        amountMinor: lineAmountMinor(line, input.purchasePriceMinor),
        currency: pack.currency,
        side: line.appliesTo.side,
      };
      if (side === "buyer") buyerLines.push(estimate);
      else sellerLines.push(estimate);
    }
  }

  const disclaimer = buildRegulatoryDisclaimerBundle(input.locale).estimatesOnly;

  return {
    packId: pack.packId,
    version: pack.version,
    currency: pack.currency,
    purchasePriceMinor: input.purchasePriceMinor,
    buyerLines,
    sellerLines,
    buyerTotalMinor: buyerLines.reduce((s, l) => s + l.amountMinor, 0),
    sellerTotalMinor: sellerLines.reduce((s, l) => s + l.amountMinor, 0),
    disclaimer,
  };
}

/**
 * Map buyer closing estimate into investment acquisition `fees` minor amount.
 */
export function transactionCostsToAcquisitionFeesMinor(
  estimate: TransactionCostEstimateResult,
): number {
  return estimate.buyerTotalMinor;
}
