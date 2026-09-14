/**
 * Broker onboarding + profile (checklist 133, 134, 162, 163).
 * Verification badge ≠ marketing claim — only IDENTITY_VERIFIED / ORGANIZATION_VERIFIED.
 */

import type { ListingVerificationStatus, OrganizationType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { createOrganization } from "./service";
import { assertOrganizationAccess } from "./tenant";
import type { OrgAccessActor } from "./tenant";
import { sanitizeCrmPlainText } from "@/domains/crm/sanitize-notes";

export const VERIFICATION_BADGE_COPY_CS = {
  UNVERIFIED: null,
  IDENTITY_VERIFIED: {
    labelCs: "Ověřená identita",
    explanationCs:
      "Majetio ověřilo identitu makléře. Nejde o garanci kvality služby ani výsledku obchodu.",
  },
  ORGANIZATION_VERIFIED: {
    labelCs: "Ověřená organizace",
    explanationCs:
      "Majetio ověřilo organizaci (IČO / KYC). Nejde o doporučení ani garanci obchodu.",
  },
} as const;

/** Strict: badge only when identity/org verified — never for UNVERIFIED. */
export function resolveVerificationBadge(
  status: ListingVerificationStatus,
): { labelCs: string; explanationCs: string; status: ListingVerificationStatus } | null {
  if (status === "UNVERIFIED") return null;
  const copy = VERIFICATION_BADGE_COPY_CS[status];
  if (!copy) return null;
  return { ...copy, status };
}

export async function startBrokerOnboarding(input: {
  actor: OrgAccessActor;
  organizationName: string;
  organizationType: OrganizationType;
  displayName: string;
  billingEmail?: string;
  ico?: string;
}): Promise<
  | { ok: true; organizationId: string; membershipId: string }
  | { ok: false; error: string }
> {
  const displayName = sanitizeCrmPlainText(input.displayName, 120);
  if (displayName.length < 2) {
    return { ok: false, error: "Zadejte zobrazované jméno." };
  }

  const existing = await prisma.organizationMember.findFirst({
    where: { userId: input.actor.userId, active: true },
    select: { id: true, organizationId: true },
  });
  if (existing) {
    return {
      ok: true,
      organizationId: existing.organizationId,
      membershipId: existing.id,
    };
  }

  const created = await createOrganization({
    name: input.organizationName,
    type: input.organizationType,
    ownerUserId: input.actor.userId,
    billingEmail: input.billingEmail,
    ico: input.ico,
  });
  if (!created.ok) return created;

  const membership = await prisma.organizationMember.update({
    where: {
      organizationId_userId: {
        organizationId: created.organizationId,
        userId: input.actor.userId,
      },
    },
    data: {
      displayName,
      onboardingStep: "verification",
      joinedAt: new Date(),
    },
  });

  return {
    ok: true,
    organizationId: created.organizationId,
    membershipId: membership.id,
  };
}

export async function updateBrokerProfile(input: {
  actor: OrgAccessActor;
  organizationId: string;
  displayName?: string;
  phonePublic?: string | null;
  bio?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertOrganizationAccess({
    actor: input.actor,
    organizationId: input.organizationId,
  });
  if (!access.ok) return { ok: false, error: access.error };

  await prisma.organizationMember.update({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: input.actor.userId,
      },
    },
    data: {
      ...(input.displayName !== undefined
        ? { displayName: sanitizeCrmPlainText(input.displayName, 120) }
        : {}),
      ...(input.phonePublic !== undefined
        ? {
            phonePublic: input.phonePublic
              ? sanitizeCrmPlainText(input.phonePublic, 40)
              : null,
          }
        : {}),
      ...(input.bio !== undefined
        ? {
            bio: input.bio ? sanitizeCrmPlainText(input.bio, 2000) : null,
          }
        : {}),
    },
  });
  return { ok: true };
}

export async function completeBrokerOnboarding(input: {
  actor: OrgAccessActor;
  organizationId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await assertOrganizationAccess({
    actor: input.actor,
    organizationId: input.organizationId,
  });
  if (!access.ok) return { ok: false, error: access.error };

  await prisma.organizationMember.update({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: input.actor.userId,
      },
    },
    data: {
      onboardingStep: "done",
      onboardingCompletedAt: new Date(),
    },
  });
  return { ok: true };
}

export async function getBrokerProfile(input: {
  actor: OrgAccessActor;
  organizationId: string;
}) {
  const access = await assertOrganizationAccess({
    actor: input.actor,
    organizationId: input.organizationId,
  });
  if (!access.ok) return { ok: false as const, error: access.error };

  const [org, membership] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        verificationStatus: true,
        identityVerifiedAt: true,
        organizationVerifiedAt: true,
        planKey: true,
        listingsLimit: true,
        seatsLimit: true,
        ico: true,
      },
    }),
    prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: input.actor.userId,
        },
      },
    }),
  ]);

  if (!org || !membership) {
    return { ok: false as const, error: "Profil nenalezen." };
  }

  return {
    ok: true as const,
    organization: org,
    membership,
    verificationBadge: resolveVerificationBadge(org.verificationStatus),
    access,
  };
}

const PLATFORM_ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

/**
 * Admin-only verification set — never callable by broker self-service.
 */
export async function setOrganizationVerificationByAdmin(input: {
  actor: OrgAccessActor;
  organizationId: string;
  status: ListingVerificationStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (
    !(PLATFORM_ADMIN_ROLES as readonly string[]).includes(input.actor.role)
  ) {
    return { ok: false, error: "Ověření smí nastavit jen admin Majetio." };
  }
  const { setOrganizationVerification } = await import("./service");
  return setOrganizationVerification({
    organizationId: input.organizationId,
    status: input.status,
  });
}
