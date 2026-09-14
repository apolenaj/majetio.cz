"use server";

import {
  PropertyDecisionTaskStatus,
  PropertyDecisionTaskType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { loadFinancialPassport } from "@/lib/financial-passport/actions";
import { assertWorkspaceMutationAllowed } from "@/lib/security/workspace-rate-limit";
import {
  deleteNoteForUser,
  getNoteForUser,
  listNotesForProperties,
  upsertNoteForUser,
} from "../notes/note-service";
import { sanitizeNoteTags } from "../notes/tags";
import {
  createTaskForUser,
  deleteTaskForUser,
  listTasksForUser,
  seedSuggestedTasksForUser,
  setTaskStatusForUser,
} from "../tasks/task-service";
import { suggestDecisionTasks } from "../tasks/checklist-defaults";
import {
  getDecisionPrioritiesForUser,
  saveDecisionPrioritiesForUser,
  setComparisonManualOrder,
} from "../matrix/preference-service";
import {
  DEFAULT_DECISION_PRIORITIES,
  parsePriorities,
  prioritiesFromPassport,
  type DecisionPriorities,
} from "../matrix/priorities";

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function revalidateProperty(slug?: string) {
  if (slug) revalidatePath(`/nemovitosti/${slug}`);
  revalidatePath("/porovnani");
}

// ─── Notes (owner-only) ──────────────────────────────────────────────────────

export async function getMyPropertyNoteAction(input: {
  propertyIdOrSlug: string;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "unauthorized" as const };
  const note = await getNoteForUser({
    userId,
    propertyIdOrSlug: input.propertyIdOrSlug,
  });
  return { ok: true as const, note };
}

export async function saveMyPropertyNoteAction(input: {
  propertyIdOrSlug: string;
  content: string;
  tags?: string[];
  slug?: string;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "unauthorized" as const };

  const limited = await assertWorkspaceMutationAllowed(userId, "note", "save");
  if (!limited.ok) return { ok: false as const, error: limited.error };

  const parsed = z
    .object({
      propertyIdOrSlug: z.string().min(1).max(160),
      content: z.string().max(8000),
      tags: z.array(z.string()).max(12).optional(),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Neplatná poznámka." };
  }

  const result = await upsertNoteForUser({
    userId,
    propertyIdOrSlug: parsed.data.propertyIdOrSlug,
    content: parsed.data.content,
    tags: sanitizeNoteTags(parsed.data.tags),
  });
  if (!result.ok) return { ok: false as const, error: result.error };
  revalidateProperty(input.slug);

  const { track } = await import("@/lib/analytics/events");
  const { noteLengthBucket } = await import("@/lib/analytics/decision-metrics");
  track({
    name: "decision_note_saved",
    props: { length_bucket: noteLengthBucket(parsed.data.content.length) },
  });

  return { ok: true as const, note: result.note };
}

export async function deleteMyPropertyNoteAction(input: {
  propertyIdOrSlug: string;
  slug?: string;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "unauthorized" as const };

  const limited = await assertWorkspaceMutationAllowed(userId, "note", "delete");
  if (!limited.ok) return { ok: false as const, error: limited.error };

  const result = await deleteNoteForUser({
    userId,
    propertyIdOrSlug: input.propertyIdOrSlug,
  });
  if (!result.ok) return { ok: false as const, error: result.error };
  revalidateProperty(input.slug);
  return { ok: true as const };
}

export async function listMyNotesPreviewAction(input: {
  propertyIds: string[];
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, notes: {} as Record<string, { preview: string; tags: string[] }> };
  const map = await listNotesForProperties({
    userId,
    propertyIds: input.propertyIds.slice(0, 8),
  });
  const notes: Record<string, { preview: string; tags: string[] }> = {};
  for (const [id, note] of map) {
    notes[id] = {
      preview: note.content.trim().slice(0, 120),
      tags: note.tags,
    };
  }
  return { ok: true as const, notes };
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function listMyDecisionTasksAction(input: {
  propertyIdOrSlug: string;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "unauthorized" as const, tasks: [] };
  const tasks = await listTasksForUser({
    userId,
    propertyIdOrSlug: input.propertyIdOrSlug,
  });
  return { ok: true as const, tasks };
}

export async function createMyDecisionTaskAction(input: {
  propertyIdOrSlug: string;
  title: string;
  type?: PropertyDecisionTaskType;
  slug?: string;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "unauthorized" as const };
  const result = await createTaskForUser({
    userId,
    propertyIdOrSlug: input.propertyIdOrSlug,
    title: input.title,
    type: input.type ?? "CUSTOM",
  });
  if (!result.ok) return { ok: false as const, error: result.error };
  revalidateProperty(input.slug);

  const { track } = await import("@/lib/analytics/events");
  track({
    name: "decision_task_created",
    props: { task_type: String(input.type ?? "CUSTOM") },
  });

  return { ok: true as const, task: result.task };
}

export async function toggleMyDecisionTaskAction(input: {
  taskId: string;
  done: boolean;
  slug?: string;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "unauthorized" as const };
  const result = await setTaskStatusForUser({
    userId,
    taskId: input.taskId,
    status: input.done
      ? PropertyDecisionTaskStatus.DONE
      : PropertyDecisionTaskStatus.PENDING,
  });
  if (!result.ok) return { ok: false as const, error: result.error };
  revalidateProperty(input.slug);
  return { ok: true as const, task: result.task };
}

export async function deleteMyDecisionTaskAction(input: {
  taskId: string;
  slug?: string;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "unauthorized" as const };
  const result = await deleteTaskForUser({
    userId,
    taskId: input.taskId,
  });
  if (!result.ok) return { ok: false as const, error: result.error };
  revalidateProperty(input.slug);
  return { ok: true as const };
}

export async function seedSuggestedTasksAction(input: {
  propertyIdOrSlug: string;
  context: {
    propertyType: string | null;
    condition: string | null;
    risk: string | null;
    tags: string[];
    hasRenovationEstimate: boolean;
  };
  slug?: string;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "unauthorized" as const };
  const result = await seedSuggestedTasksForUser({
    userId,
    propertyIdOrSlug: input.propertyIdOrSlug,
    context: input.context,
  });
  if (!result.ok) return { ok: false as const, error: result.error };
  revalidateProperty(input.slug);
  return {
    ok: true as const,
    created: result.created,
    suggestions: suggestDecisionTasks(input.context),
  };
}

export async function previewSuggestedTasksAction(input: {
  propertyType: string | null;
  condition: string | null;
  risk: string | null;
  tags: string[];
  hasRenovationEstimate: boolean;
}) {
  return { suggestions: suggestDecisionTasks(input) };
}

// ─── Decision matrix ─────────────────────────────────────────────────────────

export async function getMyDecisionPrioritiesAction(): Promise<{
  ok: boolean;
  priorities: DecisionPriorities;
  fromPassport: boolean;
}> {
  const userId = await requireUserId();
  if (!userId) {
    return {
      ok: false,
      priorities: DEFAULT_DECISION_PRIORITIES,
      fromPassport: false,
    };
  }
  const passport = await loadFinancialPassport();
  const passportState = passport.ok ? passport.state : null;
  const row = await getDecisionPrioritiesForUser(userId, passportState);
  // Detect if still default-from-passport (no saved row handled inside service)
  return { ok: true, priorities: row, fromPassport: Boolean(passportState) };
}

export async function saveMyDecisionPrioritiesAction(input: {
  priorities: DecisionPriorities;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "unauthorized" as const };
  const priorities = await saveDecisionPrioritiesForUser({
    userId,
    priorities: parsePriorities(input.priorities),
  });
  revalidatePath("/porovnani");
  return { ok: true as const, priorities };
}

export async function prefillPrioritiesFromPassportAction() {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "unauthorized" as const };
  const passport = await loadFinancialPassport();
  const priorities = prioritiesFromPassport(
    passport.ok ? passport.state : null,
  );
  await saveDecisionPrioritiesForUser({ userId, priorities });
  return { ok: true as const, priorities };
}

export async function saveComparisonManualOrderAction(input: {
  comparisonId: string;
  manualOrder: string[];
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "unauthorized" as const };
  const result = await setComparisonManualOrder({
    userId,
    comparisonId: input.comparisonId,
    manualOrder: input.manualOrder,
  });
  if (!result.ok) return { ok: false as const, error: result.error };
  revalidatePath(`/porovnani/${input.comparisonId}`);
  return { ok: true as const };
}
