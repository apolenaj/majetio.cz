/**
 * Data Quality Center — list + workflow mutations.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import {
  categoryForRuleCode,
  explainDataQualityIssue,
  isOpenDqStatus,
  toWorkflowStatus,
  type DqCategory,
  type DqWorkflowStatus,
} from "@/domains/data-quality/admin/taxonomy";

export type DqListFilters = {
  category?: DqCategory | string;
  status?: string;
  severity?: string;
  q?: string;
  take?: number;
  skip?: number;
};

export type DqListItem = {
  id: string;
  ruleCode: string;
  ruleVersion: string;
  category: string;
  severity: string;
  status: string;
  workflowStatus: DqWorkflowStatus;
  message: string;
  explanation: string;
  field: string | null;
  propertyId: string | null;
  locationId: string | null;
  detectedAt: Date;
  resolutionReason: string | null;
};

export async function listDataQualityIssues(
  filters: DqListFilters = {},
): Promise<{ items: DqListItem[]; total: number; error: string | null }> {
  const take = Math.min(filters.take ?? 50, 100);
  const skip = filters.skip ?? 0;

  try {
    const where: Prisma.DataQualityIssueWhereInput = {};
    if (filters.category) {
      where.category = filters.category as never;
    }
    if (filters.severity) {
      where.severity = filters.severity as never;
    }
    if (filters.status) {
      const s = filters.status;
      if (s === "IN_REVIEW") {
        where.status = { in: ["IN_REVIEW", "ACKNOWLEDGED"] as never };
      } else if (s === "FALSE_POSITIVE") {
        where.status = { in: ["FALSE_POSITIVE", "IGNORED"] as never };
      } else if (s === "OPEN_ATTENTION") {
        where.status = {
          in: ["OPEN", "ACKNOWLEDGED", "IN_REVIEW"] as never,
        };
      } else {
        where.status = s as never;
      }
    }
    if (filters.q?.trim()) {
      const q = filters.q.trim();
      where.OR = [
        { ruleCode: { contains: q, mode: "insensitive" } },
        { message: { contains: q, mode: "insensitive" } },
        { explanation: { contains: q, mode: "insensitive" } },
        { propertyId: { equals: q } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.dataQualityIssue.findMany({
        where,
        orderBy: [{ severity: "asc" }, { detectedAt: "desc" }],
        take,
        skip,
      }),
      prisma.dataQualityIssue.count({ where }),
    ]);

    const items: DqListItem[] = rows.map((r) => {
      const meta =
        r.meta && typeof r.meta === "object"
          ? (r.meta as Record<string, unknown>)
          : null;
      const ruleVersion =
        (r as { ruleVersion?: string }).ruleVersion ?? "1";
      const category =
        (r as { category?: string }).category ??
        categoryForRuleCode(r.ruleCode);
      const explanation =
        (r as { explanation?: string | null }).explanation?.trim() ||
        explainDataQualityIssue({
          ruleCode: r.ruleCode,
          message: r.message,
          field: r.field,
          meta,
          ruleVersion,
        });

      return {
        id: r.id,
        ruleCode: r.ruleCode,
        ruleVersion,
        category,
        severity: r.severity,
        status: r.status,
        workflowStatus: toWorkflowStatus(r.status),
        message: r.message,
        explanation,
        field: r.field,
        propertyId: r.propertyId,
        locationId: r.locationId,
        detectedAt: r.detectedAt,
        resolutionReason:
          (r as { resolutionReason?: string | null }).resolutionReason ?? null,
      };
    });

    return { items, total, error: null };
  } catch (err) {
    return {
      items: [],
      total: 0,
      error: err instanceof Error ? err.message : "DQ list failed",
    };
  }
}

export async function getDataQualityCategoryCounts(): Promise<
  Record<string, number>
> {
  try {
    const groups = await prisma.dataQualityIssue.groupBy({
      by: ["category"],
      where: {
        status: { in: ["OPEN", "ACKNOWLEDGED", "IN_REVIEW"] as never },
      },
      _count: { _all: true },
    });
    const out: Record<string, number> = {
      MISSING: 0,
      CONFLICT: 0,
      ANOMALY: 0,
      STALE: 0,
      DUPLICATE: 0,
      USER_REPORT: 0,
    };
    for (const g of groups) {
      const key = String((g as { category?: string }).category ?? "ANOMALY");
      out[key] = g._count._all;
    }
    return out;
  } catch {
    return {
      MISSING: 0,
      CONFLICT: 0,
      ANOMALY: 0,
      STALE: 0,
      DUPLICATE: 0,
      USER_REPORT: 0,
    };
  }
}

export async function transitionDataQualityIssue(input: {
  issueId: string;
  nextStatus: DqWorkflowStatus;
  reason: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (
    (input.nextStatus === "RESOLVED" ||
      input.nextStatus === "FALSE_POSITIVE") &&
    input.reason.trim().length < 8
  ) {
    return { ok: false, error: "Reason is required (min. 8 characters)." };
  }

  const issue = await prisma.dataQualityIssue.findUnique({
    where: { id: input.issueId },
  });
  if (!issue) return { ok: false, error: "Issue not found." };

  const data: Record<string, unknown> = {
    status: input.nextStatus,
  };

  if (input.nextStatus === "IN_REVIEW") {
    data.reviewedAt = new Date();
    data.reviewedByUserId = input.actorUserId;
  }
  if (
    input.nextStatus === "RESOLVED" ||
    input.nextStatus === "FALSE_POSITIVE"
  ) {
    data.resolvedAt = new Date();
    data.resolvedByUserId = input.actorUserId;
    data.resolutionReason = input.reason.trim();
  }

  await prisma.dataQualityIssue.update({
    where: { id: issue.id },
    data: data as Prisma.DataQualityIssueUpdateInput,
  });

  await writeAuditLog({
    action: `admin.dq.${input.nextStatus.toLowerCase()}`,
    entity: "DataQualityIssue",
    entityId: issue.id,
    actorId: input.actorUserId,
    meta: {
      previousStatus: issue.status,
      nextStatus: input.nextStatus,
      reason: input.reason.trim().slice(0, 300),
      stillOpen: isOpenDqStatus(input.nextStatus),
    },
  });

  return { ok: true };
}
