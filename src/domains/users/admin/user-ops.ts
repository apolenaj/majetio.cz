/**
 * Admin user ops — privacy-first Financial Passport access + suspend + list.
 */

import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";

export const IMPERSONATION_COOKIE = "majetio_impersonate";

export type AdminUserListItem = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  accountStatus: string;
  createdAt: Date;
};

const USER_SORT_FIELDS = [
  "createdAt",
  "email",
  "name",
  "role",
  "accountStatus",
] as const;

export type AdminUserSortField = (typeof USER_SORT_FIELDS)[number];

function isUserSortField(v: string | null | undefined): v is AdminUserSortField {
  return (
    typeof v === "string" &&
    (USER_SORT_FIELDS as readonly string[]).includes(v)
  );
}

export async function listAdminUsers(input?: {
  q?: string;
  status?: string;
  take?: number;
  skip?: number;
  sort?: string | null;
  order?: "asc" | "desc";
}): Promise<{
  items: AdminUserListItem[];
  total: number;
  error: string | null;
}> {
  try {
    const take = Math.min(input?.take ?? 40, 100);
    const skip = Math.max(0, input?.skip ?? 0);
    const order = input?.order === "asc" ? "asc" : "desc";
    const sortField: AdminUserSortField = isUserSortField(input?.sort)
      ? input!.sort!
      : "createdAt";

    const where: Record<string, unknown> = {};
    if (input?.status) where.accountStatus = input.status;
    if (input?.q?.trim()) {
      const q = input.q.trim();
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { id: { equals: q } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.user.count({ where: where as never }),
      prisma.user.findMany({
        where: where as never,
        orderBy: { [sortField]: order } as never,
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          accountStatus: true,
        },
      }),
    ]);

    return {
      total,
      items: rows.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        role: r.role,
        accountStatus:
          (r as { accountStatus?: string }).accountStatus ?? "ACTIVE",
        createdAt: r.createdAt,
      })),
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      total: 0,
      error: err instanceof Error ? err.message : "User list failed",
    };
  }
}

export type MaskedFinancialPassport = {
  visible: false;
  masked: true;
  message: string;
};

export type RevealedFinancialPassport = {
  visible: true;
  masked: false;
  monthlyIncomeCzk: number | null;
  monthlyLiabilitiesCzk: number | null;
  availableEquityCzk: number | null;
  equityPercent: number | null;
  financingMode: string | null;
  employmentType: string | null;
  creditScoreBand: string | null;
};

export function maskFinancialPassport(): MaskedFinancialPassport {
  return {
    visible: false,
    masked: true,
    message:
      "Financial Passport je skrytý. Vyžaduje users.financial_passport.read + step-up a audit.",
  };
}

/**
 * Admin user detail. Financial Passport is masked unless
 * `includeFinancialPassport` is true — callers MUST have already
 * enforced `users.financial_passport.read`, step-up, and audit
 * (`admin.financial_passport.read`). Never set the flag from a page load.
 */
export async function loadAdminUserDetail(input: {
  userId: string;
  includeFinancialPassport: boolean;
}): Promise<{
  user: {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
    accountStatus: string;
    suspendedReason: string | null;
    suspendedAt: Date | null;
    deletionRequestedAt: Date | null;
    createdAt: Date;
  } | null;
  financialPassport: MaskedFinancialPassport | RevealedFinancialPassport;
  error: string | null;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      include: { financialProfile: true },
    });
    if (!user) {
      return {
        user: null,
        financialPassport: maskFinancialPassport(),
        error: null,
      };
    }

    const base = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      accountStatus:
        (user as { accountStatus?: string }).accountStatus ?? "ACTIVE",
      suspendedReason:
        (user as { suspendedReason?: string | null }).suspendedReason ?? null,
      suspendedAt: (user as { suspendedAt?: Date | null }).suspendedAt ?? null,
      deletionRequestedAt:
        (user as { deletionRequestedAt?: Date | null }).deletionRequestedAt ??
        null,
      createdAt: user.createdAt,
    };

    if (!input.includeFinancialPassport) {
      return {
        user: base,
        financialPassport: maskFinancialPassport(),
        error: null,
      };
    }

    const fp = user.financialProfile;
    return {
      user: base,
      financialPassport: {
        visible: true,
        masked: false,
        monthlyIncomeCzk: fp?.monthlyIncomeCzk ?? null,
        monthlyLiabilitiesCzk: fp?.monthlyLiabilitiesCzk ?? null,
        availableEquityCzk: fp?.availableEquityCzk ?? null,
        equityPercent: fp?.equityPercent ?? null,
        financingMode: fp?.financingMode ?? null,
        employmentType: fp?.employmentType ?? null,
        creditScoreBand: fp?.creditScoreBand ?? null,
      },
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      financialPassport: maskFinancialPassport(),
      error: err instanceof Error ? err.message : "User detail failed",
    };
  }
}

