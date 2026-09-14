import type { TransactionCostPack } from "@/domains/regulatory/transaction-costs/types";

/** CZ illustrative pack — transfer tax abolished; notary/broker remain. */
export const CZ_TRANSACTION_COST_PACK_V2026_07: TransactionCostPack = {
  packId: "cz-tx-costs.v2026.07",
  marketCode: "CZ",
  version: "2026.07",
  currency: "CZK",
  validFrom: "2026-07-01",
  validTo: null,
  verifiedAt: "2026-07-01T00:00:00.000Z",
  estimatesOnly: true,
  notesEn:
    "Illustrative CZ closing costs. Transfer tax repealed historically — verify current notary/registry fees.",
  lines: [
    {
      kind: "NOTARY",
      code: "cz.notary.orientational",
      labelEn: "Notary / conveyancing (orientational)",
      basis: "BPS_OF_PRICE",
      amountBps: 50,
      appliesTo: {
        side: "buyer",
        buyerEntity: ["NATURAL_PERSON", "COMPANY", "UNKNOWN"],
        buyerResidency: ["RESIDENT", "NON_RESIDENT", "UNKNOWN"],
      },
    },
    {
      kind: "REGISTRATION",
      code: "cz.katastr.fee",
      labelEn: "Land registry fee (orientational)",
      basis: "FIXED_MINOR",
      amountMinor: 2_000_00,
      appliesTo: { side: "buyer" },
    },
    {
      kind: "BROKER",
      code: "cz.broker.buyer",
      labelEn: "Buyer broker (if applicable)",
      basis: "BPS_OF_PRICE",
      amountBps: 300,
      appliesTo: {
        side: "buyer",
        propertyTypes: ["APARTMENT", "HOUSE", "VILLA", "OTHER"],
      },
    },
    {
      kind: "BROKER",
      code: "cz.broker.seller",
      labelEn: "Seller broker (typical)",
      basis: "BPS_OF_PRICE",
      amountBps: 300,
      appliesTo: { side: "seller" },
    },
    {
      kind: "VAT",
      code: "cz.vat.new_build",
      labelEn: "VAT on new-build (illustrative when applicable)",
      basis: "BPS_OF_PRICE",
      amountBps: 2100,
      appliesTo: {
        side: "buyer",
        propertyTypes: ["APARTMENT", "HOUSE"],
        buyerEntity: ["NATURAL_PERSON", "COMPANY", "UNKNOWN"],
      },
    },
  ],
};

/** AE / Dubai-oriented illustrative pack — DLD-style fees. */
export const AE_TRANSACTION_COST_PACK_V2026_07: TransactionCostPack = {
  packId: "ae-tx-costs.v2026.07",
  marketCode: "AE",
  version: "2026.07",
  currency: "AED",
  validFrom: "2026-07-01",
  validTo: null,
  verifiedAt: null,
  estimatesOnly: true,
  notesEn:
    "Illustrative Dubai-centric fees. Emirate packs differ — not a quote.",
  lines: [
    {
      kind: "DLD_FEE",
      code: "ae.dld.transfer",
      labelEn: "DLD / transfer fee (illustrative)",
      basis: "BPS_OF_PRICE",
      amountBps: 400,
      appliesTo: {
        side: "buyer",
        buyerResidency: ["RESIDENT", "NON_RESIDENT", "UNKNOWN"],
      },
    },
    {
      kind: "AGENCY",
      code: "ae.agency.buyer",
      labelEn: "Agency fee (buyer side, illustrative)",
      basis: "BPS_OF_PRICE",
      amountBps: 200,
      appliesTo: {
        side: "buyer",
        buyerResidency: ["NON_RESIDENT", "RESIDENT", "UNKNOWN"],
      },
    },
    {
      kind: "REGISTRATION",
      code: "ae.admin.fees",
      labelEn: "Admin / registration (fixed illustrative)",
      basis: "FIXED_MINOR",
      amountMinor: 4_000_00,
      appliesTo: { side: "buyer" },
    },
    {
      kind: "BROKER",
      code: "ae.broker.seller",
      labelEn: "Seller agency (illustrative)",
      basis: "BPS_OF_PRICE",
      amountBps: 200,
      appliesTo: { side: "seller" },
    },
  ],
};
