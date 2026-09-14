/**
 * Favourite price alerts from PropertyPriceHistory.
 * Real market moves only — never CORRECTED / INITIAL / STALE-only noise.
 */

import type { PriceChangeType } from "@prisma/client";

import { propertyAlertConfig } from "@/config/property-alerts";
import { prisma } from "@/lib/db";
import { buildPriceChangeCopy } from "./alert-copy";
import { priceAlertDedupeKey } from "./alert-dedupe";
import { deliverPropertyAlert } from "./deliver-alert";

export type PriceHistoryPointInput = {
  propertyId: string;
  amount: number;
  changeType: PriceChangeType | string;
  observedAt: Date;
};

export function isMeaningfulPriceChange(input: {
  previousCzk: number;
  currentCzk: number;
  changeType: string;
}): boolean {
  const ignore = propertyAlertConfig.price.ignoreChangeTypes as readonly string[];
  if (ignore.includes(input.changeType)) return false;
  if (
    input.changeType !== "INCREASED" &&
    input.changeType !== "DECREASED"
  ) {
    // Allow unknown types if delta is large enough
    if (input.currentCzk === input.previousCzk) return false;
  }

  const abs = Math.abs(input.currentCzk - input.previousCzk);
  if (abs < propertyAlertConfig.price.minAbsoluteChangeCzk) return false;
  if (input.previousCzk <= 0) return abs >= propertyAlertConfig.price.minAbsoluteChangeCzk;
  const rel = abs / input.previousCzk;
  return rel >= propertyAlertConfig.price.minRelativeChange;
}

/**
 * After a new price history row is written, notify users who favourited the property.
 */
export async function processFavouritePriceChange(
  input: PriceHistoryPointInput,
): Promise<{ notified: number; skipped: string }> {
  if (
    (propertyAlertConfig.price.ignoreChangeTypes as readonly string[]).includes(
      input.changeType,
    )
  ) {
    return { notified: 0, skipped: "technical_or_initial" };
  }

  const previous = await prisma.propertyPriceHistory.findFirst({
    where: {
      propertyId: input.propertyId,
      observedAt: { lt: input.observedAt },
    },
    orderBy: { observedAt: "desc" },
    select: { amount: true, priceCzk: true },
  });

  const previousCzk = previous?.amount ?? previous?.priceCzk ?? null;
  if (previousCzk == null || previousCzk <= 0) {
    return { notified: 0, skipped: "no_previous_price" };
  }

  if (
    !isMeaningfulPriceChange({
      previousCzk,
      currentCzk: input.amount,
      changeType: input.changeType,
    })
  ) {
    return { notified: 0, skipped: "not_meaningful" };
  }

  const decreased = input.amount < previousCzk;
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: {
      id: true,
      slug: true,
      title: true,
      layout: true,
      propertyType: true,
    },
  });
  if (!property) return { notified: 0, skipped: "property_missing" };

  const favourites = await prisma.favourite.findMany({
    where: {
      propertyId: input.propertyId,
      status: { not: "REJECTED" },
    },
    select: { userId: true },
  });
  if (favourites.length === 0) {
    return { notified: 0, skipped: "no_favourites" };
  }

  const copy = buildPriceChangeCopy({
    propertyTitle: property.title,
    dispositionHint:
      property.propertyType === "APARTMENT"
        ? "bytu"
        : property.propertyType === "HOUSE"
          ? "domu"
          : null,
    previousCzk,
    currentCzk: input.amount,
    decreased,
  });

  const dedupeBase = priceAlertDedupeKey({
    propertyId: property.id,
    direction: decreased ? "down" : "up",
    amountCzk: input.amount,
    observedAt: input.observedAt,
  });

  let notified = 0;
  for (const fav of favourites) {
    const result = await deliverPropertyAlert({
      userId: fav.userId,
      propertyId: property.id,
      type: decreased ? "PRICE_DECREASE" : "PRICE_INCREASE",
      title: copy.title,
      body: copy.body,
      href: `/nemovitosti/${property.slug}`,
      dedupeKey: dedupeBase,
      preferEmail: true,
      meta: {
        previousCzk,
        currentCzk: input.amount,
        changeType: input.changeType,
      },
    });
    if (result.ok && (result.status === "SENT" || result.status === "PENDING")) {
      notified += 1;
    }
  }

  return { notified, skipped: notified === 0 ? "all_deduped_or_suppressed" : "" };
}
