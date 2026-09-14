/**
 * Engine-facing money DTOs (integer minor units) + mapping to domain Money.
 * Wire/JSON never carries IEEE floats for currency amounts.
 */

import { z } from "zod";

import {
  CURRENCY_CODES,
  Money,
  type CurrencyCode,
  assertCurrencyCode,
} from "@/domains/finance";

/** Serializable money: integer minor units as string (haléře / cents). */
export const moneyMinorDtoSchema = z.object({
  amountMinor: z
    .string()
    .regex(/^-?\d+$/, "amountMinor must be an integer string"),
  currency: z.enum(CURRENCY_CODES),
});

export type MoneyMinorDto = z.infer<typeof moneyMinorDtoSchema>;

/** Optional money — omit / null = missing (not zero). */
export const moneyMinorDtoOrNullSchema = moneyMinorDtoSchema.nullable();

export function moneyToDto(money: Money): MoneyMinorDto {
  return {
    amountMinor: money.toMinorInteger().toString(),
    currency: money.currency,
  };
}

export function moneyFromDto(dto: MoneyMinorDto): Money {
  return Money.fromMinor(dto.amountMinor, dto.currency);
}

export function moneyFromDtoOrNull(
  dto: MoneyMinorDto | null | undefined,
): Money | null {
  if (dto == null) return null;
  return moneyFromDto(moneyMinorDtoSchema.parse(dto));
}

/** Major-unit string DTO (e.g. forms) — converted via Decimal, not float. */
export const moneyMajorDtoSchema = z.object({
  amountMajor: z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, "amountMajor must be a decimal string"),
  currency: z.enum(CURRENCY_CODES),
});

export type MoneyMajorDto = z.infer<typeof moneyMajorDtoSchema>;

export function moneyFromMajorDto(dto: MoneyMajorDto): Money {
  const currency = assertCurrencyCode(dto.currency);
  return Money.fromMajor(dto.amountMajor, currency).roundForDisplay();
}

export type { CurrencyCode };
