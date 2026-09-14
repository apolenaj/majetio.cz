import "server-only";

import { prisma } from "@/lib/db";
import type {
  LegalDocumentRecord,
  LegalDocumentType,
} from "@/domains/privacy/consent-record";
import { FALLBACK_LEGAL_DOCUMENTS } from "@/domains/privacy/legal-content";

export async function getPublishedLegalDocument(
  type: LegalDocumentType,
  opts?: { marketCode?: string; locale?: string },
): Promise<LegalDocumentRecord> {
  const marketCode = opts?.marketCode ?? "CZ";
  const locale = opts?.locale ?? "cs-CZ";

  try {
    const row = await prisma.legalDocument.findFirst({
      where: {
        type,
        status: "PUBLISHED",
        marketCode,
        locale,
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
    if (row) {
      return {
        type: row.type,
        version: row.version,
        status: row.status,
        title: row.title,
        content: row.content,
        summary: row.summary,
        locale: row.locale,
        marketCode: row.marketCode,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        effectiveFrom: row.effectiveFrom?.toISOString() ?? null,
      };
    }
  } catch {
    /* DB unavailable / pre-migrate — use fallback */
  }

  return FALLBACK_LEGAL_DOCUMENTS[type];
}
