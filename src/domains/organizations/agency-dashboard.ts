/**
 * Agency dashboard aggregates (135) — tenant-scoped, no anonymous PII.
 */

import { prisma } from "@/lib/db";
import {
  assertOrganizationAccess,
  type OrgAccessActor,
} from "@/domains/organizations/tenant";
import { getOrganizationListingAnalytics } from "@/domains/listing-analytics";
import { listQualifiedBuyerInbox } from "@/domains/crm/qualified-buyer-inbox";
import { countOverLimitListings } from "@/domains/organizations/service";
import { resolveVerificationBadge } from "@/domains/organizations/broker-onboarding";

export async function getAgencyDashboard(input: {
  actor: OrgAccessActor;
  organizationId: string;
}) {
  const access = await assertOrganizationAccess({
    actor: input.actor,
    organizationId: input.organizationId,
  });
  if (!access.ok) return { ok: false as const, error: access.error };

  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      planKey: true,
      listingsLimit: true,
      seatsLimit: true,
      verificationStatus: true,
      leadBillingMode: true,
    },
  });
  if (!org) return { ok: false as const, error: "Organizace nenalezena." };

  const [analytics, inbox, overLimit, listingCount, pipelineOpen] =
    await Promise.all([
      getOrganizationListingAnalytics({
        actor: input.actor,
        organizationId: input.organizationId,
      }),
      listQualifiedBuyerInbox({
        actor: input.actor,
        organizationId: input.organizationId,
        take: 10,
      }),
      countOverLimitListings(input.organizationId),
      prisma.property.count({
        where: {
          organizationId: input.organizationId,
          status: { in: ["ACTIVE", "RESERVED"] },
        },
      }),
      prisma.lead.count({
        where: {
          organizationId: input.organizationId,
          status: { notIn: ["WON", "LOST", "HANDED_OFF"] },
        },
      }),
    ]);

  return {
    ok: true as const,
    organization: org,
    verificationBadge: resolveVerificationBadge(org.verificationStatus),
    access,
    listingCount,
    overLimitCount: overLimit,
    openPipelineLeads: pipelineOpen,
    analytics: analytics.ok
      ? {
          totals: analytics.totals,
          rows: analytics.rows.slice(0, 8),
          containsPii: false as const,
        }
      : { totals: { impressions: 0, saves: 0, inquiries: 0 }, rows: [], containsPii: false as const },
    qualifiedInbox: inbox.ok
      ? {
          items: inbox.items,
          publicRankingEnabled: false as const,
          slaBreachCount: inbox.items.filter((i) => i.slaBreached).length,
        }
      : {
          items: [],
          publicRankingEnabled: false as const,
          slaBreachCount: 0,
        },
  };
}
