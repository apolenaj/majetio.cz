/**
 * Non-destructive merge strategy (Prompt 7 Part 3).
 *
 * NEVER delete the losing Property or its sources. Canonical stays;
 * secondary listing is linked via PropertyDuplicateCandidate.mergeIntoPropertyId
 * and its PropertySource rows can be re-pointed or kept for history.
 */

export type SourceTrustTier = "verified" | "licensed" | "partner" | "portal" | "manual" | "unknown";

export type FieldCandidate = {
  fieldKey: string;
  value: unknown;
  sourceId?: string | null;
  /** Higher wins when tiers tie on freshness. */
  trust: SourceTrustTier;
  observedAt?: Date | null;
  /** Analyst lock — import must not overwrite. */
  lockedByOverride?: boolean;
};

export type MergeConflictResolution = {
  fieldKey: string;
  chosen: FieldCandidate;
  rejected: FieldCandidate[];
  reason: "override_locked" | "verified_source" | "higher_trust" | "fresher" | "canonical_default";
};

export type MergePlan = {
  /** Property that remains the public/canonical row. */
  canonicalPropertyId: string;
  /** Property kept for history; not hard-deleted. */
  secondaryPropertyId: string;
  resolutions: MergeConflictResolution[];
  /** Fields that feeds must skip because of PropertyFieldOverride.locked. */
  lockedFieldKeys: string[];
};

const TRUST_RANK: Record<SourceTrustTier, number> = {
  verified: 100,
  licensed: 80,
  partner: 60,
  portal: 40,
  manual: 30,
  unknown: 10,
};

export function mapSourceTypeToTrust(
  sourceType: string | null | undefined,
  opts?: { verified?: boolean },
): SourceTrustTier {
  if (opts?.verified) return "verified";
  switch ((sourceType ?? "").toUpperCase()) {
    case "LICENSED_API":
      return "licensed";
    case "PARTNER_FEED":
      return "partner";
    case "PUBLIC_PORTAL":
      return "portal";
    case "MANUAL":
    case "USER_SUBMITTED":
      return "manual";
    default:
      return "unknown";
  }
}

function pickWinner(
  candidates: FieldCandidate[],
  lockedOverride?: FieldCandidate,
): MergeConflictResolution {
  const fieldKey = candidates[0]?.fieldKey ?? lockedOverride?.fieldKey ?? "unknown";

  if (lockedOverride?.lockedByOverride) {
    return {
      fieldKey,
      chosen: lockedOverride,
      rejected: candidates.filter((c) => c !== lockedOverride),
      reason: "override_locked",
    };
  }

  const sorted = [...candidates].sort((a, b) => {
    const trustDiff = TRUST_RANK[b.trust] - TRUST_RANK[a.trust];
    if (trustDiff !== 0) return trustDiff;
    const aTime = a.observedAt?.getTime() ?? 0;
    const bTime = b.observedAt?.getTime() ?? 0;
    return bTime - aTime;
  });

  const chosen = sorted[0]!;
  const rejected = sorted.slice(1);

  let reason: MergeConflictResolution["reason"] = "canonical_default";
  if (chosen.trust === "verified") reason = "verified_source";
  else if (rejected.some((r) => TRUST_RANK[r.trust] < TRUST_RANK[chosen.trust])) {
    reason = "higher_trust";
  } else if (rejected.some((r) => (r.observedAt?.getTime() ?? 0) < (chosen.observedAt?.getTime() ?? 0))) {
    reason = "fresher";
  }

  return { fieldKey, chosen, rejected, reason };
}

/**
 * Build a merge plan without mutating storage.
 * Callers persist: candidate status MERGED, mergeIntoPropertyId, provenance updates.
 */
export function planNonDestructiveMerge(input: {
  propertyAId: string;
  propertyBId: string;
  /** Prefer keeping this id as canonical when scores otherwise equal. */
  preferredCanonicalId?: string;
  fieldGroups: FieldCandidate[][];
  overrides?: FieldCandidate[];
}): MergePlan {
  const { propertyAId, propertyBId, preferredCanonicalId, fieldGroups, overrides = [] } = input;

  const canonicalPropertyId =
    preferredCanonicalId === propertyAId || preferredCanonicalId === propertyBId
      ? preferredCanonicalId
      : propertyAId < propertyBId
        ? propertyAId
        : propertyBId;
  const secondaryPropertyId =
    canonicalPropertyId === propertyAId ? propertyBId : propertyAId;

  const overrideByField = new Map(
    overrides.filter((o) => o.lockedByOverride).map((o) => [o.fieldKey, o]),
  );

  const resolutions = fieldGroups.map((group) => {
    const key = group[0]?.fieldKey;
    const locked = key ? overrideByField.get(key) : undefined;
    return pickWinner(group, locked);
  });

  return {
    canonicalPropertyId,
    secondaryPropertyId,
    resolutions,
    lockedFieldKeys: [...overrideByField.keys()],
  };
}

/**
 * Import guard: if a locked override exists for the field, skip the incoming value.
 */
export function shouldApplyIncomingField(input: {
  fieldKey: string;
  overrides: Array<{ fieldKey: string; locked: boolean }>;
}): boolean {
  const hit = input.overrides.find((o) => o.fieldKey === input.fieldKey);
  return !(hit?.locked === true);
}
