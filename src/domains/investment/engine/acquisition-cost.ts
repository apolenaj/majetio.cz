/**
 * Total Acquisition Cost structure (Prompt investment engine foundation).
 * Purchase Price + Acquisition Costs + Renovation + Initial Furnishing + Fees.
 *
 * Summation uses Money only — no float aggregation.
 */

import { z } from "zod";

import { type Money, type CurrencyCode } from "@/domains/finance";

import {
  moneyFromDto,
  moneyMinorDtoOrNullSchema,
  moneyMinorDtoSchema,
  moneyToDto,
  type MoneyMinorDto,
} from "./money";

export const acquisitionCostLineKeys = [
  "purchasePrice",
  "acquisitionCosts",
  "renovation",
  "initialFurnishing",
  "fees",
] as const;

export type AcquisitionCostLineKey = (typeof acquisitionCostLineKeys)[number];

/**
 * Zod shape for total acquisition cost inputs.
 * Required: purchasePrice. Other lines may be null (missing) or zero Money DTO.
 */
export const totalAcquisitionCostInputSchema = z
  .object({
    purchasePrice: moneyMinorDtoSchema,
    acquisitionCosts: moneyMinorDtoOrNullSchema.default(null),
    renovation: moneyMinorDtoOrNullSchema.default(null),
    initialFurnishing: moneyMinorDtoOrNullSchema.default(null),
    fees: moneyMinorDtoOrNullSchema.default(null),
  })
  .superRefine((val, ctx) => {
    const currency = val.purchasePrice.currency;
    for (const key of acquisitionCostLineKeys) {
      if (key === "purchasePrice") continue;
      const line = val[key];
      if (line != null && line.currency !== currency) {
        ctx.addIssue({
          code: "custom",
          path: [key, "currency"],
          message: `Currency must match purchasePrice (${currency})`,
        });
      }
    }
  });

export type TotalAcquisitionCostInput = z.infer<
  typeof totalAcquisitionCostInputSchema
>;

export type TotalAcquisitionCostBreakdown = {
  purchasePrice: Money;
  acquisitionCosts: Money | null;
  renovation: Money | null;
  initialFurnishing: Money | null;
  fees: Money | null;
  currency: CurrencyCode;
};

export type TotalAcquisitionCost = TotalAcquisitionCostBreakdown & {
  /** Sum of present lines (missing lines skipped — not coerced to zero). */
  total: Money;
  /** Lines explicitly included in the sum (non-null). */
  includedLines: AcquisitionCostLineKey[];
};

export function parseTotalAcquisitionCostInput(
  raw: unknown,
): TotalAcquisitionCostInput {
  return totalAcquisitionCostInputSchema.parse(raw);
}

export function toAcquisitionCostBreakdown(
  input: TotalAcquisitionCostInput,
): TotalAcquisitionCostBreakdown {
  return {
    purchasePrice: moneyFromDto(input.purchasePrice),
    acquisitionCosts:
      input.acquisitionCosts == null
        ? null
        : moneyFromDto(input.acquisitionCosts),
    renovation:
      input.renovation == null ? null : moneyFromDto(input.renovation),
    initialFurnishing:
      input.initialFurnishing == null
        ? null
        : moneyFromDto(input.initialFurnishing),
    fees: input.fees == null ? null : moneyFromDto(input.fees),
    currency: input.purchasePrice.currency,
  };
}

/**
 * Sum acquisition lines. Null lines are omitted (≠ treated as zero).
 * Zero DTOs still count as included zeros.
 */
export function computeTotalAcquisitionCost(
  input: TotalAcquisitionCostInput,
): TotalAcquisitionCost {
  const breakdown = toAcquisitionCostBreakdown(input);
  const includedLines: AcquisitionCostLineKey[] = ["purchasePrice"];
  let total = breakdown.purchasePrice;

  const optional: Array<[AcquisitionCostLineKey, Money | null]> = [
    ["acquisitionCosts", breakdown.acquisitionCosts],
    ["renovation", breakdown.renovation],
    ["initialFurnishing", breakdown.initialFurnishing],
    ["fees", breakdown.fees],
  ];

  for (const [key, value] of optional) {
    if (value == null) continue;
    includedLines.push(key);
    total = total.add(value);
  }

  return {
    ...breakdown,
    total: total.roundForDisplay(),
    includedLines,
  };
}

export function totalAcquisitionCostToDto(cost: TotalAcquisitionCost): {
  purchasePrice: MoneyMinorDto;
  acquisitionCosts: MoneyMinorDto | null;
  renovation: MoneyMinorDto | null;
  initialFurnishing: MoneyMinorDto | null;
  fees: MoneyMinorDto | null;
  total: MoneyMinorDto;
  includedLines: AcquisitionCostLineKey[];
} {
  return {
    purchasePrice: moneyToDto(cost.purchasePrice),
    acquisitionCosts:
      cost.acquisitionCosts == null ? null : moneyToDto(cost.acquisitionCosts),
    renovation: cost.renovation == null ? null : moneyToDto(cost.renovation),
    initialFurnishing:
      cost.initialFurnishing == null
        ? null
        : moneyToDto(cost.initialFurnishing),
    fees: cost.fees == null ? null : moneyToDto(cost.fees),
    total: moneyToDto(cost.total),
    includedLines: cost.includedLines,
  };
}
