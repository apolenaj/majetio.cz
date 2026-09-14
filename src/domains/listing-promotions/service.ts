/**
 * Listing Promotion Engine — activate Boost, expire, eligibility.
 *
 * FIREWALL: This module must never write to analysis / valuation / risk tables
 * and must never feed organic search ORDER BY.
 */

import type { ListingBoostStatus, Prisma } from "@prisma/client";

import {
  SPONSORED_LABEL_CS,
  durationDaysForBoostKey,
  isListingBoostProductKey,
  listingBoostProducts,
  type ListingBoostProductKey,
} from "@/config/listing-promotions";
import { isFeatureEnabled } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import {
  assertBoostEligibility,
  productEnumForKey,
} from "./eligibility";

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 86_400_000);
}

export async function checkPropertyBoostEligibility(input: {
  propertyId: string;
  productKey?: string;
}): Promise<ReturnType<typeof assertBoostEligibility>> {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: {
      status: true,
      visibility: true,
      listingVerificationStatus: true,
      listingQuotaState: true,
      listingModerationStatus: true,
      isDemo: true,
    },
  });
  if (!property) {
    return {
      ok: false,
      code: "inactive",
      reason: "Nemovitost nenalezena.",
    };
  }
  return assertBoostEligibility(property, input.productKey);
}

/**
 * Activate a paid Boost after successful payment.
 * Does not touch score / valuation / risk / organic rank fields.
 */
export async function activateListingBoost(input: {
  propertyId: string;
  purchasedByUserId: string;
  productKey: string;
  orderId?: string | null;
  organizationId?: string | null;
  now?: Date;
  tx?: Prisma.TransactionClient | typeof prisma;
}): Promise<
  | { ok: true; boostId: string; startsAt: Date; endsAt: Date }
  | { ok: false; error: string; code?: string }
> {
  const db = input.tx ?? prisma;
  if (!isFeatureEnabled("LISTING_BOOST_ENABLED")) {
    return {
      ok: false,
      error: "Listing Boost není v této fázi spuštěný.",
      code: "feature_disabled",
    };
  }
  if (!isListingBoostProductKey(input.productKey)) {
    return { ok: false, error: "Neznámý boost produkt.", code: "unknown_product" };
  }

  const property = await db.property.findUnique({
    where: { id: input.propertyId },
    select: {
      id: true,
      status: true,
      visibility: true,
      listingVerificationStatus: true,
      listingQuotaState: true,
      listingModerationStatus: true,
      isDemo: true,
      organizationId: true,
      title: true,
      askingPrice: true,
      publicCity: true,
    },
  });
  if (!property) {
    return { ok: false, error: "Nemovitost nenalezena.", code: "inactive" };
  }

  const eligibility = assertBoostEligibility(property, input.productKey);
  if (!eligibility.ok) {
    return { ok: false, error: eligibility.reason, code: eligibility.code };
  }

  const { detectFakeListingSignals, isBlockedByAbuse } = await import(
    "@/domains/fraud",
  );
  const fakeSignals = detectFakeListingSignals(property);
  if (isBlockedByAbuse(fakeSignals)) {
    return {
      ok: false,
      error:
        fakeSignals.find((s) => s.severity === "high")?.messageCs ??
        "Inzerát nevyhovuje ochraně proti fake listings.",
      code: "fake_listing",
    };
  }

  const now = input.now ?? new Date();
  const days = durationDaysForBoostKey(input.productKey);
  const startsAt = now;
  const endsAt = addDays(now, days);
  const productKey = input.productKey as ListingBoostProductKey;
  const cfg = listingBoostProducts[productKey];

  // Idempotent: same order → reuse active boost
  if (input.orderId) {
    const existing = await db.listingBoost.findFirst({
      where: { orderId: input.orderId },
    });
    if (existing?.status === "ACTIVE") {
      return {
        ok: true,
        boostId: existing.id,
        startsAt: existing.startsAt ?? startsAt,
        endsAt: existing.endsAt ?? endsAt,
      };
    }
  }

  const row = await db.listingBoost.create({
    data: {
      propertyId: property.id,
      organizationId: input.organizationId ?? property.organizationId,
      purchasedByUserId: input.purchasedByUserId,
      orderId: input.orderId ?? null,
      product: productEnumForKey(productKey),
      productKey,
      status: "ACTIVE",
      startsAt,
      endsAt,
      placementWeight: 100,
      sponsoredLabel: SPONSORED_LABEL_CS,
      eligibilitySnapshot: {
        ...eligibility,
        firewall: cfg.firewall,
        verifiedAt: now.toISOString(),
      },
    },
  });

  return { ok: true, boostId: row.id, startsAt, endsAt };
}

export async function expireListingBoosts(now = new Date()): Promise<number> {
  const result = await prisma.listingBoost.updateMany({
    where: {
      status: "ACTIVE",
      endsAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  });
  return result.count;
}

/**
 * Sweep expired boosts then return count still ACTIVE (for ops / cron health).
 * Checklist 181 — paid boosts expire; expired rows never appear in sponsored fetch.
 */
export async function sweepAndCountActiveBoosts(now = new Date()): Promise<{
  expired: number;
  stillActive: number;
}> {
  const expired = await expireListingBoosts(now);
  const stillActive = await prisma.listingBoost.count({
    where: {
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
  });
  return { expired, stillActive };
}

export async function revokeListingBoost(input: {
  boostId: string;
  reason: string;
}): Promise<void> {
  await prisma.listingBoost.update({
    where: { id: input.boostId },
    data: {
      status: "REVOKED",
      meta: { revokeReason: input.reason },
    },
  });
}

export async function listActiveBoostsForProperty(
  propertyId: string,
  now = new Date(),
): Promise<Array<{ id: string; productKey: string; endsAt: Date | null; sponsoredLabel: string }>> {
  return prisma.listingBoost.findMany({
    where: {
      propertyId,
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    select: {
      id: true,
      productKey: true,
      endsAt: true,
      sponsoredLabel: true,
    },
    orderBy: { endsAt: "desc" },
  });
}

/** Statuses that may still need lifecycle sweep. */
export const ACTIVE_BOOST_STATUSES: ListingBoostStatus[] = ["ACTIVE"];
