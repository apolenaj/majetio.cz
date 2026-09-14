/**
 * Admin property detail — canonical vs sources vs provenance vs overrides.
 */

import { prisma } from "@/lib/db";
import {
  OVERRIDEABLE_FIELD_KEYS,
  resolveCanonicalFieldValue,
  type AdminFieldOverride,
} from "@/domains/properties/admin/override-resolve";
import { validatePropertyForPublish } from "@/domains/properties/admin/publish-validation";

export type AdminProvenanceRow = {
  fieldKey: string;
  sourceId: string | null;
  provider: string | null;
  sourceType: string | null;
  observedAt: Date;
  confidence: number | null;
  valueSnapshot: string | null;
};

export type AdminSourceRow = {
  id: string;
  provider: string;
  sourceType: string;
  externalPropertyId: string | null;
  url: string | null;
  isPrimary: boolean;
  licenseStatus: string;
  lastSeenAt: Date;
  lastFetchedAt: Date | null;
};

export type AdminCanonicalField = {
  fieldKey: string;
  storedValue: string | null;
  displayValue: string | null;
  fromOverride: boolean;
  manualTag: boolean;
  overrideReason: string | null;
  overrideExpiresAt: string | null;
  overrideActorId: string | null;
  overrideUpdatedAt: string | null;
};

export type AdminPropertyDetail = {
  id: string;
  slug: string;
  status: string;
  visibility: string;
  freshness: string;
  marketCode: string;
  currency: string;
  isDemo: boolean;
  title: string;
  askingPrice: number | null;
  usableArea: number | null;
  layout: string | null;
  publicLabel: string | null;
  publicCity: string | null;
  description: string | null;
  condition: string | null;
  moderationReason: string | null;
  userFacingModerationMessage: string | null;
  moderatedAt: Date | null;
  publishedAt: Date | null;
  canonicalFields: AdminCanonicalField[];
  sources: AdminSourceRow[];
  provenance: AdminProvenanceRow[];
  overrides: AdminFieldOverride[];
  criticalDqCount: number;
  publishValidation: ReturnType<typeof validatePropertyForPublish>;
};

function storedString(
  property: Record<string, unknown>,
  fieldKey: string,
): string | null {
  const v = property[fieldKey];
  if (v == null) return null;
  return String(v);
}

export async function getAdminPropertyDetail(
  propertyId: string,
): Promise<{ detail: AdminPropertyDetail | null; error: string | null }> {
  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        sources: {
          orderBy: [{ isPrimary: "desc" }, { lastSeenAt: "desc" }],
        },
        fieldProvenance: {
          include: { source: { select: { provider: true, sourceType: true } } },
          orderBy: { observedAt: "desc" },
        },
        fieldOverrides: true,
        _count: {
          select: {
            qualityIssues: {
              where: { severity: "CRITICAL", status: "OPEN" },
            },
          },
        },
      },
    });

    if (!property) return { detail: null, error: null };

    const overrides = property.fieldOverrides as unknown as AdminFieldOverride[];
    const propRec = property as unknown as Record<string, unknown>;

    const canonicalFields: AdminCanonicalField[] = OVERRIDEABLE_FIELD_KEYS.map(
      (fieldKey) => {
        const stored = storedString(propRec, fieldKey);
        const resolved = resolveCanonicalFieldValue({
          fieldKey,
          storedValue: stored,
          overrides,
        });
        return {
          fieldKey,
          storedValue: stored,
          displayValue: resolved.value,
          fromOverride: resolved.fromOverride,
          manualTag: Boolean(resolved.override?.manualTag ?? resolved.fromOverride),
          overrideReason: resolved.override?.reason ?? null,
          overrideExpiresAt: resolved.override?.expiresAt
            ? String(resolved.override.expiresAt)
            : null,
          overrideActorId:
            resolved.override?.updatedById ??
            resolved.override?.createdById ??
            null,
          overrideUpdatedAt: resolved.override?.updatedAt
            ? String(resolved.override.updatedAt)
            : null,
        };
      },
    );

    const publishValidation = validatePropertyForPublish({
      title: property.title,
      propertyType: property.propertyType,
      askingPrice: property.askingPrice,
      currency: property.currency,
      usableArea: property.usableArea,
      publicCity: property.publicCity,
      marketCode: property.marketCode,
      openCriticalDqCount: property._count.qualityIssues,
    });

    const detail: AdminPropertyDetail = {
      id: property.id,
      slug: property.slug,
      status: property.status,
      visibility: property.visibility,
      freshness: property.freshness,
      marketCode: property.marketCode,
      currency: property.currency,
      isDemo: property.isDemo,
      title: property.title,
      askingPrice: property.askingPrice,
      usableArea: property.usableArea,
      layout: property.layout,
      publicLabel: property.publicLabel,
      publicCity: property.publicCity,
      description: property.description,
      condition: property.condition,
      moderationReason:
        (property as { moderationReason?: string | null }).moderationReason ??
        null,
      userFacingModerationMessage:
        (property as { userFacingModerationMessage?: string | null })
          .userFacingModerationMessage ?? null,
      moderatedAt:
        (property as { moderatedAt?: Date | null }).moderatedAt ?? null,
      publishedAt: property.publishedAt,
      canonicalFields,
      sources: property.sources.map((s) => ({
        id: s.id,
        provider: s.provider,
        sourceType: s.sourceType,
        externalPropertyId: s.externalPropertyId,
        url: s.url,
        isPrimary: s.isPrimary,
        licenseStatus: s.licenseStatus,
        lastSeenAt: s.lastSeenAt,
        lastFetchedAt: s.lastFetchedAt,
      })),
      provenance: property.fieldProvenance.map((p) => ({
        fieldKey: p.fieldKey,
        sourceId: p.sourceId,
        provider: p.source?.provider ?? null,
        sourceType: p.source?.sourceType ?? null,
        observedAt: p.observedAt,
        confidence: p.confidence,
        valueSnapshot: p.valueSnapshot,
      })),
      overrides,
      criticalDqCount: property._count.qualityIssues,
      publishValidation,
    };

    return { detail, error: null };
  } catch (err) {
    return {
      detail: null,
      error: err instanceof Error ? err.message : "Detail load failed",
    };
  }
}