export async function suspendUser(input: {
  userId: string;
  reason: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.reason.trim().length < 8) {
    return { ok: false, error: "Suspend reason is required." };
  }
  if (input.userId === input.actorUserId) {
    return { ok: false, error: "Cannot suspend yourself." };
  }

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      accountStatus: "SUSPENDED" as never,
      suspendedAt: new Date(),
      suspendedReason: input.reason.trim(),
      suspendedByUserId: input.actorUserId,
    },
  });

  await writeAuditLog({
    action: "admin.user.suspend",
    entity: "User",
    entityId: input.userId,
    actorId: input.actorUserId,
    meta: { reason: input.reason.trim().slice(0, 300) },
  });

  return { ok: true };
}

export async function unsuspendUser(input: {
  userId: string;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await prisma.user.update({
    where: { id: input.userId },
    data: {
      accountStatus: "ACTIVE" as never,
      suspendedAt: null,
      suspendedReason: null,
      suspendedByUserId: null,
    },
  });
  await writeAuditLog({
    action: "admin.user.unsuspend",
    entity: "User",
    entityId: input.userId,
    actorId: input.actorUserId,
    meta: { reason: input.reason.trim().slice(0, 300) },
  });
  return { ok: true };
}

export async function markUserDeletionRequested(input: {
  userId: string;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await prisma.user.update({
    where: { id: input.userId },
    data: {
      accountStatus: "DELETION_REQUESTED" as never,
      deletionRequestedAt: new Date(),
    },
  });
  await writeAuditLog({
    action: "admin.user.deletion_requested",
    entity: "User",
    entityId: input.userId,
    actorId: input.actorUserId,
    meta: { reason: input.reason.trim().slice(0, 300) },
  });
  return { ok: true };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function startImpersonation(input: {
  targetUserId: string;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  if (input.reason.trim().length < 12) {
    return { ok: false, error: "Impersonation reason min. 12 characters." };
  }
  if (input.targetUserId === input.actorUserId) {
    return { ok: false, error: "Cannot impersonate yourself." };
  }

  const target = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: { id: true, role: true, accountStatus: true },
  });
  if (!target) return { ok: false, error: "Target user not found." };
  if (
    target.role === "SUPER_ADMIN" ||
    target.role === "ADMIN" ||
    target.role === "OPERATIONS_ADMIN"
  ) {
    return { ok: false, error: "Cannot impersonate admin-zone staff." };
  }

  const token = randomBytes(32).toString("hex");
  await prisma.adminImpersonationSession.create({
    data: {
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId,
      reason: input.reason.trim(),
      tokenHash: hashToken(token),
    },
  });

  await writeAuditLog({
    action: "admin.user.impersonate.start",
    entity: "User",
    entityId: input.targetUserId,
    actorId: input.actorUserId,
    meta: { reason: input.reason.trim().slice(0, 300) },
  });

  return { ok: true, token };
}

export async function endImpersonation(input: {
  actorUserId: string;
  token?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = input.token;
  if (!token) return { ok: false, error: "No impersonation session." };

  const session = await prisma.adminImpersonationSession.findFirst({
    where: {
      tokenHash: hashToken(token),
      actorUserId: input.actorUserId,
      endedAt: null,
    },
  });
  if (!session) return { ok: false, error: "Session not found." };

  await prisma.adminImpersonationSession.update({
    where: { id: session.id },
    data: { endedAt: new Date() },
  });

  await writeAuditLog({
    action: "admin.user.impersonate.end",
    entity: "User",
    entityId: session.targetUserId,
    actorId: input.actorUserId,
    meta: { sessionId: session.id },
  });

  return { ok: true };
}

export async function getActiveImpersonation(input: {
  actorUserId: string;
  token?: string | null;
}): Promise<{
  active: boolean;
  targetUserId?: string;
  targetEmail?: string | null;
  reason?: string;
}> {
  if (!input.token) return { active: false };
  const session = await prisma.adminImpersonationSession.findFirst({
    where: {
      tokenHash: hashToken(input.token),
      actorUserId: input.actorUserId,
      endedAt: null,
    },
  });
  if (!session) return { active: false };
  const target = await prisma.user.findUnique({
    where: { id: session.targetUserId },
    select: { email: true },
  });
  return {
    active: true,
    targetUserId: session.targetUserId,
    targetEmail: target?.email ?? null,
    reason: session.reason,
  };
}

/** Cookie helper for server actions / layout. */
export async function readImpersonationTokenFromCookies(): Promise<
  string | null
> {
  try {
    const jar = await cookies();
    return jar.get(IMPERSONATION_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export async function assertNotImpersonating(
  actorUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = await readImpersonationTokenFromCookies();
  const active = await getActiveImpersonation({ actorUserId, token });
  if (active.active) {
    return {
      ok: false,
      error:
        "Platební akce jsou během impersonace zakázané. Ukončete impersonaci.",
    };
  }
  return { ok: true };
}
