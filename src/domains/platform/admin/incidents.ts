/**
 * Lightweight Platform Incidents (DATA | SECURITY | PAYMENTS | AVAILABILITY).
 */

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";

export type IncidentCategory =
  | "DATA"
  | "SECURITY"
  | "PAYMENTS"
  | "AVAILABILITY";
export type IncidentStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "MITIGATED"
  | "RESOLVED";
export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export async function listIncidents(input?: {
  status?: IncidentStatus;
  category?: IncidentCategory;
}): Promise<{
  items: Array<{
    id: string;
    title: string;
    summary: string;
    category: string;
    severity: string;
    status: string;
    marketCode: string | null;
    createdAt: Date;
    resolvedAt: Date | null;
  }>;
  error: string | null;
}> {
  try {
    const where: Record<string, unknown> = {};
    if (input?.status) where.status = input.status;
    if (input?.category) where.category = input.category;

    const rows = await prisma.platformIncident.findMany({
      where: where as never,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        category: r.category,
        severity: r.severity,
        status: r.status,
        marketCode: r.marketCode,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
      })),
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Incidents list failed",
    };
  }
}

export async function openIncident(input: {
  title: string;
  summary: string;
  category: IncidentCategory;
  severity?: IncidentSeverity;
  marketCode?: string | null;
  actorUserId: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (input.title.trim().length < 4 || input.summary.trim().length < 8) {
    return { ok: false, error: "title and summary required." };
  }

  const row = await prisma.platformIncident.create({
    data: {
      title: input.title.trim(),
      summary: input.summary.trim(),
      category: input.category,
      severity: input.severity ?? "MEDIUM",
      status: "OPEN",
      marketCode: input.marketCode?.trim().toUpperCase() || null,
      openedByUserId: input.actorUserId,
    },
  });

  await writeAuditLog({
    action: "admin.incident.open",
    entity: "PlatformIncident",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: { category: row.category, severity: row.severity },
  });

  return { ok: true, id: row.id };
}

export async function updateIncidentStatus(input: {
  incidentId: string;
  status: IncidentStatus;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "Reason required." };
  }
  const row = await prisma.platformIncident.findUnique({
    where: { id: input.incidentId },
  });
  if (!row) return { ok: false, error: "Incident not found." };

  await prisma.platformIncident.update({
    where: { id: row.id },
    data: {
      status: input.status,
      resolvedAt: input.status === "RESOLVED" ? new Date() : row.resolvedAt,
      ownerUserId: input.actorUserId,
    },
  });

  await writeAuditLog({
    action: "admin.incident.status",
    entity: "PlatformIncident",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: {
      from: row.status,
      to: input.status,
      reason: input.reason.trim().slice(0, 300),
    },
  });

  return { ok: true };
}
