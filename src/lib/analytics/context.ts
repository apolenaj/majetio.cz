/**
 * Shared analytics context — no PII / no user id / no amounts.
 */

import {
  CURRENCY_PREF_COOKIE,
  LOCALE_PREF_COOKIE,
  MARKET_PREF_COOKIE,
} from "@/domains/i18n/preference/store";
import { COOKIE_VISITOR_COOKIE } from "@/domains/privacy/cookie-consent";

export type AnalyticsContext = {
  ts: string;
  source: "client" | "server";
  market: string | null;
  locale: string | null;
  /** Opaque visitor cookie — never email or account id. */
  anon_id: string | null;
};

function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(name.length + 1)) || null;
  } catch {
    return null;
  }
}

export function buildAnalyticsContext(source: "client" | "server"): AnalyticsContext {
  if (source === "client") {
    return {
      ts: new Date().toISOString(),
      source,
      market: readBrowserCookie(MARKET_PREF_COOKIE),
      locale: readBrowserCookie(LOCALE_PREF_COOKIE),
      anon_id: readBrowserCookie(COOKIE_VISITOR_COOKIE),
    };
  }

  // Sync server track() — headers() is async; omit market/locale rather than block.
  // Prefer passing context from request-scoped callers later if needed.
  void CURRENCY_PREF_COOKIE;
  return {
    ts: new Date().toISOString(),
    source,
    market: null,
    locale: null,
    anon_id: null,
  };
}
