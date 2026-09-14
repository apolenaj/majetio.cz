import type {
  MortgageDataTier as PrismaDataTier,
  MortgageOfferStatus as PrismaStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db";

import type { CanonicalMortgageOffer, MortgageDataTier, MortgageOfferStatus } from "../schemas";
import type { MortgageOfferStore } from "../pipeline/ingest";
import type { CompareResult, ExistingStoredOffer } from "../pipeline/types";

function toDomainStatus(status: PrismaStatus): MortgageOfferStatus {
  const map: Record<PrismaStatus, MortgageOfferStatus> = {
    ACTIVE: "active",
    REVIEW_REQUIRED: "review_required",
    INACTIVE: "inactive",
    STALE: "stale",
  };
  return map[status];
}

function toPrismaStatus(status: MortgageOfferStatus): PrismaStatus {
  const map: Record<MortgageOfferStatus, PrismaStatus> = {
    active: "ACTIVE",
    review_required: "REVIEW_REQUIRED",
    inactive: "INACTIVE",
    stale: "STALE",
  };
  return map[status];
}

function toDomainTier(tier: PrismaDataTier): MortgageDataTier {
  const map: Record<PrismaDataTier, MortgageDataTier> = {
    LIVE: "live",
    CACHED: "cached",
    VERIFIED: "verified",
  };
  return map[tier];
}

function toPrismaTier(tier: MortgageDataTier): PrismaDataTier {
  const map: Record<MortgageDataTier, PrismaDataTier> = {
    live: "LIVE",
    cached: "CACHED",
    verified: "VERIFIED",
  };
  return map[tier];
}

function rowToDomain(row: {
  id: string;
  externalId: string | null;
  bankName: string;
  productName: string;
  interestRateFrom: number;
  aprFrom: number | null;
  fixationYears: number | null;
  ltvMaxPct: number | null;
  ltvMinPct: number | null;
  source: string;
  status: PrismaStatus;
  dataTier: PrismaDataTier;
  retrievedAt: Date;
  verifiedAt: Date | null;
  schemaVersion: string;
  dedupeKey: string;
}): ExistingStoredOffer {
  return {
    id: row.id,
    externalId: row.externalId,
    bankName: row.bankName,
    productName: row.productName,
    interestRateFrom: row.interestRateFrom,
    aprFrom: row.aprFrom,
    fixationYears: row.fixationYears,
    ltvMaxPct: row.ltvMaxPct,
    ltvMinPct: row.ltvMinPct,
    source: row.source,
    status: toDomainStatus(row.status),
    dataTier: toDomainTier(row.dataTier),
    retrievedAt: row.retrievedAt,
    verifiedAt: row.verifiedAt,
    schemaVersion: row.schemaVersion,
    dedupeKey: row.dedupeKey,
    isSponsored: false,
    productSlug: null,
    termsUrl: null,
  };
}

export class PrismaMortgageOfferStore implements MortgageOfferStore {
  async listOffers(): Promise<ExistingStoredOffer[]> {
    const rows = await prisma.mortgageOffer.findMany({
      orderBy: { retrievedAt: "desc" },
    });
    return rows.map(rowToDomain);
  }

  async upsertOffers(
    offers: CanonicalMortgageOffer[],
    input: {
      runId: string;
      historyOnlyOnChange: boolean;
      comparisons: CompareResult[];
    },
  ): Promise<{ historyRowsCreated: number }> {
    let historyRowsCreated = 0;
    const comparisonByKey = new Map(
      input.comparisons.map((c) => [c.offerKey, c]),
    );

    for (const offer of offers) {
      const dedupeKey = `${offer.bankName}::${offer.productName}::${offer.fixationYears ?? "none"}`;
      const existing = await prisma.mortgageOffer.findUnique({
        where: { dedupeKey },
      });

      const comparison = comparisonByKey.get(dedupeKey);
      const rateChanged =
        existing == null ||
        existing.interestRateFrom !== offer.interestRateFrom ||
        existing.aprFrom !== offer.aprFrom;

      if (!input.historyOnlyOnChange || rateChanged) {
        if (existing && rateChanged) {
          await prisma.mortgageRateHistory.create({
            data: {
              offerId: existing.id,
              interestRateFrom: offer.interestRateFrom,
              aprFrom: offer.aprFrom,
              fixationYears: offer.fixationYears,
              previousInterestRateFrom: existing.interestRateFrom,
              previousAprFrom: existing.aprFrom,
              source: offer.source,
              ingestionRunId: input.runId,
            },
          });
          historyRowsCreated += 1;
        } else if (!existing) {
          const created = await prisma.mortgageOffer.create({
            data: {
              id: offer.id,
              externalId: offer.externalId ?? null,
              bankName: offer.bankName,
              productName: offer.productName,
              interestRateFrom: offer.interestRateFrom,
              aprFrom: offer.aprFrom,
              fixationYears: offer.fixationYears,
              ltvMaxPct: offer.ltvMaxPct,
              ltvMinPct: offer.ltvMinPct,
              arrangementFeeCzk: offer.fees?.arrangementFeeCzk ?? null,
              valuationFeeCzk: offer.fees?.valuationFeeCzk ?? null,
              monthlyFeeCzk: offer.fees?.monthlyFeeCzk ?? null,
              source: offer.source,
              status: toPrismaStatus(offer.status),
              dataTier: toPrismaTier(offer.dataTier),
              retrievedAt: offer.retrievedAt,
              verifiedAt: offer.verifiedAt,
              schemaVersion: offer.schemaVersion,
              dedupeKey,
            },
          });

          await prisma.mortgageRateHistory.create({
            data: {
              offerId: created.id,
              interestRateFrom: offer.interestRateFrom,
              aprFrom: offer.aprFrom,
              fixationYears: offer.fixationYears,
              source: offer.source,
              ingestionRunId: input.runId,
            },
          });
          historyRowsCreated += 1;
          continue;
        }
      }

      await prisma.mortgageOffer.upsert({
        where: { dedupeKey },
        create: {
          id: offer.id,
          externalId: offer.externalId ?? null,
          bankName: offer.bankName,
          productName: offer.productName,
          interestRateFrom: offer.interestRateFrom,
          aprFrom: offer.aprFrom,
          fixationYears: offer.fixationYears,
          ltvMaxPct: offer.ltvMaxPct,
          ltvMinPct: offer.ltvMinPct,
          arrangementFeeCzk: offer.fees?.arrangementFeeCzk ?? null,
          valuationFeeCzk: offer.fees?.valuationFeeCzk ?? null,
          monthlyFeeCzk: offer.fees?.monthlyFeeCzk ?? null,
          source: offer.source,
          status: toPrismaStatus(offer.status),
          dataTier: toPrismaTier(offer.dataTier),
          retrievedAt: offer.retrievedAt,
          verifiedAt: offer.verifiedAt,
          schemaVersion: offer.schemaVersion,
          dedupeKey,
        },
        update: {
          interestRateFrom: offer.interestRateFrom,
          aprFrom: offer.aprFrom,
          fixationYears: offer.fixationYears,
          ltvMaxPct: offer.ltvMaxPct,
          ltvMinPct: offer.ltvMinPct,
          arrangementFeeCzk: offer.fees?.arrangementFeeCzk ?? null,
          valuationFeeCzk: offer.fees?.valuationFeeCzk ?? null,
          monthlyFeeCzk: offer.fees?.monthlyFeeCzk ?? null,
          status: toPrismaStatus(offer.status),
          dataTier: toPrismaTier(offer.dataTier),
          retrievedAt: offer.retrievedAt,
          verifiedAt: offer.verifiedAt,
          staleMarkedAt: null,
          schemaVersion: offer.schemaVersion,
        },
      });
    }

    return { historyRowsCreated };
  }

  async markAllStale(): Promise<void> {
    await prisma.mortgageOffer.updateMany({
      data: {
        status: "STALE",
        staleMarkedAt: new Date(),
      },
    });
  }
}
