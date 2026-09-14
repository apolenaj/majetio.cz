/**
 * Versioned transaction cost packs (Prompt 17.4).
 * No universal % fee — lines depend on buyer profile + property type.
 */

export const BUYER_RESIDENCY = [
  "RESIDENT",
  "NON_RESIDENT",
  "UNKNOWN",
] as const;
export type BuyerResidency = (typeof BUYER_RESIDENCY)[number];

export const BUYER_ENTITY = [
  "NATURAL_PERSON",
  "COMPANY",
  "UNKNOWN",
] as const;
export type BuyerEntity = (typeof BUYER_ENTITY)[number];

export type BuyerProfile = {
  residency: BuyerResidency;
  entity: BuyerEntity;
};

export const TRANSACTION_COST_LINE_KINDS = [
  "TRANSFER_TAX",
  "NOTARY",
  "BROKER",
  "VAT",
  "REGISTRATION",
  "AGENCY",
  "DLD_FEE",
  "OTHER",
] as const;
export type TransactionCostLineKind =
  (typeof TRANSACTION_COST_LINE_KINDS)[number];

export type TransactionCostBasis = "BPS_OF_PRICE" | "FIXED_MINOR" | "PCT_OF_PRICE";

export type TransactionCostLineDef = {
  kind: TransactionCostLineKind;
  code: string;
  labelEn: string;
  basis: TransactionCostBasis;
  /** Basis points of purchase price (100 bps = 1%). */
  amountBps?: number;
  /** Fixed amount in minor units of pack currency. */
  amountMinor?: number;
  /** Percent of price (alternative to bps). */
  amountPct?: number;
  appliesTo: {
    buyerResidency?: readonly BuyerResidency[];
    buyerEntity?: readonly BuyerEntity[];
    propertyTypes?: readonly string[];
    /** buyer | seller | either */
    side: "buyer" | "seller" | "either";
  };
};

export type TransactionCostPack = {
  packId: string;
  marketCode: string;
  version: string;
  currency: string;
  validFrom: string;
  validTo: string | null;
  verifiedAt: string | null;
  lines: readonly TransactionCostLineDef[];
  notesEn: string;
  /** Always true — estimates are not tax advice. */
  estimatesOnly: true;
};

export type TransactionCostLineEstimate = {
  kind: TransactionCostLineKind;
  code: string;
  labelEn: string;
  amountMinor: number;
  currency: string;
  side: "buyer" | "seller" | "either";
};

export type TransactionCostEstimateResult = {
  packId: string;
  version: string;
  currency: string;
  purchasePriceMinor: number;
  buyerLines: TransactionCostLineEstimate[];
  sellerLines: TransactionCostLineEstimate[];
  buyerTotalMinor: number;
  sellerTotalMinor: number;
  disclaimer: string;
};
