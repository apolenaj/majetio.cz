/**
 * Pure admin API errors / IDOR guards — no Next.js imports (testable).
 */

export class AdminApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Explicit ban on universal DB editor style APIs (190–192).
 */
export function rejectUniversalDbEditor(): never {
  throw new AdminApiError(
    403,
    "db_editor_forbidden",
    "Universal DB editor / raw table mutation APIs are forbidden. Use typed admin endpoints.",
  );
}

/** IDOR guard: admin APIs must never accept end-user userId as authority. */
export function assertActorIsSessionUser(
  actorId: string,
  claimedUserId: string | null | undefined,
): void {
  if (claimedUserId && claimedUserId !== actorId) {
    throw new AdminApiError(
      403,
      "idor_blocked",
      "Client-supplied actor userId is not allowed (IDOR protection).",
    );
  }
}
