/**
 * Alternative marketplace modes — pairing & coordination only.
 */

import type { MarketplaceInterestStatus, MarketplaceModeKind, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { assertCanManageListing } from "@/domains/listings/seller/seller-listing-service";

const ACTIVE_SHARE_STATUSES: MarketplaceInterestStatus[] = [
  "DECLARED",
  "WAITLIST",
  "ACCEPTED_FOR_NEGOTIATION",
  "CONFIRMED_PARTICIPATION",
];

export async function declareModeInterest(input: {
  mode: MarketplaceModeKind;
  propertyId?: string | null;
  userId?: string | null;
  sharePct?: number | null;
  amountMinor?: number | null;
  currency?: string | null;
  message?: string | null;
  payload?: Prisma.InputJsonValue;
}): Promise<
  | { ok: true; interestId: string; status: MarketplaceInterestStatus }
  | { ok: false; error: string }
> {
  if (input.mode === "SHARED_INVESTMENT" && input.propertyId && input.sharePct != null) {
    if (!(input.sharePct > 0) || input.sharePct > 100) {
      return { ok: false, error: "Podíl musí být v rozmezí 0–100 %." };
    }

    return prisma.$transaction(async (tx) => {
      const property = await tx.property.findUnique({
        where: { id: input.propertyId! },
        select: { id: true, status: true },
      });
      if (!property || property.status !== "ACTIVE") {
        return { ok: false as const, error: "Nabídka není dostupná." };
      }

      const existing = await tx.marketplaceModeInterest.findMany({
        where: {
          propertyId: input.propertyId!,
          mode: "SHARED_INVESTMENT",
          status: { in: ACTIVE_SHARE_STATUSES },
        },
        select: { sharePct: true },
      });
      const filled = existing.reduce((sum, row) => sum + (row.sharePct ?? 0), 0);
      const remaining = 100 - filled;
      let status: MarketplaceInterestStatus = "DECLARED";
      if (input.sharePct! > remaining) {
        status = "WAITLIST";
      }

      const row = await tx.marketplaceModeInterest.create({
        data: {
          mode: input.mode,
          propertyId: input.propertyId,
          userId: input.userId ?? null,
          sharePct: input.sharePct,
          amountMinor: input.amountMinor ?? null,
          currency: input.currency ?? "CZK",
          message: input.message?.trim().slice(0, 4000) || null,
          payload: input.payload,
          status,
        },
        select: { id: true, status: true },
      });

      return { ok: true as const, interestId: row.id, status: row.status };
    });
  }

  if (input.mode === "OFFER_PRICE" && input.propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
      select: { id: true, status: true, negotiable: true, ownerUserId: true },
    });
    if (!property || property.status !== "ACTIVE") {
      return { ok: false, error: "Nabídka není dostupná." };
    }
    if (!property.negotiable) {
      return { ok: false, error: "Majitel režim „Nabídněte cenu“ neaktivoval." };
    }
    if (input.userId && property.ownerUserId === input.userId) {
      return { ok: false, error: "Nelze nabízet cenu na vlastní nabídku." };
    }
    if (input.amountMinor == null || !(input.amountMinor > 0)) {
      return { ok: false, error: "Zadejte kladnou nabídku." };
    }
  }

  const row = await prisma.marketplaceModeInterest.create({
    data: {
      mode: input.mode,
      propertyId: input.propertyId ?? null,
      userId: input.userId ?? null,
      sharePct: input.sharePct ?? null,
      amountMinor: input.amountMinor ?? null,
      currency: input.currency ?? "CZK",
      message: input.message?.trim().slice(0, 4000) || null,
      payload: input.payload,
      status: "DECLARED",
    },
    select: { id: true, status: true },
  });

  return { ok: true, interestId: row.id, status: row.status };
}

export async function withdrawModeInterest(input: {
  interestId: string;
  userId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.marketplaceModeInterest.findUnique({
    where: { id: input.interestId },
  });
  if (!row || row.userId !== input.userId) {
    return { ok: false, error: "Zájem nenalezen." };
  }
  if (row.status === "SETTLED") {
    return { ok: false, error: "Uzavřený zájem nelze odvolat touto cestou." };
  }
  await prisma.marketplaceModeInterest.update({
    where: { id: input.interestId },
    data: { status: "WITHDRAWN" },
  });
  return { ok: true };
}

export async function listInterestsForPropertyOwner(input: {
  propertyId: string;
  userId: string;
  mode?: MarketplaceModeKind;
}) {
  const access = await assertCanManageListing({
    propertyId: input.propertyId,
    userId: input.userId,
  });
  if (!access.ok) return { ok: false as const, error: access.error };

  const items = await prisma.marketplaceModeInterest.findMany({
    where: {
      propertyId: input.propertyId,
      ...(input.mode ? { mode: input.mode } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return { ok: true as const, items };
}

export async function sharedInvestmentFillPct(propertyId: string): Promise<{
  declaredPct: number;
  confirmedPct: number;
  waitlistCount: number;
}> {
  const rows = await prisma.marketplaceModeInterest.findMany({
    where: {
      propertyId,
      mode: "SHARED_INVESTMENT",
      status: { in: [...ACTIVE_SHARE_STATUSES, "WAITLIST"] },
    },
    select: { sharePct: true, status: true },
  });
  let declaredPct = 0;
  let confirmedPct = 0;
  let waitlistCount = 0;
  for (const row of rows) {
    if (row.status === "WAITLIST") {
      waitlistCount += 1;
      continue;
    }
    const pct = row.sharePct ?? 0;
    declaredPct += pct;
    if (
      row.status === "CONFIRMED_PARTICIPATION" ||
      row.status === "SETTLED"
    ) {
      confirmedPct += pct;
    }
  }
  return { declaredPct, confirmedPct, waitlistCount };
}

export async function placeAuctionBid(input: {
  auctionId: string;
  bidderUserId: string;
  amountMinor: number;
}): Promise<{ ok: true; bidId: string } | { ok: false; error: string }> {
  if (!(input.amountMinor > 0)) {
    return { ok: false, error: "Neplatná výše příhozu." };
  }

  return prisma.$transaction(async (tx) => {
    const auction = await tx.auctionConfig.findUnique({
      where: { id: input.auctionId },
    });
    if (!auction || auction.status !== "OPEN") {
      return { ok: false as const, error: "Aukce není otevřená." };
    }
    const now = new Date();
    if (now < auction.startsAt || now > auction.endsAt) {
      return { ok: false as const, error: "Mimo čas aukce (serverový čas)." };
    }

    const highest = await tx.auctionBid.findFirst({
      where: { auctionId: input.auctionId },
      orderBy: { amountMinor: "desc" },
      select: { amountMinor: true },
    });
    const minNext =
      (highest?.amountMinor ?? auction.reservePrice ?? 0) + auction.minIncrement;
    if (input.amountMinor < minNext) {
      return {
        ok: false as const,
        error: `Minimální příhoz je ${minNext} ${auction.currency}.`,
      };
    }

    const bid = await tx.auctionBid.create({
      data: {
        auctionId: input.auctionId,
        bidderUserId: input.bidderUserId,
        amountMinor: input.amountMinor,
        currency: auction.currency,
        serverReceivedAt: now,
      },
      select: { id: true },
    });

    return { ok: true as const, bidId: bid.id };
  });
}
