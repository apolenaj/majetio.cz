/**
 * OrganizationService — B2B tenants, members, plan upgrades/downgrades.
 * Downgrade never deletes listings; excess → ListingQuotaState.OVER_LIMIT.
 */

import type {
  ListingVerificationStatus,
  OrganizationMemberRole,
  OrganizationType,
  Prisma,
  Role,
} from "@prisma/client";

import {
  QUOTA_CONSUMING_PROPERTY_STATUSES,
  defaultPlanKeyForOrgType,
  isB2bPlanKey,
  listingOwnerKindForOrgType,
  type B2bPlanKey,
} from "@/config/organizations-b2b";
import { isEffectiveNewListingEnabled } from "@/domains/markets/capabilities/effective";
import { prisma } from "@/lib/db";
import {
  normalizeMarketCoverage,
  organizationCoversMarket,
  serviceTypeForOrganizationType,
} from "./market-coverage";
import {
  comparePlanTier,
  reconcileListingQuota,
  resolveB2bPlanLimits,
} from "./quota";

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function uniqueOrgSlug(base: string): Promise<string> {
  const root = slugify(base) || "organizace";
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const exists = await prisma.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function createOrganization(input: {
  name: string;
  type: OrganizationType;
  ownerUserId: string;
  planKey?: B2bPlanKey;
  billingEmail?: string;
  ico?: string;
  /** Primary market — never inferred from currency. */
  marketCode?: string;
  marketCoverage?: string[];
  serviceType?: string;
}): Promise<{ ok: true; organizationId: string } | { ok: false; error: string }> {
  const planKey = input.planKey ?? defaultPlanKeyForOrgType(input.type);
  const plan = await prisma.pricingPlan.findFirst({
    where: { key: planKey, status: "ACTIVE" },
    orderBy: { activeFrom: "desc" },
  });
  const limits = resolveB2bPlanLimits(planKey, plan?.limits);
  const slug = await uniqueOrgSlug(input.name);
  const marketCode = (input.marketCode ?? "CZ").toUpperCase();
  const marketCoverage = normalizeMarketCoverage(
    input.marketCoverage,
    marketCode,
  );
  const serviceType =
    input.serviceType ?? serviceTypeForOrganizationType(input.type);

  const org = await prisma.organization.create({
    data: {
      name: input.name.trim(),
      slug,
      type: input.type,
      planKey,
      planStatus: "ACTIVE",
      pricingPlanId: plan?.id ?? null,
      listingsLimit: limits.maxActiveListings,
      seatsLimit: limits.seats,
      billingEmail: input.billingEmail ?? null,
      ico: input.ico ?? null,
      marketCode,
      countryCode: marketCode,
      marketCoverage,
      serviceType,
      members: {
        create: {
          userId: input.ownerUserId,
          role: "OWNER",
          active: true,
          joinedAt: new Date(),
        },
      },
      planChanges: {
        create: {
          changeType: "INITIAL",
          toPlanKey: planKey,
          toListingsLimit: limits.maxActiveListings,
          actorUserId: input.ownerUserId,
        },
      },
    },
    select: { id: true },
  });

  const { track } = await import("@/lib/analytics/events");
  track({
    name: "organization_created",
    props: {
      org_type: input.type,
      market_code: marketCode,
    },
  });

  return { ok: true, organizationId: org.id };
}

export async function addOrganizationMember(input: {
  organizationId: string;
  userId: string;
  role: OrganizationMemberRole;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await prisma.organizationMember.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: input.actorUserId,
      active: true,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });
  if (!actor) {
    return { ok: false, error: "Nemáte oprávnění přidávat členy." };
  }

  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: { seatsLimit: true, _count: { select: { members: { where: { active: true } } } } },
  });
  if (!org) return { ok: false, error: "Organizace nenalezena." };
  if (org._count.members >= org.seatsLimit) {
    return { ok: false, error: "Dosažen limit seatů pro aktuální tarif." };
  }

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: input.userId,
      },
    },
    create: {
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role,
      active: true,
      joinedAt: new Date(),
    },
    update: {
      role: input.role,
      active: true,
      joinedAt: new Date(),
    },
  });

  return { ok: true };
}

