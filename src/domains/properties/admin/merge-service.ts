/**
 * Non-destructive property merge + revert foundation.
 * Never hard-deletes secondary; keeps sources + PropertyMergeEvent for undo.
 */

import type { Prisma, PropertyStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import {
  mapSourceTypeToTrust,
  planNonDestructiveMerge,
  type FieldCandidate,
  type MergePlan,
} from "@/domains/properties/service/merge-strategy";

const MERGE_FIELD_KEYS = [
  "title",
  "askingPrice",
  "usableArea",
  "layout",
  "publicLabel",
  "publicCity",
  "description",
  "condition",
] as const;

export type MergePreview = {
  candidateId: string;
  plan: MergePlan;
  surviving: {
    id: string;
    title: string;
    status: string;
    slug: string;
  };
  secondary: {
    id: string;
    title: string;
    status: string;
    slug: string;
  };
  fieldPreview: Array<{
    fieldKey: string;
    chosenValue: unknown;
    reason: string;
    fromPropertyId: string | null;
  }>;
};

function fieldValue(
  property: Record<string, unknown>,
  key: string,
): unknown {
  return property[key] ?? null;
}

function buildFieldGroups(
  a: Record<string, unknown> & { id: string; sources: Array<{ id: string; sourceType: string }> },
  b: Record<string, unknown> & { id: string; sources: Array<{ id: string; sourceType: string }> },
): FieldCandidate[][] {
  const primaryA = a.sources.find((s) => s) ?? null;
  const primaryB = b.sources.find((s) => s) ?? null;
  const trustA = mapSourceTypeToTrust(primaryA?.sourceType);
  const trustB = mapSourceTypeToTrust(primaryB?.sourceType);

  return MERGE_FIELD_KEYS.map((fieldKey) => {
    const group: FieldCandidate[] = [
      {
        fieldKey,
        value: fieldValue(a, fieldKey),
        sourceId: primaryA?.id ?? null,
        trust: trustA,
        observedAt: null,
      },
      {
        fieldKey,
        value: fieldValue(b, fieldKey),
        sourceId: primaryB?.id ?? null,
        trust: trustB,
        observedAt: null,
      },
    ];
    return group;
  });
}

export async function previewPropertyMerge(input: {
  candidateId: string;
  preferredCanonicalId?: string;
}): Promise<{ preview: MergePreview | null; error: string | null }> {
  try {
    const candidate = await prisma.propertyDuplicateCandidate.findUnique({
      where: { id: input.candidateId },
      include: {
        propertyA: { include: { sources: true, fieldOverrides: true } },
        propertyB: { include: { sources: true, fieldOverrides: true } },
      },
    });
    if (!candidate) return { preview: null, error: "Candidate not found." };
    if (candidate.status !== "PENDING") {
      return { preview: null, error: `Candidate status is ${candidate.status}.` };
    }

    const a = candidate.propertyA as unknown as Record<string, unknown> & {
      id: string;
      title: string;
      status: string;
      slug: string;
      sources: Array<{ id: string; sourceType: string }>;
      fieldOverrides: Array<{ fieldKey: string; value: string; locked: boolean }>;
    };
    const b = candidate.propertyB as unknown as Record<string, unknown> & {
      id: string;
      title: string;
      status: string;
      slug: string;
      sources: Array<{ id: string; sourceType: string }>;
      fieldOverrides: Array<{ fieldKey: string; value: string; locked: boolean }>;
    };

    const overrides: FieldCandidate[] = [
      ...a.fieldOverrides,
      ...b.fieldOverrides,
    ]
      .filter((o) => o.locked)
      .map((o) => ({
        fieldKey: o.fieldKey,
        value: o.value,
        trust: "manual" as const,
        lockedByOverride: true,
      }));

    const plan = planNonDestructiveMerge({
      propertyAId: a.id,
      propertyBId: b.id,
      preferredCanonicalId: input.preferredCanonicalId,
      fieldGroups: buildFieldGroups(a, b),
      overrides,
    });

    const surviving = plan.canonicalPropertyId === a.id ? a : b;
    const secondary = plan.canonicalPropertyId === a.id ? b : a;

    const fieldPreview = plan.resolutions.map((r) => {
      let fromPropertyId: string | null = null;
      if (r.chosen.sourceId) {
        if (a.sources.some((s) => s.id === r.chosen.sourceId)) fromPropertyId = a.id;
        else if (b.sources.some((s) => s.id === r.chosen.sourceId)) fromPropertyId = b.id;
      } else if (String(fieldValue(a, r.fieldKey)) === String(r.chosen.value)) {
        fromPropertyId = a.id;
      } else if (String(fieldValue(b, r.fieldKey)) === String(r.chosen.value)) {
        fromPropertyId = b.id;
      }
      return {
        fieldKey: r.fieldKey,
        chosenValue: r.chosen.value,
        reason: r.reason,
        fromPropertyId,
      };
    });

    return {
      preview: {
        candidateId: candidate.id,
        plan,
        surviving: {
          id: surviving.id,
          title: surviving.title,
          status: surviving.status,
          slug: surviving.slug,
        },
        secondary: {
          id: secondary.id,
          title: secondary.title,
          status: secondary.status,
          slug: secondary.slug,
        },
        fieldPreview,
      },
      error: null,
    };
  } catch (err) {
    return {
      preview: null,
      error: err instanceof Error ? err.message : "Preview failed",
    };
  }
}

function snapshotProperty(property: Record<string, unknown>): Record<string, unknown> {
  const keys = [
    "id",
    "status",
    "title",
    "askingPrice",
    "usableArea",
    "layout",
    "publicLabel",
    "publicCity",
    "description",
    "condition",
    "slug",
  ];
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = property[k] ?? null;
  return out;
}

export async function executePropertyMerge(input: {
  candidateId: string;
  preferredCanonicalId?: string;
  actorUserId: string;
  notes?: string;
}): Promise<
  | { ok: true; mergeEventId: string; canonicalPropertyId: string; secondaryPropertyId: string }
  | { ok: false; error: string }
> {
  const previewResult = await previewPropertyMerge({
    candidateId: input.candidateId,
    preferredCanonicalId: input.preferredCanonicalId,
  });
  if (!previewResult.preview) {
    return { ok: false, error: previewResult.error ?? "Preview failed" };
  }
  const { plan, secondary } = previewResult.preview;

  const secondaryFull = await prisma.property.findUnique({
    where: { id: secondary.id },
    include: { sources: true },
  });
  if (!secondaryFull) return { ok: false, error: "Secondary property missing." };

  const secondarySnapshot = snapshotProperty(
    secondaryFull as unknown as Record<string, unknown>,
  );
  const sourceIdsMoved = secondaryFull.sources.map((s) => s.id);

  const canonicalPatch: Record<string, unknown> = {};
  for (const r of plan.resolutions) {
    if (plan.lockedFieldKeys.includes(r.fieldKey)) continue;
    const v = r.chosen.value;
    if (v == null || v === "") continue;
    if (r.fieldKey === "askingPrice" || r.fieldKey === "usableArea") {
      const n = Number(v);
      if (Number.isFinite(n)) canonicalPatch[r.fieldKey] = n;
    } else {
      canonicalPatch[r.fieldKey] = v;
    }
  }

  let mergeEventId: string;
  try {
    mergeEventId = await prisma.$transaction(async (tx) => {
      const claimed = await tx.propertyDuplicateCandidate.updateMany({
        where: { id: input.candidateId, status: "PENDING" },
        data: {
          status: "MERGED",
          mergeIntoPropertyId: plan.canonicalPropertyId,
          reviewedAt: new Date(),
          reviewedById: input.actorUserId,
          notes: input.notes?.trim() || null,
        },
      });
      if (claimed.count !== 1) {
        throw new Error(
          "Merge candidate is no longer PENDING (concurrent merge).",
        );
      }

      if (Object.keys(canonicalPatch).length > 0) {
        await tx.property.update({
          where: { id: plan.canonicalPropertyId },
          data: canonicalPatch as Prisma.PropertyUpdateInput,
        });
      }

      // Re-point sources onto canonical — secondary row kept for history.
      if (sourceIdsMoved.length > 0) {
        await tx.propertySource.updateMany({
          where: { id: { in: sourceIdsMoved } },
          data: { propertyId: plan.canonicalPropertyId },
        });
      }

      await tx.property.update({
        where: { id: plan.secondaryPropertyId },
        data: {
          status: "ARCHIVED" as PropertyStatus,
          visibility: "PRIVATE",
        },
      });

      const event = await tx.propertyMergeEvent.create({
        data: {
          candidateId: input.candidateId,
          canonicalPropertyId: plan.canonicalPropertyId,
          secondaryPropertyId: plan.secondaryPropertyId,
          planJson: {
            ...plan,
            sourceIdsMoved,
          } as unknown as Prisma.InputJsonValue,
          secondarySnapshot: secondarySnapshot as Prisma.InputJsonValue,
          secondaryPriorStatus: String(secondaryFull.status),
          createdByUserId: input.actorUserId,
        },
      });

      return event.id;
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Merge failed";
    return { ok: false, error: message };
  }

  await writeAuditLog({
    action: "admin.property.merge",
    entity: "PropertyMergeEvent",
    entityId: mergeEventId,
    actorId: input.actorUserId,
    meta: {
      candidateId: input.candidateId,
      canonicalPropertyId: plan.canonicalPropertyId,
      secondaryPropertyId: plan.secondaryPropertyId,
      sourceIdsMoved,
    },
  });

  return {
    ok: true,
    mergeEventId,
    canonicalPropertyId: plan.canonicalPropertyId,
    secondaryPropertyId: plan.secondaryPropertyId,
  };
}

/**
 * Undo foundation: restore secondary status + move sources back when recorded.
 */
export async function revertPropertyMerge(input: {
  mergeEventId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const event = await prisma.propertyMergeEvent.findUnique({
    where: { id: input.mergeEventId },
  });
  if (!event) return { ok: false, error: "Merge event not found." };
  if (event.reversedAt) return { ok: false, error: "Already reverted." };

  const planJson = event.planJson as {
    sourceIdsMoved?: string[];
  };
  const sourceIdsMoved = planJson.sourceIdsMoved ?? [];

  await prisma.$transaction(async (tx) => {
    if (sourceIdsMoved.length > 0) {
      await tx.propertySource.updateMany({
        where: { id: { in: sourceIdsMoved } },
        data: { propertyId: event.secondaryPropertyId },
      });
    }

    await tx.property.update({
      where: { id: event.secondaryPropertyId },
      data: {
        status: event.secondaryPriorStatus as PropertyStatus,
      },
    });

    if (event.candidateId) {
      await tx.propertyDuplicateCandidate.update({
        where: { id: event.candidateId },
        data: {
          status: "REVERTED" as never,
          mergeIntoPropertyId: null,
          reviewedAt: new Date(),
          reviewedById: input.actorUserId,
          notes: "Merge reverted",
        },
      });
    }

    await tx.propertyMergeEvent.update({
      where: { id: event.id },
      data: {
        reversedAt: new Date(),
        reversedByUserId: input.actorUserId,
      },
    });
  });

  await writeAuditLog({
    action: "admin.property.merge.revert",
    entity: "PropertyMergeEvent",
    entityId: event.id,
    actorId: input.actorUserId,
    meta: {
      secondaryPropertyId: event.secondaryPropertyId,
      canonicalPropertyId: event.canonicalPropertyId,
    },
  });

  return { ok: true };
}
