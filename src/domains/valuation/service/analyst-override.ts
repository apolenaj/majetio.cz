/**
 * Analyst override audit helpers (Prompt 10 Part 5).
 * Append-only — never silently rewrite Valuation fields.
 */

export type AnalystOverrideInput = {
  valuationId: string;
  actorUserId: string | null;
  fieldKey: string;
  previousValue: unknown;
  newValue: unknown;
  reason: string;
  at?: Date;
};

export type AnalystOverrideAuditRecord = {
  id: string;
  valuationId: string;
  actorUserId: string | null;
  fieldKey: string;
  previousValue: unknown;
  newValue: unknown;
  reason: string;
  createdAt: string;
};

let seq = 0;

/**
 * Build an immutable audit row for a manual analyst change.
 * Rejects empty reason (audit must explain why).
 */
export function buildAnalystOverrideAudit(
  input: AnalystOverrideInput,
): AnalystOverrideAuditRecord {
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("Analyst override requires a non-empty reason.");
  }
  if (!input.fieldKey.trim()) {
    throw new Error("Analyst override requires fieldKey.");
  }
  seq += 1;
  return {
    id: `audit-${seq}`,
    valuationId: input.valuationId,
    actorUserId: input.actorUserId,
    fieldKey: input.fieldKey,
    previousValue: input.previousValue,
    newValue: input.newValue,
    reason,
    createdAt: (input.at ?? new Date()).toISOString(),
  };
}

/** In-memory append-only store for tests / demo until Prisma persistence is wired. */
export function createAnalystOverrideAuditLog() {
  const rows: AnalystOverrideAuditRecord[] = [];
  return {
    append(input: AnalystOverrideInput): AnalystOverrideAuditRecord {
      const row = buildAnalystOverrideAudit(input);
      rows.push(row);
      return row;
    },
    listForValuation(valuationId: string): AnalystOverrideAuditRecord[] {
      return rows.filter((r) => r.valuationId === valuationId);
    },
    all(): readonly AnalystOverrideAuditRecord[] {
      return rows;
    },
  };
}
