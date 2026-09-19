/**
 * Uložení nezávazných návrhů. Příjemce se odvozuje z nabídky.
 * E-mail se odtud neodesílá — stav doručení je STORED_ONLY, dokud není nastavený odesílač.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import type { NegotiationStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { assertCanManageListing } from "@/domains/listings/seller/seller-listing-service";
import {
  canAcceptNegotiation,
  isOwnListing,
  isRecentDuplicate,
  outcomeMessage,
  reduceNegotiation,
  validateCoPurchase,
  validatePriceOffer,
  type NegotiationSnapshot,
  type NegotiationStatusValue,
} from "@/domains/listings/negotiations/validate";

const HOUR_MS = 60 * 60 * 1000;
const HOURLY_LIMIT = 5;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function tokenMatches(storedHash: string, token: string): boolean {
  const next = Buffer.from(hashToken(token));
  const current = Buffer.from(storedHash);
  if (next.length !== current.length) return false;
  return timingSafeEqual(next, current);
}

async function assertNotSpam(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const count = await prisma.listingNegotiation.count({
    where: { buyerEmail: email, createdAt: { gte: new Date(Date.now() - HOUR_MS) } },
  });
  if (count >= HOURLY_LIMIT) {
    return {
      ok: false,
      error: "Z této adresy už přišlo příliš mnoho návrhů. Zkuste to později.",
    };
  }
  return { ok: true };
}

async function assertNotDuplicate(input: {
  propertyId: string;
  kind: "PRICE_OFFER" | "CO_PURCHASE";
  email: string;
  amountCzk: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const previous = await prisma.listingNegotiation.findFirst({
    where: {
      propertyId: input.propertyId,
      kind: input.kind,
      buyerEmail: input.email,
      amountCzk: input.amountCzk,
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, amountCzk: true },
  });
  if (
    isRecentDuplicate({
      now: Date.now(),
      previousCreatedAt: previous?.createdAt.getTime() ?? null,
      samePayload: previous?.amountCzk === input.amountCzk,
    })
  ) {
    return {
      ok: false,
      error: "Stejný návrh už byl před chvílí uložený. Nový záznam nevznikl.",
    };
  }
  return { ok: true };
}

async function loadOpenListing(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      status: true,
      transactionType: true,
      isDemo: true,
      negotiable: true,
      acceptsCoPurchaseSeekPartner: true,
      acceptsCoPurchaseSellerRetains: true,
      offeredOwnershipPercent: true,
      ownerUserId: true,
      listedByUserId: true,
    },
  });
  if (!property) return { ok: false as const, error: "Nemovitost nenalezena." };
  if (property.isDemo) {
    return {
      ok: false as const,
      error: "Ukázkový inzerát nepřijímá produkční poptávku.",
    };
  }
  if (!canAcceptNegotiation(property.status)) {
    return {
      ok: false as const,
      error: "Na prodanou, archivovanou nebo jinak neaktivní nabídku nelze poslat nový návrh.",
    };
  }
  if (property.transactionType !== "SALE") {
    return { ok: false as const, error: "Cenový návrh a spolukoupe jsou jen u prodeje." };
  }
  return { ok: true as const, property };
}

export type StoredNegotiationResult =
  | {
      ok: true;
      negotiationId: string;
      withdrawToken: string;
      noticeStatus: "STORED_ONLY";
      message: string;
    }
  | { ok: false; error: string };

async function persist(input: {
  propertyId: string;
  kind: "PRICE_OFFER" | "CO_PURCHASE";
  buyerUserId?: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  currency: string;
  amountCzk: number;
  financing: "OWN_FUNDS" | "LOAN" | "MIXED" | "UNKNOWN";
  timeline?: string | null;
  message?: string | null;
  situation?: "SEEK_PARTNER" | "SELLER_RETAINS" | null;
  sharePercent?: number | null;
  shareReference?: "WHOLE_PROPERTY" | "OFFERED_SHARE" | null;
  cashContributionCzk?: number | null;
  proposedTotalPriceCzk?: number | null;
  purpose?: string | null;
  hasCoInvestor?: boolean | null;
}): Promise<StoredNegotiationResult> {
  const spam = await assertNotSpam(input.buyerEmail);
  if (!spam.ok) return spam;
  const duplicate = await assertNotDuplicate({
    propertyId: input.propertyId,
    kind: input.kind,
    email: input.buyerEmail,
    amountCzk: input.amountCzk,
  });
  if (!duplicate.ok) return duplicate;

  const withdrawToken = randomBytes(24).toString("hex");
  const noticeStatus = "STORED_ONLY" as const;
  const notice = outcomeMessage(noticeStatus);

  try {
    const row = await prisma.listingNegotiation.create({
      data: {
        propertyId: input.propertyId,
        kind: input.kind,
        status: "NEW",
        buyerUserId: input.buyerUserId ?? null,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail,
        buyerPhone: input.buyerPhone,
        buyerTokenHash: hashToken(withdrawToken),
        currency: input.currency,
        amountCzk: input.amountCzk,
        financing: input.financing,
        timeline: input.timeline ?? null,
        message: input.message ?? null,
        situation: input.situation ?? null,
        sharePercent: input.sharePercent ?? null,
        shareReference: input.shareReference ?? null,
        cashContributionCzk: input.cashContributionCzk ?? null,
        proposedTotalPriceCzk: input.proposedTotalPriceCzk ?? null,
        purpose: input.purpose ?? null,
        hasCoInvestor: input.hasCoInvestor ?? null,
        noticeStatus,
        versions: {
          create: {
            actor: "BUYER",
            actorUserId: input.buyerUserId ?? null,
            amountCzk: input.amountCzk,
            sharePercent: input.sharePercent ?? null,
            cashContributionCzk: input.cashContributionCzk ?? null,
            message: input.message ?? null,
            status: "NEW",
          },
        },
      },
      select: { id: true },
    });
    return {
      ok: true,
      negotiationId: row.id,
      withdrawToken,
      noticeStatus,
      message: notice.text,
    };
  } catch {
    return { ok: false, error: "Návrh se nepodařilo uložit. Nic se neodeslalo." };
  }
}

export async function createPriceOffer(input: {
  propertyId: string;
  buyerUserId?: string | null;
  amount: unknown;
  currency?: string | null;
  financing?: string | null;
  timeline?: string | null;
  message?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  honeypot?: string | null;
}): Promise<StoredNegotiationResult> {
  const listing = await loadOpenListing(input.propertyId);
  if (!listing.ok) return listing;
  if (!listing.property.negotiable) {
    return { ok: false, error: "Inzerent cenové návrhy nepřijímá." };
  }
  if (isOwnListing(input.buyerUserId, listing.property)) {
    return { ok: false, error: "Na vlastní nabídku nelze poslat cenový návrh." };
  }
  const parsed = validatePriceOffer(input);
  if (!parsed.ok) return parsed;
  return persist({
    propertyId: listing.property.id,
    kind: "PRICE_OFFER",
    buyerUserId: input.buyerUserId,
    currency: parsed.value.currency,
    amountCzk: parsed.value.amountCzk,
    financing: parsed.value.financing,
    timeline: parsed.value.timeline,
    message: parsed.value.message,
    buyerName: parsed.value.buyerName,
    buyerEmail: parsed.value.buyerEmail,
    buyerPhone: parsed.value.buyerPhone,
  });
}

export async function createCoPurchase(input: {
  propertyId: string;
  buyerUserId?: string | null;
  situation?: string | null;
  sharePercent: unknown;
  shareReference?: string | null;
  cashContributionCzk: unknown;
  proposedTotalPriceCzk?: unknown;
  purpose?: string | null;
  hasCoInvestor?: string | boolean | null;
  financing?: string | null;
  message?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  honeypot?: string | null;
}): Promise<StoredNegotiationResult> {
  const listing = await loadOpenListing(input.propertyId);
  if (!listing.ok) return listing;
  if (
    !listing.property.acceptsCoPurchaseSeekPartner &&
    !listing.property.acceptsCoPurchaseSellerRetains
  ) {
    return { ok: false, error: "Inzerent zájem o společnou koupi nepřijímá." };
  }
  if (isOwnListing(input.buyerUserId, listing.property)) {
    return { ok: false, error: "Na vlastní nabídku nelze poslat poptávku spolukoupě." };
  }
  const parsed = validateCoPurchase({
    ...input,
    allowSeekPartner: listing.property.acceptsCoPurchaseSeekPartner,
    allowSellerRetains: listing.property.acceptsCoPurchaseSellerRetains,
    offeredOwnershipPercent: listing.property.offeredOwnershipPercent,
  });
  if (!parsed.ok) return parsed;
  return persist({
    propertyId: listing.property.id,
    kind: "CO_PURCHASE",
    buyerUserId: input.buyerUserId,
    currency: "CZK",
    amountCzk: parsed.value.cashContributionCzk,
    financing: parsed.value.financing,
    message: parsed.value.message,
    situation: parsed.value.situation,
    sharePercent: parsed.value.sharePercent,
    shareReference: parsed.value.shareReference,
    cashContributionCzk: parsed.value.cashContributionCzk,
    proposedTotalPriceCzk: parsed.value.proposedTotalPriceCzk,
    purpose: parsed.value.purpose,
    hasCoInvestor: parsed.value.hasCoInvestor,
    buyerName: parsed.value.buyerName,
    buyerEmail: parsed.value.buyerEmail,
    buyerPhone: parsed.value.buyerPhone,
  });
}

function snapshotOf(row: {
  status: NegotiationStatus;
  amountCzk: number;
  versions: Array<{
    actor: "BUYER" | "SELLER";
    amountCzk: number | null;
    status: NegotiationStatus;
    message: string | null;
  }>;
}): NegotiationSnapshot {
  return {
    status: row.status,
    amountCzk: row.amountCzk,
    versions: row.versions.map((version) => ({
      actor: version.actor,
      amountCzk: version.amountCzk,
      status: version.status,
      message: version.message,
    })),
  };
}

export async function manageNegotiation(input: {
  negotiationId: string;
  actorUserId?: string | null;
  withdrawToken?: string | null;
  event:
    | { type: "counter"; amountCzk: number; message?: string | null }
    | { type: "revise"; amountCzk: number }
    | { type: "withdraw" }
    | { type: "status"; status: "IN_DISCUSSION" | "INFO_REQUESTED" | "REJECTED" | "CLOSED" };
}): Promise<{ ok: true; status: NegotiationStatusValue } | { ok: false; error: string }> {
  const row = await prisma.listingNegotiation.findUnique({
    where: { id: input.negotiationId },
    include: {
      versions: { orderBy: { createdAt: "asc" } },
      property: {
        select: { id: true, ownerUserId: true, listedByUserId: true },
      },
    },
  });
  if (!row) return { ok: false, error: "Návrh nenalezen." };

  const buyer =
    (input.actorUserId != null && input.actorUserId === row.buyerUserId) ||
    (input.withdrawToken != null && tokenMatches(row.buyerTokenHash, input.withdrawToken));
  const sellerEvent = input.event.type === "counter" || input.event.type === "status";
  if (sellerEvent) {
    if (!input.actorUserId) return { ok: false, error: "Pro správu návrhu se přihlaste." };
    const access = await assertCanManageListing({
      propertyId: row.propertyId,
      userId: input.actorUserId,
    });
    if (!access.ok) return { ok: false, error: "Nemáte oprávnění k této nabídce." };
  } else if (!buyer) {
    return { ok: false, error: "Tento návrh můžete měnit jen vy." };
  }

  const next = reduceNegotiation(snapshotOf(row), input.event);
  if ("error" in next) return { ok: false, error: next.error };
  const added = next.versions[next.versions.length - 1];
  if (!added) return { ok: false, error: "Návrh se nepodařilo upravit." };

  await prisma.$transaction([
    prisma.listingNegotiation.update({
      where: { id: row.id },
      data: {
        status: next.status,
        amountCzk: next.amountCzk,
      },
    }),
    prisma.listingNegotiationVersion.create({
      data: {
        negotiationId: row.id,
        actor: added.actor,
        actorUserId: input.actorUserId ?? null,
        amountCzk: added.amountCzk,
        message: added.message ?? null,
        status: added.status,
      },
    }),
  ]);

  return { ok: true, status: next.status };
}

const negotiationInclude = {
  versions: { orderBy: { createdAt: "asc" as const } },
  property: { select: { id: true, title: true, slug: true } },
};

export async function listNegotiationsForListing(input: {
  userId: string;
  propertyId: string;
}) {
  const access = await assertCanManageListing({
    propertyId: input.propertyId,
    userId: input.userId,
  });
  if (!access.ok) return [];
  return prisma.listingNegotiation.findMany({
    where: { propertyId: input.propertyId },
    include: negotiationInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listInquiriesForListing(input: {
  userId: string;
  propertyId: string;
}) {
  const access = await assertCanManageListing({
    propertyId: input.propertyId,
    userId: input.userId,
  });
  if (!access.ok) return [];
  return prisma.inquiry.findMany({
    where: { propertyId: input.propertyId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
