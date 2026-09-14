"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import {
  applyKillSwitch,
  getMarketKillSwitch,
  type KillSwitchTarget,
} from "@/domains/markets/capabilities/kill-switch";

const TARGETS = [
  "new_listings",
  "valuations",
  "lead_routing",
  "payments",
  "review_required",
] as const satisfies readonly KillSwitchTarget[];

async function requireAdminId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!session.user.role || !isAdmin(session.user.role)) return null;
  return session.user.id;
}

/**
 * Admin kill switch — pause listings / valuations / lead routing per market,
 * or set emergency review_required (Rules 209–217, 220).
 */
export async function adminApplyKillSwitchAction(input: {
  marketCode: string;
  target: KillSwitchTarget;
  enabled: boolean;
  reason?: string | null;
}) {
  const actorId = await requireAdminId();
  if (!actorId) {
    return { ok: false as const, error: "Vyžadována role ADMIN." };
  }

  const parsed = z
    .object({
      marketCode: z
        .string()
        .min(2)
        .max(8)
        .transform((s) => s.toUpperCase()),
      target: z.enum(TARGETS),
      enabled: z.boolean(),
      reason: z.string().max(500).nullable().optional(),
    })
    .strict()
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "Neplatné parametry kill switch." };
  }

  const state = applyKillSwitch({
    marketCode: parsed.data.marketCode,
    target: parsed.data.target,
    enabled: parsed.data.enabled,
    updatedBy: actorId,
    reason: parsed.data.reason ?? null,
  });

  // Best-effort durable mirror (hot path still uses process store).
  try {
    await prisma.market.update({
      where: { marketCode: state.marketCode },
      data: {
        killSwitch: {
          pauseNewListings: state.pauseNewListings,
          pauseValuations: state.pauseValuations,
          pauseLeadRouting: state.pauseLeadRouting,
          pausePayments: state.pausePayments,
          reviewRequired: state.reviewRequired,
          updatedAt: state.updatedAt,
          updatedBy: state.updatedBy,
          reason: state.reason,
        },
      },
    });
  } catch {
    // Market row may not exist yet for planned plugins — in-memory switch still applies.
  }

  revalidatePath("/admin/trhy");
  return { ok: true as const, killSwitch: getMarketKillSwitch(state.marketCode) };
}
