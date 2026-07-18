/**
 * Field override helpers (Prompt 7 Part 3).
 * Analyst locks prevent feed imports from overwriting canonical values.
 */

export type FieldOverrideRecord = {
  fieldKey: string;
  value: string;
  locked: boolean;
};

export type IncomingFieldUpdate = {
  fieldKey: string;
  value: string;
};

export type OverrideApplyResult = {
  applied: IncomingFieldUpdate[];
  skippedLocked: IncomingFieldUpdate[];
};

/**
 * Filter an import patch against locked overrides.
 */
export function applyOverridesToIncomingFields(
  incoming: IncomingFieldUpdate[],
  overrides: FieldOverrideRecord[],
): OverrideApplyResult {
  const locked = new Map(
    overrides.filter((o) => o.locked).map((o) => [o.fieldKey, o]),
  );

  const applied: IncomingFieldUpdate[] = [];
  const skippedLocked: IncomingFieldUpdate[] = [];

  for (const field of incoming) {
    if (locked.has(field.fieldKey)) {
      skippedLocked.push(field);
    } else {
      applied.push(field);
    }
  }

  return { applied, skippedLocked };
}

/**
 * Resolve display/canonical value: locked override wins over stored/incoming.
 */
export function resolveFieldValue(input: {
  fieldKey: string;
  storedValue?: string | null;
  overrides: FieldOverrideRecord[];
}): string | null {
  const override = input.overrides.find((o) => o.fieldKey === input.fieldKey);
  if (override?.locked) return override.value;
  return input.storedValue ?? override?.value ?? null;
}
