"use server";

import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  startBrokerOnboarding,
  updateBrokerProfile,
  completeBrokerOnboarding,
} from "@/domains/organizations/broker-onboarding";
import type { OrganizationType } from "@prisma/client";

async function requireActor() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    role: (session.user.role ?? "USER") as
      | "USER"
      | "PAID_CLIENT"
      | "ADMIN"
      | "SUPER_ADMIN"
      | "SALES"
      | "ANALYST"
      | "EDITOR"
      | "PARTNER",
  };
}

export async function startBrokerOnboardingAction(input: {
  organizationName: string;
  organizationType: OrganizationType;
  displayName: string;
  billingEmail?: string;
  ico?: string;
}) {
  const actor = await requireActor();
  if (!actor) return { ok: false as const, error: "Přihlášení je povinné." };

  const parsed = z
    .object({
      organizationName: z.string().min(2).max(200),
      organizationType: z.enum([
        "REAL_ESTATE_AGENT",
        "AGENCY",
        "DEVELOPER",
        "PARTNER",
      ]),
      displayName: z.string().min(2).max(120),
      billingEmail: z.string().email().optional(),
      ico: z.string().max(20).optional(),
    })
    .strict()
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "Neplatné údaje onboarding." };
  }

  return startBrokerOnboarding({ actor, ...parsed.data });
}

export async function updateBrokerProfileAction(input: {
  organizationId: string;
  displayName?: string;
  phonePublic?: string | null;
  bio?: string | null;
}) {
  const actor = await requireActor();
  if (!actor) return { ok: false as const, error: "Přihlášení je povinné." };

  const parsed = z
    .object({
      organizationId: z.string().min(1).max(64),
      displayName: z.string().min(2).max(120).optional(),
      phonePublic: z.string().max(40).nullable().optional(),
      bio: z.string().max(2000).nullable().optional(),
    })
    .strict()
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: "Neplatné údaje profilu." };
  }

  return updateBrokerProfile({ actor, ...parsed.data });
}

export async function completeBrokerOnboardingAction(input: {
  organizationId: string;
}) {
  const actor = await requireActor();
  if (!actor) return { ok: false as const, error: "Přihlášení je povinné." };

  const parsed = z
    .object({ organizationId: z.string().min(1).max(64) })
    .strict()
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Neplatné organizationId." };
  }

  return completeBrokerOnboarding({
    actor,
    organizationId: parsed.data.organizationId,
  });
}
