/**
 * Content & Regulatory Governance — DRAFT → REVIEW → PUBLISHED + preview.
 */

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth/audit";

export type CmsContentStatus = "DRAFT" | "REVIEW" | "PUBLISHED";
export type CmsContentKind = "GUIDE" | "FAQ" | "METHODOLOGY" | "REGULATORY";
export type ContentTranslationStatus =
  | "MACHINE_DRAFT"
  | "REVIEWED"
  | "APPROVED";

export function canTransitionCmsStatus(
  from: CmsContentStatus,
  to: CmsContentStatus,
): boolean {
  if (from === to) return true;
  const allowed: Record<CmsContentStatus, CmsContentStatus[]> = {
    DRAFT: ["REVIEW", "DRAFT"],
    REVIEW: ["DRAFT", "PUBLISHED", "REVIEW"],
    PUBLISHED: ["DRAFT", "REVIEW", "PUBLISHED"],
  };
  return allowed[from].includes(to);
}

/** Public ship gate for translations. */
export function isTranslationApprovedForPublic(
  status: ContentTranslationStatus,
  isRegulatory: boolean,
): boolean {
  if (isRegulatory) return status === "APPROVED";
  return status === "REVIEWED" || status === "APPROVED";
}

export async function listCmsContent(input?: {
  status?: CmsContentStatus;
  kind?: CmsContentKind;
}): Promise<{
  items: Array<{
    id: string;
    slug: string;
    kind: string;
    status: string;
    title: string;
    isRegulatory: boolean;
    reviewRequiredAt: Date | null;
    marketCode: string;
    locale: string;
    publishedAt: Date | null;
  }>;
  error: string | null;
}> {
  try {
    const where: Record<string, unknown> = {};
    if (input?.status) where.status = input.status;
    if (input?.kind) where.kind = input.kind;

    const rows = await prisma.cmsContent.findMany({
      where: where as never,
      orderBy: { updatedAt: "desc" },
      take: 60,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        kind: r.kind,
        status: r.status,
        title: r.title,
        isRegulatory: r.isRegulatory,
        reviewRequiredAt: r.reviewRequiredAt,
        marketCode: r.marketCode,
        locale: r.locale,
        publishedAt: r.publishedAt,
      })),
      error: null,
    };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "CMS list failed",
    };
  }
}

export async function getCmsContentPreview(contentId: string) {
  try {
    const row = await prisma.cmsContent.findUnique({
      where: { id: contentId },
      include: { translations: true },
    });
    return { content: row, error: null as string | null };
  } catch (err) {
    return {
      content: null,
      error: err instanceof Error ? err.message : "Preview failed",
    };
  }
}

export async function createCmsContent(input: {
  slug: string;
  kind: CmsContentKind;
  title: string;
  bodyMarkdown: string;
  marketCode?: string;
  locale?: string;
  isRegulatory?: boolean;
  sourceLabel?: string;
  sourceUrl?: string;
  reviewRequiredAt?: Date | null;
  actorUserId: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!input.slug.trim() || !input.title.trim()) {
    return { ok: false, error: "slug and title required." };
  }
  if (input.isRegulatory && !input.sourceLabel?.trim()) {
    return {
      ok: false,
      error: "Regulatory content requires sourceLabel metadata.",
    };
  }

  const row = await prisma.cmsContent.create({
    data: {
      slug: input.slug.trim(),
      kind: input.kind,
      status: "DRAFT",
      title: input.title.trim(),
      bodyMarkdown: input.bodyMarkdown,
      marketCode: input.marketCode ?? "CZ",
      locale: input.locale ?? "cs-CZ",
      isRegulatory: input.isRegulatory ?? input.kind === "REGULATORY",
      sourceLabel: input.sourceLabel?.trim() || null,
      sourceUrl: input.sourceUrl?.trim() || null,
      reviewRequiredAt: input.reviewRequiredAt ?? null,
      createdByUserId: input.actorUserId,
      updatedByUserId: input.actorUserId,
    },
  });

  await writeAuditLog({
    action: "admin.cms.create",
    entity: "CmsContent",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: { slug: row.slug, kind: row.kind },
  });

  return { ok: true, id: row.id };
}

