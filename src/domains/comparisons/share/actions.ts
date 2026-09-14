"use server";

import { z } from "zod";

import { auth } from "@/lib/auth";
import { assertWorkspaceMutationAllowed } from "@/lib/security/workspace-rate-limit";
import {
  createComparisonShare,
  listComparisonShares,
  revokeComparisonShare,
  resolveInvitedShare,
} from "./share-service";
import { DEFAULT_SHARE_INCLUDE } from "./share-safe";

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

const includeSchema = z.object({
  basics: z.boolean().optional(),
  valuation: z.boolean().optional(),
  investment: z.boolean().optional(),
  renovation: z.boolean().optional(),
  risks: z.boolean().optional(),
  scores: z.boolean().optional(),
});

export async function createComparisonShareAction(input: {
  comparisonId: string;
  mode: "INVITED_USERS" | "SECRET_LINK";
  includeFlags?: z.infer<typeof includeSchema>;
  inviteUserIds?: string[];
  expiresInDays?: number;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };

  const limited = await assertWorkspaceMutationAllowed(userId, "share", "create");
  if (!limited.ok) return { ok: false as const, error: limited.error };

  const parsed = z
    .object({
      comparisonId: z.string().min(1),
      mode: z.enum(["INVITED_USERS", "SECRET_LINK"]),
      includeFlags: includeSchema.optional(),
      inviteUserIds: z.array(z.string().min(1)).max(20).optional(),
      expiresInDays: z.number().int().min(1).max(90).optional(),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "Neplatné parametry sdílení." };
  }

  return createComparisonShare({
    userId,
    comparisonId: parsed.data.comparisonId,
    mode: parsed.data.mode,
    includeFlags: { ...DEFAULT_SHARE_INCLUDE, ...parsed.data.includeFlags },
    inviteUserIds: parsed.data.inviteUserIds,
    expiresInDays: parsed.data.expiresInDays,
  });
}

export async function revokeComparisonShareAction(input: { shareId: string }) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };
  const limited = await assertWorkspaceMutationAllowed(userId, "share", "revoke");
  if (!limited.ok) return { ok: false as const, error: limited.error };
  return revokeComparisonShare({ userId, shareId: input.shareId });
}

export async function listComparisonSharesAction(input: {
  comparisonId: string;
}) {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false as const, error: "Přihlášení je povinné.", shares: [] };
  }
  const shares = await listComparisonShares({
    userId,
    comparisonId: input.comparisonId,
  });
  return { ok: true as const, shares };
}

export async function getInvitedComparisonShareAction(input: {
  shareId: string;
}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false as const, error: "Přihlášení je povinné." };
  return resolveInvitedShare({ shareId: input.shareId, userId });
}