export async function setOrganizationVerification(input: {
  organizationId: string;
  status: ListingVerificationStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date();
  const data: Prisma.OrganizationUpdateInput = {
    verificationStatus: input.status,
  };
  if (input.status === "IDENTITY_VERIFIED") {
    data.identityVerifiedAt = now;
  }
  if (input.status === "ORGANIZATION_VERIFIED") {
    data.identityVerifiedAt = now;
    data.organizationVerifiedAt = now;
  }
  if (input.status === "UNVERIFIED") {
    data.identityVerifiedAt = null;
    data.organizationVerifiedAt = null;
  }

  try {
    await prisma.organization.update({
      where: { id: input.organizationId },
      data,
    });
    // Propagate org-level verification onto org listings (badge ladder).
    if (input.status !== "UNVERIFIED") {
      await prisma.property.updateMany({
        where: { organizationId: input.organizationId },
        data: { listingVerificationStatus: input.status },
      });
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Organizace nenalezena." };
  }
}

export async function attachPropertyToOrganization(input: {
  propertyId: string;
  organizationId: string;
  listedByUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const member = await prisma.organizationMember.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: input.listedByUserId,
      active: true,
    },
  });
  if (!member) {
    return { ok: false, error: "Uživatel není aktivním členem organizace." };
  }

  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
  });
  if (!org) return { ok: false, error: "Organizace nenalezena." };

  await prisma.property.update({
    where: { id: input.propertyId },
    data: {
      organizationId: org.id,
      listedByUserId: input.listedByUserId,
      listingOwnerKind: listingOwnerKindForOrgType(org.type),
      listingVerificationStatus: org.verificationStatus,
    },
  });

  return { ok: true };
}

export async function assertCanPublishListing(input: {
  organizationId: string;
  /** Target listing market — checked against org.marketCoverage + kill switch. */
  marketCode?: string;
}): Promise<
  | { allowed: true; withinLimit: number; limit: number }
  | {
      allowed: false;
      code:
        | "quota_exceeded"
        | "plan_inactive"
        | "market_coverage"
        | "kill_switch";
      reason: string;
      limit: number;
      withinLimit: number;
    }
> {
  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
  });
  if (!org) {
    return {
      allowed: false,
      code: "plan_inactive",
      reason: "Organizace nenalezena.",
      limit: 0,
      withinLimit: 0,
    };
  }
  if (org.planStatus === "CANCELLED" || org.planStatus === "EXPIRED") {
    return {
      allowed: false,
      code: "plan_inactive",
      reason: "Tarif organizace není aktivní.",
      limit: org.listingsLimit,
      withinLimit: 0,
    };
  }

  const marketCode = (input.marketCode ?? org.marketCode ?? "CZ").toUpperCase();

  if (
    !organizationCoversMarket({
      marketCoverage: org.marketCoverage,
      marketCode,
      primaryMarketCode: org.marketCode,
    })
  ) {
    return {
      allowed: false,
      code: "market_coverage",
      reason: `Organizace nepokrývá trh ${marketCode}.`,
      limit: org.listingsLimit,
      withinLimit: 0,
    };
  }

  if (!isEffectiveNewListingEnabled(marketCode)) {
    return {
      allowed: false,
      code: "kill_switch",
      reason: `Nové nabídky na trhu ${marketCode} jsou dočasně pozastaveny.`,
      limit: org.listingsLimit,
      withinLimit: 0,
    };
  }

  const withinLimit = await prisma.property.count({
    where: {
      organizationId: org.id,
      listingQuotaState: "WITHIN_LIMIT",
      status: { in: [...QUOTA_CONSUMING_PROPERTY_STATUSES] },
    },
  });

  if (withinLimit >= org.listingsLimit) {
    return {
      allowed: false,
      code: "quota_exceeded",
      reason: `Limit ${org.listingsLimit} aktivních nabídek je naplněn.`,
      limit: org.listingsLimit,
      withinLimit,
    };
  }

  return { allowed: true, withinLimit, limit: org.listingsLimit };
}

/**
 * Apply B2B plan change from PricingPlan.
 * Downgrade: mark excess OVER_LIMIT (never delete). Upgrade: restore capacity.
 */
export async function changeOrganizationPlan(input: {
  organizationId: string;
  toPlanKey: string;
  actorUserId?: string;
  /** Platform role when enforcing billing IDOR (174). */
  actorRole?: Role;
  now?: Date;
}): Promise<
  | {
      ok: true;
      changeType: "UPGRADE" | "DOWNGRADE" | "SAME";
      listingsMarkedOverLimit: number;
      listingsRestoredWithinLimit: number;
      planChangeId: string;
    }
  | { ok: false; error: string }
