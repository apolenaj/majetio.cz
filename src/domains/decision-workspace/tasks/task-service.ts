import type {
  PropertyDecisionTaskStatus,
  PropertyDecisionTaskType,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  suggestDecisionTasks,
  type ChecklistSuggestionContext,
} from "./checklist-defaults";

export type PropertyDecisionTaskDto = {
  id: string;
  propertyId: string;
  type: PropertyDecisionTaskType;
  title: string;
  status: PropertyDecisionTaskStatus;
  dueDate: string | null;
  suggested: boolean;
  createdAt: string;
  completedAt: string | null;
};

function toDto(row: {
  id: string;
  propertyId: string;
  type: PropertyDecisionTaskType;
  title: string;
  status: PropertyDecisionTaskStatus;
  dueDate: Date | null;
  suggested: boolean;
  createdAt: Date;
  completedAt: Date | null;
}): PropertyDecisionTaskDto {
  return {
    id: row.id,
    propertyId: row.propertyId,
    type: row.type,
    title: row.title,
    status: row.status,
    dueDate: row.dueDate?.toISOString() ?? null,
    suggested: row.suggested,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

async function resolvePropertyId(
  propertyIdOrSlug: string,
): Promise<string | null> {
  const row = await prisma.property.findFirst({
    where: {
      OR: [{ id: propertyIdOrSlug }, { slug: propertyIdOrSlug }],
    },
    select: { id: true },
  });
  return row?.id ?? null;
}

export async function listTasksForUser(input: {
  userId: string;
  propertyIdOrSlug: string;
}): Promise<PropertyDecisionTaskDto[]> {
  const propertyId = await resolvePropertyId(input.propertyIdOrSlug);
  if (!propertyId) return [];

  const rows = await prisma.propertyDecisionTask.findMany({
    where: { userId: input.userId, propertyId },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toDto);
}

export async function createTaskForUser(input: {
  userId: string;
  propertyIdOrSlug: string;
  title: string;
  type?: PropertyDecisionTaskType;
  dueDate?: Date | null;
  suggested?: boolean;
}): Promise<
  | { ok: true; task: PropertyDecisionTaskDto }
  | { ok: false; error: string }
> {
  const propertyId = await resolvePropertyId(input.propertyIdOrSlug);
  if (!propertyId) {
    return { ok: false, error: "Nemovitost nenalezena v katalogu." };
  }
  const title = input.title.trim().slice(0, 200);
  if (title.length < 2) {
    return { ok: false, error: "Název úkolu je příliš krátký." };
  }

  const row = await prisma.propertyDecisionTask.create({
    data: {
      userId: input.userId,
      propertyId,
      title,
      type: input.type ?? "CUSTOM",
      dueDate: input.dueDate ?? null,
      suggested: input.suggested ?? false,
    },
  });
  return { ok: true, task: toDto(row) };
}

export async function setTaskStatusForUser(input: {
  userId: string;
  taskId: string;
  status: PropertyDecisionTaskStatus;
}): Promise<
  | { ok: true; task: PropertyDecisionTaskDto }
  | { ok: false; error: string }
> {
  const existing = await prisma.propertyDecisionTask.findFirst({
    where: { id: input.taskId, userId: input.userId },
  });
  if (!existing) return { ok: false, error: "Úkol nenalezen." };

  const row = await prisma.propertyDecisionTask.update({
    where: { id: existing.id },
    data: {
      status: input.status,
      completedAt:
        input.status === "DONE"
          ? new Date()
          : input.status === "PENDING" || input.status === "IN_PROGRESS"
            ? null
            : existing.completedAt,
    },
  });
  return { ok: true, task: toDto(row) };
}

export async function deleteTaskForUser(input: {
  userId: string;
  taskId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await prisma.propertyDecisionTask.deleteMany({
    where: { id: input.taskId, userId: input.userId },
  });
  if (result.count === 0) return { ok: false, error: "Úkol nenalezen." };
  return { ok: true };
}

/**
 * Seed suggested tasks that are not yet present (by type).
 * Never deletes user tasks.
 */
export async function seedSuggestedTasksForUser(input: {
  userId: string;
  propertyIdOrSlug: string;
  context: ChecklistSuggestionContext;
}): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  const propertyId = await resolvePropertyId(input.propertyIdOrSlug);
  if (!propertyId) {
    return { ok: false, error: "Nemovitost nenalezena v katalogu." };
  }

  const existing = await prisma.propertyDecisionTask.findMany({
    where: { userId: input.userId, propertyId },
    select: { type: true, title: true },
  });
  const existingTypes = new Set(existing.map((e) => e.type));
  const suggestions = suggestDecisionTasks(input.context).filter(
    (s) => !existingTypes.has(s.type),
  );

  if (suggestions.length === 0) return { ok: true, created: 0 };

  await prisma.propertyDecisionTask.createMany({
    data: suggestions.map((s) => ({
      userId: input.userId,
      propertyId,
      type: s.type,
      title: s.title,
      suggested: true,
    })),
  });

  return { ok: true, created: suggestions.length };
}
