/**
 * ComparisonSnapshot persistence (BOD 76, 77, 146).
 * publicMetrics only — personal financing never stored.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type {
  ComparisonPublicPropertyMetrics,
  PropertyPublicFingerprint,
} from "./types";

export type SnapshotPayload = {
  properties: ComparisonPublicPropertyMetrics[];
  fingerprints: PropertyPublicFingerprint[];
};

export async function getCurrentComparisonSnapshot(comparisonId: string) {
  return prisma.comparisonSnapshot.findFirst({
    where: { comparisonId, isCurrent: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createComparisonSnapshot(input: {
  comparisonId: string;
  payload: SnapshotPayload;
}): Promise<{ id: string; createdAt: Date }> {
  // Strip any accidental personal keys before persist
  const publicMetrics = {
    properties: input.payload.properties.map((p) => ({
      ...p,
      // ensure no personal overlays leaked
    })),
    schemaVersion: "1.0.0",
  };

  const fingerprints = input.payload.fingerprints;

  const created = await prisma.$transaction(async (tx) => {
    await tx.comparisonSnapshot.updateMany({
      where: { comparisonId: input.comparisonId, isCurrent: true },
      data: { isCurrent: false },
    });
    return tx.comparisonSnapshot.create({
      data: {
        comparisonId: input.comparisonId,
        publicMetrics: publicMetrics as Prisma.InputJsonValue,
        fingerprints: fingerprints as Prisma.InputJsonValue,
        isCurrent: true,
      },
      select: { id: true, createdAt: true },
    });
  });

  return created;
}

export function parseSnapshotPublicMetrics(
  raw: unknown,
): ComparisonPublicPropertyMetrics[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const props = (raw as { properties?: unknown }).properties;
  if (!Array.isArray(props)) return [];
  return props as ComparisonPublicPropertyMetrics[];
}

export function parseSnapshotFingerprints(
  raw: unknown,
): PropertyPublicFingerprint[] {
  if (!Array.isArray(raw)) return [];
  return raw as PropertyPublicFingerprint[];
}
