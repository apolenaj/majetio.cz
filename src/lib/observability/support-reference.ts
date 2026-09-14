/**
 * Client-side support reference — last x-request-id + Next.js error digest.
 * Layout stamps meta; error boundaries show digests for support tickets.
 */

export const LAST_REQUEST_ID_STORAGE_KEY = "majetio.last_request_id";

export function rememberRequestId(id: string | null | undefined): void {
  if (!id || typeof window === "undefined") return;
  const cleaned = id.trim().slice(0, 128);
  if (cleaned.length < 8) return;
  try {
    sessionStorage.setItem(LAST_REQUEST_ID_STORAGE_KEY, cleaned);
  } catch {
    /* private mode */
  }
}

export function readLastRequestId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(LAST_REQUEST_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Prefer digest (Next.js) then last request id for support copy. */
export function formatSupportReference(input: {
  digest?: string | null;
  requestId?: string | null;
}): string | null {
  const digest = input.digest?.trim() || null;
  const requestId = input.requestId?.trim() || null;
  if (digest && requestId && digest !== requestId) {
    return `digest ${digest} · request ${requestId}`;
  }
  return digest ?? requestId;
}