export async function transitionCmsContent(input: {
  contentId: string;
  nextStatus: CmsContentStatus;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.cmsContent.findUnique({
    where: { id: input.contentId },
  });
  if (!row) return { ok: false, error: "Content not found." };

  const from = row.status as CmsContentStatus;
  if (!canTransitionCmsStatus(from, input.nextStatus)) {
    return { ok: false, error: `Cannot transition ${from} → ${input.nextStatus}.` };
  }

  if (input.nextStatus === "PUBLISHED") {
    if (row.isRegulatory && !row.sourceLabel) {
      return {
        ok: false,
        error: "Cannot publish regulatory content without sourceLabel.",
      };
    }
    if (input.reason.trim().length < 12) {
      return { ok: false, error: "Publish reason min. 12 characters." };
    }
  }

  await prisma.cmsContent.update({
    where: { id: row.id },
    data: {
      status: input.nextStatus,
      publishedAt:
        input.nextStatus === "PUBLISHED" ? new Date() : row.publishedAt,
      lastReviewedAt:
        input.nextStatus === "PUBLISHED" || input.nextStatus === "REVIEW"
          ? new Date()
          : row.lastReviewedAt,
      updatedByUserId: input.actorUserId,
    },
  });

  await writeAuditLog({
    action: "admin.cms.transition",
    entity: "CmsContent",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: {
      from,
      to: input.nextStatus,
      reason: input.reason.trim().slice(0, 300),
    },
  });

  return { ok: true };
}

export async function upsertContentTranslation(input: {
  contentId: string;
  locale: string;
  title: string;
  bodyMarkdown: string;
  status: ContentTranslationStatus;
  actorUserId: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parent = await prisma.cmsContent.findUnique({
    where: { id: input.contentId },
  });
  if (!parent) return { ok: false, error: "Content not found." };

  const row = await prisma.contentTranslation.upsert({
    where: {
      contentId_locale: {
        contentId: input.contentId,
        locale: input.locale,
      },
    },
    create: {
      contentId: input.contentId,
      locale: input.locale,
      title: input.title,
      bodyMarkdown: input.bodyMarkdown,
      status: input.status,
      reviewedAt:
        input.status === "REVIEWED" || input.status === "APPROVED"
          ? new Date()
          : null,
      reviewedByUserId:
        input.status === "REVIEWED" || input.status === "APPROVED"
          ? input.actorUserId
          : null,
    },
    update: {
      title: input.title,
      bodyMarkdown: input.bodyMarkdown,
      status: input.status,
      reviewedAt:
        input.status === "REVIEWED" || input.status === "APPROVED"
          ? new Date()
          : null,
      reviewedByUserId:
        input.status === "REVIEWED" || input.status === "APPROVED"
          ? input.actorUserId
          : null,
    },
  });

  await writeAuditLog({
    action: "admin.cms.translation.upsert",
    entity: "ContentTranslation",
    entityId: row.id,
    actorId: input.actorUserId,
    meta: { locale: input.locale, status: input.status },
  });

  return { ok: true, id: row.id };
}

/** Stale regulatory CMS + rules for attention queue. */
export async function listStaleRegulatoryAttention(now = new Date()) {
  try {
    const [cms, rules, seo] = await Promise.all([
      prisma.cmsContent.findMany({
        where: {
          isRegulatory: true,
          reviewRequiredAt: { lte: now },
          status: { in: ["PUBLISHED", "REVIEW"] },
        },
        take: 20,
        orderBy: { reviewRequiredAt: "asc" },
        select: {
          id: true,
          slug: true,
          title: true,
          reviewRequiredAt: true,
        },
      }),
      prisma.regulatoryRule.findMany({
        where: {
          reviewRequiredAt: { lte: now },
          status: { in: ["ACTIVE", "REVIEWED"] },
        },
        take: 20,
        orderBy: { reviewRequiredAt: "asc" },
        select: {
          id: true,
          code: true,
          titleEn: true,
          reviewRequiredAt: true,
          marketCode: true,
        },
      }),
      prisma.programmaticSeoDocument.findMany({
        where: { reviewRequiredAt: { lte: now } },
        take: 15,
        orderBy: { reviewRequiredAt: "asc" },
        select: {
          id: true,
          path: true,
          title: true,
          reviewRequiredAt: true,
          marketCode: true,
        },
      }),
    ]);
    return { cms, rules, seo, error: null as string | null };
  } catch (err) {
    return {
      cms: [],
      rules: [],
      seo: [],
      error: err instanceof Error ? err.message : "Stale regulatory query failed",
    };
  }
}
