/**
 * Per-property decision priority (HIGH/MEDIUM/LOW) — not Matrix criterion weights.
 */

import type { DecisionPriorityLevel } from "@prisma/client";

export const PROPERTY_DECISION_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;

export type PropertyDecisionPriority = (typeof PROPERTY_DECISION_PRIORITIES)[number];

export const PROPERTY_DECISION_PRIORITY_LABELS_CS: Record<
  PropertyDecisionPriority,
  string
> = {
  HIGH: "Vysoká",
  MEDIUM: "Střední",
  LOW: "Nízká",
};

export function isPropertyDecisionPriority(
  value: unknown,
): value is PropertyDecisionPriority {
  return (
    typeof value === "string" &&
    (PROPERTY_DECISION_PRIORITIES as readonly string[]).includes(value)
  );
}

export function propertyDecisionPriorityLabel(
  value: DecisionPriorityLevel | PropertyDecisionPriority | null | undefined,
): string | null {
  if (!value) return null;
  return PROPERTY_DECISION_PRIORITY_LABELS_CS[value as PropertyDecisionPriority] ?? null;
}
