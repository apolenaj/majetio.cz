/**
 * Organization admin — KYC workflow distinct from listing verification.
 */

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";
import { setOrganizationVerification } from "@/domains/organizations/service";
import { assertSafeUploadMeta } from "@/lib/security/upload-mime";

export type OrgAdminListItem = {
  id: string;
  slug: string;
  name: string;
  type: string;
  planKey: string;
  planStatus: string;
  kycStatus: string;
  verificationStatus: string;
  ico: string | null;
  marketCode: string;
  listingsCount: number;
};

export async function listAdminOrganizations(input?: {
  kycStatus?: string;
  take?: number;
}): Promise<{ items: OrgAdminListItem[]; error: string | null }> {
  try {
    const where: Record<string, unknown> = {};
    if (input?.kycStatus) where.kycStatus = input.kycStatus;

    const rows = await prisma.organization.findMany({
      where: where as never,
      orderBy: { updatedAt: "desc" },
      take: Math.min(input?.take ?? 40, 100),
      include: { _count: { select: { properties: true } } },
    });

    return {
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        type: r.type,
        planKey: r.planKey,
        planStatus: r.planStatus,
        kycStatus: (r as { kycStatus?: string }).kycStatus ?? "PENDING",
        verificationStatus: r.verificationStatus,
        ico: r.ico,
        marketCode: r.marketCode,
        listingsCount: r._count.properties,
      })),
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Org list failed",
    };
  }
}

export async function getAdminOrganizationDetail(orgId: string) {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          take: 20,
          include: { user: { select: { id: true, email: true, name: true } } },
        },
        verificationDocuments: {
          orderBy: { uploadedAt: "desc" },
          take: 20,
        },
        _count: { select: { properties: true } },
      },
    });
    return { org, error: null as string | null };
  } catch (err) {
    return {
      org: null,
      error: err instanceof Error ? err.message : "Org detail failed",
    };
  }
}

/**
 * Agent/org KYC decision — listing verification stays property-scoped.
 */
export async function decideOrganizationKyc(input: {
  organizationId: string;
  decision: "VERIFIED" | "REJECTED" | "PENDING";
  reason: string;
  actorUserId: string;
  syncTrustLadder?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (
    (input.decision === "REJECTED" || input.decision === "VERIFIED") &&
    input.reason.trim().length < 8
  ) {
    return { ok: false, error: "Reason required." };
  }

  await prisma.organization.update({
    where: { id: input.organizationId },
    data: {
      kycStatus: input.decision as never,
      kycDecisionReason: input.reason.trim() || null,
      kycReviewedAt: new Date(),
      kycReviewedByUserId: input.actorUserId,
    },
  });

  if (input.decision === "VERIFIED" && input.syncTrustLadder !== false) {
    await setOrganizationVerification({
      organizationId: input.organizationId,
      status: "ORGANIZATION_VERIFIED",
    });
  }

  await writeAuditLog({
    action: `admin.org.kyc.${input.decision.toLowerCase()}`,
    entity: "Organization",
    entityId: input.organizationId,
    actorId: input.actorUserId,
    meta: {
      decision: input.decision,
      reason: input.reason.trim().slice(0, 300),
      note: "agent_org_kyc_not_listing_verification",
    },
  });

  return { ok: true };
}

export async function registerOrgVerificationDocument(input: {
  organizationId: string;
  storageKey: string;
  fileName: string;
  contentType: string;
  actorUserId: string;
  notes?: string;
  sizeBytes?: number | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!input.storageKey.trim() || !input.fileName.trim()) {
    return { ok: false, error: "storageKey and fileName required." };
  }

  const mimeCheck = assertSafeUploadMeta({
    contentType: input.contentType,
    fileName: input.fileName,
    sizeBytes: input.sizeBytes,
  });
  if (!mimeCheck.ok) {
    return {
      ok: false,
      error:
        mimeCheck.reason === "too_large"
          ? "Soubor překračuje povolenou velikost."
          : mimeCheck.reason === "extension"
            ? "Přípona souboru neodpovídá typu."
            : "Nepovolený typ souboru.",
    };
  }

  const row = await prisma.organizationVerificationDocument.create({
    data: {
      organizationId: input.organizationId,
      storageKey: input.storageKey.trim(),
      fileName: input.fileName.trim(),
      contentType: mimeCheck.mime,
      sensitivity: "PROTECTED",
      uploadedByUserId: input.actorUserId,
      notes: input.notes?.trim() || null,
    },
  });

  await writeAuditLog({
    action: "admin.org.kyc.document.register",
    entity: "OrganizationVerificationDocument",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: {
      organizationId: input.organizationId,
      fileName: input.fileName,
      sensitivity: "PROTECTED",
    },
  });

  return { ok: true, id: row.id };
}

export async function auditOrgDocumentAccess(input: {
  documentId: string;
  actorUserId: string;
}): Promise<{ ok: true; storageKey: string } | { ok: false; error: string }> {
  const doc = await prisma.organizationVerificationDocument.findUnique({
    where: { id: input.documentId },
  });
  if (!doc) return { ok: false, error: "Document not found." };

  await writeAuditLog({
    action: "admin.org.kyc.document.access",
    entity: "OrganizationVerificationDocument",
    entityId: doc.id,
    actorId: input.actorUserId,
    meta: {
      organizationId: doc.organizationId,
      sensitivity: doc.sensitivity,
    },
  });

  return { ok: true, storageKey: doc.storageKey };
}
