/**
 * Moderation decisions + safe user-facing copy.
 */

export const MODERATION_DECISIONS = [
  "APPROVE",
  "REJECT",
  "REQUEST_CHANGES",
  "SUSPEND",
] as const;

export type ModerationDecision = (typeof MODERATION_DECISIONS)[number];

export type ModerationTargetStatus =
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED"
  | "DRAFT";

export function statusAfterModerationDecision(
  decision: ModerationDecision,
): ModerationTargetStatus {
  switch (decision) {
    case "APPROVE":
      return "ACTIVE";
    case "REJECT":
      return "REJECTED";
    case "REQUEST_CHANGES":
      return "DRAFT";
    case "SUSPEND":
      return "SUSPENDED";
  }
}

export function requiresModerationReason(decision: ModerationDecision): boolean {
  return decision === "REJECT" || decision === "SUSPEND" || decision === "REQUEST_CHANGES";
}

/**
 * Safe owner-facing explanation — no internal rule codes / partner names.
 */
export function buildUserFacingModerationMessage(input: {
  decision: ModerationDecision;
  reason: string;
}): string {
  const reason = input.reason.trim();
  switch (input.decision) {
    case "APPROVE":
      return "Vaše nabídka byla schválena a může být zveřejněna.";
    case "REJECT":
      return [
        "Nabídku jsme neschválili ke zveřejnění.",
        reason
          ? `Důvod: ${sanitizePublicReason(reason)}`
          : "Doplňte chybějící údaje a odešlete ji znovu ke kontrole.",
      ].join(" ");
    case "REQUEST_CHANGES":
      return [
        "Nabídka vyžaduje úpravy před zveřejněním.",
        reason
          ? `Co upravit: ${sanitizePublicReason(reason)}`
          : "Zkontrolujte cenu, lokalitu a popis a odešlete znovu.",
      ].join(" ");
    case "SUSPEND":
      return [
        "Nabídka byla dočasně pozastavena.",
        reason
          ? `Důvod: ${sanitizePublicReason(reason)}`
          : "Kontaktujte podporu Majetio pro další postup.",
      ].join(" ");
  }
}

function sanitizePublicReason(reason: string): string {
  return reason
    .replace(/\b(internal|partner|feed|sql|stack)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}
