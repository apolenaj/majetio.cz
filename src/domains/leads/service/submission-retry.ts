/**
 * Exponential backoff retry policy for mortgage lead submission.
 */

export const SUBMISSION_MAX_ATTEMPTS = 5;

/** Backoff delays in milliseconds after attempt N (1-indexed). */
export const SUBMISSION_RETRY_DELAYS_MS = [
  60_000,
  5 * 60_000,
  15 * 60_000,
  60 * 60_000,
  4 * 60 * 60_000,
] as const;

export function computeNextRetryAt(input: {
  attemptNumber: number;
  from?: Date;
}): Date | null {
  if (input.attemptNumber >= SUBMISSION_MAX_ATTEMPTS) return null;
  const delay =
    SUBMISSION_RETRY_DELAYS_MS[
      Math.min(input.attemptNumber - 1, SUBMISSION_RETRY_DELAYS_MS.length - 1)
    ] ?? SUBMISSION_RETRY_DELAYS_MS.at(-1)!;
  return new Date((input.from ?? new Date()).getTime() + delay);
}

export function shouldMoveToDeadLetter(attemptNumber: number): boolean {
  return attemptNumber >= SUBMISSION_MAX_ATTEMPTS;
}
