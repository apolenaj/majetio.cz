/**
 * Public discovery / search scrape protection — call from RSC listing pages.
 */

import { getRequestIp } from "@/lib/auth/audit";
import { assertPublicSearchRateLimit } from "@/lib/security/rate-limit";

export type PublicSearchGuard =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export async function enforcePublicSearchRateLimit(): Promise<PublicSearchGuard> {
  const ip = await getRequestIp().catch(() => "unknown");
  const limited = await assertPublicSearchRateLimit(ip || "unknown");
  if (!limited.ok) {
    return { ok: false, retryAfterSec: limited.retryAfterSec };
  }
  return { ok: true };
}