> {
  // Tenant + billing boundary (174/175) when actor is known
  if (input.actorUserId) {
    const { assertOrganizationAccess } = await import("./tenant");
    const access = await assertOrganizationAccess({
      actor: {
        userId: input.actorUserId,
        role: input.actorRole ?? "USER",
      },
      organizationId: input.organizationId,
      requireBilling: true,
    });
    if (!access.ok) {
      return { ok: false, error: access.error };
    }
  }

  const now = input.now ?? new Date();
  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
  });
  if (!org) return { ok: false, error: "Organizace nenalezena." };

  if (!isB2bPlanKey(input.toPlanKey) && input.toPlanKey !== org.planKey) {
    // Allow unknown keys if PricingPlan exists
  }

  const plan = await prisma.pricingPlan.findFirst({
    where: { key: input.toPlanKey, status: "ACTIVE" },
    orderBy: { activeFrom: "desc" },
  });
  if (!plan) {
    return { ok: false, error: `PricingPlan ${input.toPlanKey} nenalezen.` };
  }

  const toLimits = resolveB2bPlanLimits(input.toPlanKey, plan.limits);
  const changeType = comparePlanTier(org.planKey, input.toPlanKey);
  if (changeType === "SAME" && org.listingsLimit === toLimits.maxActiveListings) {
    return {
      ok: true,
      changeType: "SAME",
      listingsMarkedOverLimit: 0,
      listingsRestoredWithinLimit: 0,
      planChangeId: "",
    };
  }

  const listings = await prisma.property.findMany({
    where: {
      organizationId: org.id,
      status: { in: [...QUOTA_CONSUMING_PROPERTY_STATUSES] },
    },
    select: {
      id: true,
      publishedAt: true,
      createdAt: true,
      listingQuotaState: true,
    },
  });

  const reconcile = reconcileListingQuota({
    listings: listings.map((l) => ({
      id: l.id,
      rankAt: l.publishedAt ?? l.createdAt,
      listingQuotaState: l.listingQuotaState,
    })),
    listingsLimit: toLimits.maxActiveListings,
    reason:
      changeType === "DOWNGRADE"
        ? `Downgrade na ${input.toPlanKey}: limit ${toLimits.maxActiveListings} nabídek.`
        : undefined,
  });

  const planChangeType =
    changeType === "UPGRADE"
      ? "UPGRADE"
      : changeType === "DOWNGRADE"
        ? "DOWNGRADE"
        : "RENEWAL";

  const result = await prisma.$transaction(async (tx) => {
    if (reconcile.markOverLimitIds.length > 0) {
      await tx.property.updateMany({
        where: { id: { in: reconcile.markOverLimitIds } },
        data: {
          listingQuotaState: "OVER_LIMIT",
          overLimitAt: now,
          overLimitReason: reconcile.overLimitReason,
        },
      });
    }
    if (reconcile.restoreWithinLimitIds.length > 0) {
      await tx.property.updateMany({
        where: { id: { in: reconcile.restoreWithinLimitIds } },
        data: {
          listingQuotaState: "WITHIN_LIMIT",
          overLimitAt: null,
          overLimitReason: null,
        },
      });
    }
    // Ensure keep set is WITHIN_LIMIT (idempotent)
    if (reconcile.keepWithinLimitIds.length > 0) {
      await tx.property.updateMany({
        where: {
          id: { in: reconcile.keepWithinLimitIds },
          listingQuotaState: "OVER_LIMIT",
        },
        data: {
          listingQuotaState: "WITHIN_LIMIT",
          overLimitAt: null,
          overLimitReason: null,
        },
      });
    }

    await tx.organization.update({
      where: { id: org.id },
      data: {
        planKey: input.toPlanKey,
        pricingPlanId: plan.id,
        listingsLimit: toLimits.maxActiveListings,
        seatsLimit: toLimits.seats,
        planStatus: "ACTIVE",
        planPeriodStart: now,
      },
    });

    const change = await tx.organizationPlanChange.create({
      data: {
        organizationId: org.id,
        changeType: planChangeType,
        fromPlanKey: org.planKey,
        toPlanKey: input.toPlanKey,
        fromListingsLimit: org.listingsLimit,
        toListingsLimit: toLimits.maxActiveListings,
        activeListingsAtChange: listings.length,
        listingsMarkedOverLimit: reconcile.markOverLimitIds.length,
        listingsRestoredWithinLimit: reconcile.restoreWithinLimitIds.length,
        actorUserId: input.actorUserId ?? null,
        actionRequired:
          reconcile.markOverLimitIds.length > 0
            ? reconcile.actionRequired
            : undefined,
      },
    });

    return change;
  });

  return {
    ok: true,
    changeType: changeType === "SAME" ? "SAME" : changeType,
    listingsMarkedOverLimit: reconcile.markOverLimitIds.length,
    listingsRestoredWithinLimit: reconcile.restoreWithinLimitIds.length,
    planChangeId: result.id,
  };
}

export async function countOverLimitListings(
  organizationId: string,
): Promise<number> {
  return prisma.property.count({
    where: {
      organizationId,
      listingQuotaState: "OVER_LIMIT",
      status: { in: [...QUOTA_CONSUMING_PROPERTY_STATUSES] },
    },
  });
}
