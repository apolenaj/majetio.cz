"use server";

import { revalidatePath } from "next/cache";

import {
  requirePermission,
  roleHasPermission,
  SENSITIVE_CONFIRM_TOKEN,
  SENSITIVE_REASON_MIN_LENGTH,
} from "@/domains/administration";
import {
  listAdminUsers,
  suspendUser,
  type AdminUserListItem,
} from "@/domains/users/admin/user-ops";
import {
  buildAdminCsv,
  previewAdminCsv,
} from "@/lib/admin/csv-export";
import { AuthError } from "@/lib/auth/guards";

function fail(error: string) {
  return { ok: false as const, error };
}

export async function adminBulkSuspendUsersAction(input: {
  ids: string[];
  reason: string;
  confirmToken: string;
  dryRun: boolean;
}): Promise<
  | { ok: true; message: string; affected: number }
  | { ok: false; error: string }
> {
  let actor;
  try {
    actor = await requirePermission("users.suspend");
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message);
    throw err;
  }

  if (input.confirmToken !== SENSITIVE_CONFIRM_TOKEN) {
    return fail(`Potvrďte tokenem ${SENSITIVE_CONFIRM_TOKEN}.`);
  }
  if (input.reason.trim().length < SENSITIVE_REASON_MIN_LENGTH) {
    return fail(`Důvod min. ${SENSITIVE_REASON_MIN_LENGTH} znaků.`);
  }
  if (!input.ids.length) return fail("Vyberte alespoň jednoho uživatele.");
  if (input.ids.length > 50) return fail("Max. 50 uživatelů najednou.");

  const unique = [...new Set(input.ids)].filter((id) => id !== actor.id);
  if (unique.length === 0) {
    return fail("Nelze suspendovat sebe / prázdný výběr.");
  }

  if (input.dryRun) {
    return {
      ok: true,
      affected: unique.length,
      message: `Dry-run: suspendovalo by se ${unique.length} uživatelů. Žádné změny nebyly provedeny.`,
    };
  }

  let affected = 0;
  const errors: string[] = [];
  for (const id of unique) {
    const result = await suspendUser({
      userId: id,
      reason: input.reason,
      actorUserId: actor.id,
    });
    if (result.ok) affected += 1;
    else errors.push(`${id}: ${result.error}`);
  }

  revalidatePath("/admin/uzivatele");

  if (affected === 0) {
    return fail(errors[0] ?? "Suspend selhal.");
  }

  return {
    ok: true,
    affected,
    message: `Suspendováno ${affected}/${unique.length}.${
      errors.length ? ` Chyby: ${errors.slice(0, 3).join("; ")}` : ""
    }`,
  };
}

export async function adminExportUsersCsvAction(input: {
  ids?: string[];
  q?: string;
  status?: string;
  dryRun: boolean;
}): Promise<
  | {
      ok: true;
      dryRun: true;
      preview: {
        rowCount: number;
        headers: string[];
        sampleRows: string[][];
        warnings: string[];
      };
    }
  | { ok: true; dryRun: false; filename: string; csv: string }
  | { ok: false; error: string }
> {
  let actor;
  try {
    actor = await requirePermission("users.read");
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message);
    throw err;
  }

  if (!roleHasPermission(actor.role, "users.read")) {
    return fail("Chybí oprávnění users.read.");
  }

  let items: AdminUserListItem[] = [];

  if (input.ids?.length) {
    const { prisma } = await import("@/lib/db");
    const rows = await prisma.user.findMany({
      where: { id: { in: input.ids.slice(0, 100) } },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        accountStatus: true,
      },
    });
    items = rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      accountStatus:
        (r as { accountStatus?: string }).accountStatus ?? "ACTIVE",
      createdAt: r.createdAt,
    }));
  } else {
    const listed = await listAdminUsers({
      q: input.q,
      status: input.status,
      take: 100,
      skip: 0,
    });
    if (listed.error) return fail(listed.error);
    items = listed.items;
  }

  const headers = ["id", "email", "name", "role", "accountStatus", "createdAt"];
  const rows = items.map((u) => [
    u.id,
    u.email ?? "",
    u.name ?? "",
    u.role,
    u.accountStatus,
    u.createdAt.toISOString(),
  ]);

  if (input.dryRun) {
    return {
      ok: true,
      dryRun: true,
      preview: previewAdminCsv({ headers, rows }),
    };
  }

  return {
    ok: true,
    dryRun: false,
    filename: `majetio-users-${new Date().toISOString().slice(0, 10)}.csv`,
    csv: buildAdminCsv({ headers, rows }),
  };
}
