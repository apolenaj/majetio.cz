"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { roleHasPermission } from "@/domains/administration";
import { transitionDataQualityIssue } from "@/domains/data-quality/admin/issues";
import type { DqWorkflowStatus } from "@/domains/data-quality/admin/taxonomy";
import { retryFailedImportJob } from "@/domains/property-sources/admin/import-ops";
import {
  enforceExpiredLicense,
  upsertProviderGovernance,
} from "@/domains/property-sources/admin/source-ops";
import type { SourceHealthStatus } from "@/domains/property-sources/admin/health";

async function requireActor(): Promise<
  | { ok: true; userId: string; role: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return { ok: false, error: "Přihlášení je povinné." };
  }
  return { ok: true, userId: session.user.id, role: session.user.role };
}

export async function adminTransitionDqIssueAction(input: {
  issueId: string;
  nextStatus: DqWorkflowStatus;
  reason: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "dataQuality.resolve")) {
    return { ok: false as const, error: "Chybí oprávnění dataQuality.resolve." };
  }

  const result = await transitionDataQualityIssue({
    issueId: input.issueId,
    nextStatus: input.nextStatus,
    reason: input.reason,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidatePath("/admin/data-quality");
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function adminRetryImportJobAction(input: { jobId: string }) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "import.retry")) {
    return { ok: false as const, error: "Chybí oprávnění import.retry." };
  }

  const result = await retryFailedImportJob({
    jobId: input.jobId,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidatePath("/admin/importy");
  revalidatePath(`/admin/importy/${input.jobId}`);
  revalidatePath("/admin");
  return result;
}

export async function adminUpdateProviderGovernanceAction(input: {
  provider: string;
  healthStatus: SourceHealthStatus;
  importEnabled: boolean;
  frontendVisible: boolean;
  licenseExpiresAt?: string | null;
  notes?: string;
  cascadeToSources?: boolean;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "import.retry")) {
    // DATA_ADMIN has import.retry; reuse as source governance write for v1
    return {
      ok: false as const,
      error: "Chybí oprávnění pro správu zdrojů (import.retry).",
    };
  }

  const expiresAt = input.licenseExpiresAt
    ? new Date(input.licenseExpiresAt)
    : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return { ok: false as const, error: "Neplatné datum licence." };
  }

  const result = await upsertProviderGovernance({
    provider: input.provider,
    healthStatus: input.healthStatus,
    importEnabled: input.importEnabled,
    frontendVisible: input.frontendVisible,
    licenseExpiresAt: expiresAt,
    notes: input.notes ?? null,
    actorUserId: actor.userId,
    cascadeToSources: input.cascadeToSources,
  });
  if (!result.ok) return result;
  revalidatePath("/admin/zdroje");
  revalidatePath("/admin/freshness");
  return { ok: true as const };
}

export async function adminEnforceExpiredLicenseAction(input: {
  provider: string;
}) {
  const actor = await requireActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };
  if (!roleHasPermission(actor.role, "import.retry")) {
    return { ok: false as const, error: "Chybí oprávnění." };
  }

  const result = await enforceExpiredLicense({
    provider: input.provider,
    actorUserId: actor.userId,
  });
  if (!result.ok) return result;
  revalidatePath("/admin/zdroje");
  revalidatePath("/admin/freshness");
  return result;
}
