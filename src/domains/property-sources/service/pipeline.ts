/**
 * Ingest pipeline (Prompt 7 Part 4):
 * Ingest → Validate → Sanitize → Normalize → Detect Duplicates → Canonical Update plan
 *
 * Pure orchestration — callers persist ImportJob / Property / DuplicateCandidate.
 */

import {
  computeDedupeScore,
  orderedPropertyPairIds,
  type DedupePropertySnapshot,
  type DedupeScoreResult,
} from "@/domains/properties/service/dedupe-score";
import {
  applyOverridesToIncomingFields,
  type FieldOverrideRecord,
} from "@/domains/properties/service/field-overrides";
import { detectDataQualityIssues } from "@/domains/properties/service/data-quality";
import type { PropertySourceAdapter } from "./adapter";
import { runAdapter } from "./adapter";
import { buildCanonicalKey, slugifyTitle } from "./normalize";
import { sanitizeListingDraft } from "./sanitize";
import { buildItemIdempotencyKey, hashPayload } from "./idempotency";
import type { NormalizedListing } from "../schemas/normalized-listing";

export type PipelineStage =
  | "ingest"
  | "validate"
  | "sanitize"
  | "normalize"
  | "detect_duplicates"
  | "canonical_update";

export type ExistingPropertyRef = DedupePropertySnapshot & {
  canonicalKey?: string | null;
  provider?: string | null;
  externalPropertyId?: string | null;
};

export type CanonicalUpdatePlan = {
  action: "create" | "update" | "skip_idempotent";
  canonicalKey: string;
  slug: string;
  listing: NormalizedListing;
  /** Fields safe to write after overrides. */
  patch: Record<string, unknown>;
  skippedLockedFields: string[];
  qualityIssueCount: number;
};

export type PipelineResult = {
  stages: PipelineStage[];
  idempotencyKey: string;
  payloadHash: string;
  listing: NormalizedListing;
  duplicateMatches: Array<{
    propertyId: string;
    score: DedupeScoreResult;
    pair: { propertyAId: string; propertyBId: string };
  }>;
  canonical: CanonicalUpdatePlan;
};

export type RunPipelineInput = {
  adapter: PropertySourceAdapter;
  payload: unknown;
  /** Existing properties to score for duplicates (same city / batch). */
  candidates?: ExistingPropertyRef[];
  /** Known property matched by provider+externalId (idempotent update). */
  existingByExternalId?: ExistingPropertyRef | null;
  overrides?: FieldOverrideRecord[];
  sourceType?: string;
};

function listingToDedupeSnapshot(
  listing: NormalizedListing,
  id = "incoming",
): DedupePropertySnapshot {
  return {
    id,
    street: listing.street,
    houseNumber: listing.houseNumber,
    publicCity: listing.publicCity,
    publicDistrict: listing.publicDistrict,
    latitude: listing.latitude,
    longitude: listing.longitude,
    usableArea: listing.usableAreaM2,
    floorArea: listing.floorAreaM2,
    askingPrice: listing.askingPrice,
    title: listing.title,
    description: listing.description,
  };
}

function buildPatch(
  listing: NormalizedListing,
  overrides: FieldOverrideRecord[],
): { patch: Record<string, unknown>; skippedLockedFields: string[] } {
  const incoming = [
    { fieldKey: "title", value: listing.title },
    { fieldKey: "description", value: listing.description ?? "" },
    { fieldKey: "askingPrice", value: String(listing.askingPrice ?? "") },
    { fieldKey: "usableArea", value: String(listing.usableAreaM2 ?? "") },
    { fieldKey: "publicCity", value: listing.publicCity ?? "" },
    { fieldKey: "street", value: listing.street ?? "" },
  ].filter((f) => f.value !== "");

  const { applied, skippedLocked } = applyOverridesToIncomingFields(incoming, overrides);
  const patch: Record<string, unknown> = {
    currency: listing.currency,
    transactionType: listing.transactionType ?? "SALE",
    publicDistrict: listing.publicDistrict,
    publicRegion: listing.publicRegion,
    publicLabel: listing.publicLabel,
    latitude: listing.latitude,
    longitude: listing.longitude,
    layout: listing.layout,
  };
  for (const field of applied) {
    if (field.fieldKey === "askingPrice") {
      patch.askingPrice = Number(field.value);
      patch.priceCzk = Number(field.value);
    } else if (field.fieldKey === "usableArea") {
      patch.usableArea = Number(field.value);
      patch.areaSqm = Number(field.value);
    } else {
      patch[field.fieldKey] = field.value;
    }
  }
  return {
    patch,
    skippedLockedFields: skippedLocked.map((s) => s.fieldKey),
  };
}

