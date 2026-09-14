/**
 * Site origin helper — prefer public app URL; never emit localhost in prod-like.
 */

import { getPublicAppUrl } from "@/lib/app-url";

export function getSiteOrigin(): string {
  return getPublicAppUrl();
}
