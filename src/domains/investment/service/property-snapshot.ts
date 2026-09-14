/**
 * Build a frozen property snapshot for investment orchestration.
 */

import type { CurrencyCode } from "@/domains/finance";

import { moneyToDto, type MoneyMinorDto } from "../engine";
import { Money } from "@/domains/finance";

/** Minimal property fields needed to seed engine inputs. */
export type PropertySourceForSnapshot = {
  id: string;
  slug?: string | null;
  currency?: string | null;
  askingPrice?: number | null;
  priceCzk?: number | null;
  usableArea?: number | null;
  areaSqm?: number | null;
  title?: string | null;
  propertyType?: string | null;
  publicCity?: string | null;
  city?: string | null;
};

export type PropertyInvestmentSnapshot = {
  propertyId: string;
  slug: string | null;
  title: string | null;
  propertyType: string | null;
  city: string | null;
  currency: CurrencyCode;
  usableAreaSqm: number | null;
  /** Asking / list price as money DTO — null when unknown (≠ zero). */
  askingPrice: MoneyMinorDto | null;
  /** Same as asking when no separate purchase negotiated. */
  purchasePriceHint: MoneyMinorDto | null;
  capturedAt: string;
};

function asCurrency(code: string | null | undefined): CurrencyCode {
  if (code === "EUR" || code === "USD" || code === "CZK") return code;
  return "CZK";
}

function majorIntToMoneyDto(
  amount: number | null | undefined,
  currency: CurrencyCode,
): MoneyMinorDto | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  return moneyToDto(Money.fromMajor(amount, currency).roundForDisplay());
}

export function buildPropertyInvestmentSnapshot(
  property: PropertySourceForSnapshot,
  asOf: Date = new Date(),
): PropertyInvestmentSnapshot {
  const currency = asCurrency(property.currency);
  const asking = majorIntToMoneyDto(
    property.askingPrice ?? property.priceCzk ?? null,
    currency,
  );

  return {
    propertyId: property.id,
    slug: property.slug ?? null,
    title: property.title ?? null,
    propertyType: property.propertyType ?? null,
    city: property.publicCity ?? property.city ?? null,
    currency,
    usableAreaSqm: property.usableArea ?? property.areaSqm ?? null,
    askingPrice: asking,
    purchasePriceHint: asking,
    capturedAt: asOf.toISOString(),
  };
}
