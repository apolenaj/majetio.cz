/**
 * Field override resolve with expiry + manual tag (Property Ops).
 */

export type AdminFieldOverride = {
  fieldKey: string;
  value: string;
  locked: boolean;
  reason: string | null;
  manualTag?: boolean | null;
  expiresAt?: Date | string | null;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export function isOverrideActive(
  override: Pick<AdminFieldOverride, "expiresAt">,
  now: Date = new Date(),
): boolean {
  if (!override.expiresAt) return true;
  const exp =
    typeof override.expiresAt === "string"
      ? new Date(override.expiresAt)
      : override.expiresAt;
  return exp.getTime() > now.getTime();
}

export function resolveCanonicalFieldValue(input: {
  fieldKey: string;
  storedValue: string | null | undefined;
  overrides: AdminFieldOverride[];
  now?: Date;
}): {
  value: string | null;
  fromOverride: boolean;
  override: AdminFieldOverride | null;
} {
  const active = input.overrides.find(
    (o) =>
      o.fieldKey === input.fieldKey &&
      o.locked &&
      isOverrideActive(o, input.now),
  );
  if (active) {
    return { value: active.value, fromOverride: true, override: active };
  }
  return {
    value: input.storedValue ?? null,
    fromOverride: false,
    override: null,
  };
}

export const OVERRIDEABLE_FIELD_KEYS = [
  "title",
  "askingPrice",
  "usableArea",
  "layout",
  "publicLabel",
  "publicCity",
  "description",
  "condition",
] as const;

export type OverrideableFieldKey = (typeof OVERRIDEABLE_FIELD_KEYS)[number];
