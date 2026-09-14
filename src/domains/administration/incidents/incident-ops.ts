/**
 * Incident Management — SEV1–SEV4, timeline, linked entities (spec 126–131).
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeOpsAuditLog } from "@/domains/administration/audit/ops-audit-log";

export const INCIDENT_SEV_LEVELS = ["SEV1", "SEV2", "SEV3", "SEV4"] as const;
export type IncidentSevLevel = (typeof INCIDENT_SEV_LEVELS)[number];

export const INCIDENT_OPS_STATUSES = [
  "OPEN",
  "ACKNOWLEDGED",
  "INVESTIGATING",
  "MITIGATED",
  "RESOLVED",
  "CLOSED",
] as const;
export type IncidentOpsStatus = (typeof INCIDENT_OPS_STATUSES)[number];

export const INCIDENT_TIMELINE_EVENT_TYPES = [
  "CREATED",
  "STATUS_CHANGE",
  "SEVERITY_CHANGE",
  "NOTE",
  "OWNER_CHANGE",
  "LINK_ADDED",
  "LINK_REMOVED",
  "SYSTEM",
] as const;
export type IncidentTimelineEventType =
  (typeof INCIDENT_TIMELINE_EVENT_TYPES)[number];

export type CreateIncidentInput = {
  title: string;
  description: string;
  severity?: IncidentSevLevel;
  ownerUserId?: string | null;
  openedByUserId?: string | null;
  affectedSystems?: string[];
  internalNotes?: string | null;
  marketCode?: string | null;
  correlationId?: string | null;
  startedAt?: Date;
};

export type IncidentListItem = {
  id: string;
  title: string;
  description: string;
  severity: IncidentSevLevel;
  status: IncidentOpsStatus;
  ownerUserId: string | null;
  startedAt: Date;
  resolvedAt: Date | null;
  affectedSystems: string[];
};

function isTerminalStatus(status: IncidentOpsStatus): boolean {
  return status === "RESOLVED" || status === "CLOSED";
}

export async function createIncident(
  input: CreateIncidentInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (input.title.trim().length < 4) {
    return { ok: false, error: "title min. 4 characters." };
  }
  if (input.description.trim().length < 8) {
    return { ok: false, error: "description min. 8 characters." };
  }

  const severity = input.severity ?? "SEV3";
  const row = await prisma.incident.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      severity,
      status: "OPEN",
      ownerUserId: input.ownerUserId ?? null,
      openedByUserId: input.openedByUserId ?? null,
      affectedSystems: input.affectedSystems ?? [],
      internalNotes: input.internalNotes?.trim() || null,
      marketCode: input.marketCode?.trim().toUpperCase() || null,
      correlationId: input.correlationId ?? null,
      startedAt: input.startedAt ?? new Date(),
      timeline: {
        create: {
          eventType: "CREATED",
          actorUserId: input.openedByUserId ?? null,
          message: `Incident opened as ${severity}`,
        },
      },
    },
    select: { id: true },
  });

  await writeOpsAuditLog({
    action: "ops.incident.create",
    entityType: "Incident",
    entityId: row.id,
    actorId: input.openedByUserId,
    actorType: input.openedByUserId ? "USER" : "SYSTEM",
    afterSummary: `${severity} OPEN · ${input.title.trim().slice(0, 120)}`,
    correlationId: input.correlationId,
    meta: { severity, affectedSystems: input.affectedSystems ?? [] },
  });

  return { ok: true, id: row.id };
}

export async function listIncidents(input?: {
  status?: IncidentOpsStatus;
  severity?: IncidentSevLevel;
  ownerUserId?: string;
  take?: number;
}): Promise<{ items: IncidentListItem[]; error: string | null }> {
  try {
    const where: Prisma.IncidentWhereInput = {};
    if (input?.status) where.status = input.status;
    if (input?.severity) where.severity = input.severity;
    if (input?.ownerUserId) where.ownerUserId = input.ownerUserId;

    const rows = await prisma.incident.findMany({
      where,
      orderBy: [{ severity: "asc" }, { startedAt: "desc" }],
      take: Math.min(input?.take ?? 50, 100),
    });

    return {
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        severity: r.severity as IncidentSevLevel,
        status: r.status as IncidentOpsStatus,
        ownerUserId: r.ownerUserId,
        startedAt: r.startedAt,
        resolvedAt: r.resolvedAt,
        affectedSystems: r.affectedSystems,
      })),
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Incident list failed",
    };
  }
}

export async function appendIncidentTimeline(input: {
  incidentId: string;
  eventType: IncidentTimelineEventType;
  message: string;
  actorUserId?: string | null;
  meta?: Record<string, unknown>;
  occurredAt?: Date;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (input.message.trim().length < 1) {
    return { ok: false, error: "message required." };
  }
  const exists = await prisma.incident.findUnique({
    where: { id: input.incidentId },
    select: { id: true },
  });
  if (!exists) return { ok: false, error: "Incident not found." };

  const row = await prisma.incidentTimelineEvent.create({
    data: {
      incidentId: input.incidentId,
      eventType: input.eventType,
      message: input.message.trim(),
      actorUserId: input.actorUserId ?? null,
      meta: (input.meta ?? undefined) as Prisma.InputJsonValue | undefined,
      occurredAt: input.occurredAt ?? new Date(),
    },
    select: { id: true },
  });

  return { ok: true, id: row.id };
}

export async function updateIncidentStatus(input: {
  incidentId: string;
  status: IncidentOpsStatus;
  actorUserId: string;
  note?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.incident.findUnique({
    where: { id: input.incidentId },
  });
  if (!row) return { ok: false, error: "Incident not found." };

  const prev = row.status as IncidentOpsStatus;
  const resolvedAt = isTerminalStatus(input.status)
    ? row.resolvedAt ?? new Date()
    : null;

  await prisma.incident.update({
    where: { id: row.id },
    data: {
      status: input.status,
      resolvedAt,
    },
  });

  await appendIncidentTimeline({
    incidentId: row.id,
    eventType: "STATUS_CHANGE",
    actorUserId: input.actorUserId,
    message:
      input.note?.trim() ||
      `Status ${prev} → ${input.status}`,
    meta: { from: prev, to: input.status },
  });

  await writeOpsAuditLog({
    action: "ops.incident.status",
    entityType: "Incident",
    entityId: row.id,
    actorId: input.actorUserId,
    beforeSummary: prev,
    afterSummary: input.status,
    reason: input.note,
    correlationId: row.correlationId,
  });

  return { ok: true };
}

export async function linkIncidentEntity(input: {
  incidentId: string;
  entityType: string;
  entityId: string;
  label?: string | null;
  linkedByUserId?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!input.entityType.trim() || !input.entityId.trim()) {
    return { ok: false, error: "entityType and entityId required." };
  }

  try {
    const row = await prisma.incidentLinkedEntity.create({
      data: {
        incidentId: input.incidentId,
        entityType: input.entityType.trim(),
        entityId: input.entityId.trim(),
        label: input.label?.trim() || null,
        linkedByUserId: input.linkedByUserId ?? null,
      },
      select: { id: true },
    });

    await appendIncidentTimeline({
      incidentId: input.incidentId,
      eventType: "LINK_ADDED",
      actorUserId: input.linkedByUserId,
      message: `Linked ${input.entityType}:${input.entityId}`,
      meta: {
        entityType: input.entityType,
        entityId: input.entityId,
      },
    });

    return { ok: true, id: row.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Link failed",
    };
  }
}

export async function getIncidentDetail(incidentId: string) {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        timeline: { orderBy: { occurredAt: "asc" }, take: 100 },
        linkedEntities: { orderBy: { linkedAt: "desc" }, take: 50 },
      },
    });
    return { incident, error: null as string | null };
  } catch (err) {
    return {
      incident: null,
      error: err instanceof Error ? err.message : "Incident detail failed",
    };
  }
}
