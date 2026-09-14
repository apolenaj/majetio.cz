"use client";

import { useEffect } from "react";

import { rememberRequestId } from "@/lib/observability/support-reference";

/**
 * Syncs server-stamped request id into sessionStorage for error UI / support.
 */
export function RequestIdCapture({ requestId }: { requestId: string | null }) {
  useEffect(() => {
    rememberRequestId(requestId);
  }, [requestId]);

  return null;
}