/**
 * Full pipeline for one payload. Does not write to DB.
 */
export function runIngestPipeline(input: RunPipelineInput): PipelineResult {
  const stages: PipelineStage[] = ["ingest", "validate"];
  const sourceType = input.sourceType ?? "OTHER";
  const listingRaw = runAdapter(input.adapter, input.payload, {
    provider: input.adapter.provider,
    sourceType,
  });

  stages.push("sanitize");
  const sanitized = {
    ...listingRaw,
    ...sanitizeListingDraft(listingRaw),
    media: listingRaw.media,
  } as NormalizedListing;

  stages.push("normalize");
  const listing: NormalizedListing = {
    ...sanitized,
    currency: sanitized.currency || "CZK",
    provider: sanitized.provider || input.adapter.provider,
    sourceType,
  };

  const idempotencyKey = buildItemIdempotencyKey({
    provider: listing.provider,
    externalPropertyId: listing.externalPropertyId,
    payload: input.payload,
  });
  const payloadHash = hashPayload(input.payload);

  stages.push("detect_duplicates");
  const incomingSnap = listingToDedupeSnapshot(listing);
  const duplicateMatches = (input.candidates ?? [])
    .map((candidate) => {
      const score = computeDedupeScore(incomingSnap, candidate);
      if (!score.aboveReviewThreshold) return null;
      return {
        propertyId: candidate.id,
        score,
        pair: orderedPropertyPairIds("pending", candidate.id),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m != null);

  stages.push("canonical_update");
  const canonicalKey = buildCanonicalKey(listing.provider, listing.externalPropertyId);
  const overrides = input.overrides ?? [];
  const { patch, skippedLockedFields } = buildPatch(listing, overrides);
  const qualityIssueCount = detectDataQualityIssues({
    askingPrice: listing.askingPrice,
    usableArea: listing.usableAreaM2,
    floorArea: listing.floorAreaM2,
  }).length;

  let action: CanonicalUpdatePlan["action"] = "create";
  if (input.existingByExternalId) {
    action = "update";
  }

  // Same external identity already mapped → idempotent update, not a new Property
  if (
    input.existingByExternalId?.canonicalKey === canonicalKey ||
    (input.existingByExternalId?.externalPropertyId === listing.externalPropertyId &&
      input.existingByExternalId?.provider === listing.provider)
  ) {
    action = "update";
  }

  const canonical: CanonicalUpdatePlan = {
    action,
    canonicalKey,
    slug: slugifyTitle(listing.title, listing.externalPropertyId),
    listing,
    patch,
    skippedLockedFields,
    qualityIssueCount,
  };

  return {
    stages,
    idempotencyKey,
    payloadHash,
    listing,
    duplicateMatches: duplicateMatches.map((m) => ({
      ...m,
      pair: orderedPropertyPairIds(
        input.existingByExternalId?.id ?? canonicalKey,
        m.propertyId,
      ),
    })),
    canonical,
  };
}

/** Mark plan as skip when this item idempotency key was already SUCCEEDED. */
export function markIdempotentSkip(plan: CanonicalUpdatePlan): CanonicalUpdatePlan {
  return { ...plan, action: "skip_idempotent" };
}
