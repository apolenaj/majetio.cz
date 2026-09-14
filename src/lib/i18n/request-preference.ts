import { cookies, headers } from "next/headers";

import {
  LOCALE_PREF_COOKIE,
  MARKET_PREF_COOKIE,
  CURRENCY_PREF_COOKIE,
  resolveInternationalPreference,
  type InternationalPreference,
} from "@/domains/i18n/preference/store";

function hasAuthSessionCookie(
  get: (name: string) => { value: string } | undefined,
): boolean {
  return Boolean(
    get("authjs.session-token") ||
      get("__Secure-authjs.session-token") ||
      get("next-auth.session-token") ||
      get("__Secure-next-auth.session-token"),
  );
}

/**
 * Server-side preference resolution for layouts / metadata.
 * Geo headers only attach a suggestion — never redirect.
 *
 * Guests: cookies only (no DB). Auth profile load is best-effort and must not
 * block the page if Postgres is unreachable.
 */
export async function getRequestInternationalPreference(): Promise<InternationalPreference> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  let profileMarket: string | null = null;
  let profileLocale: string | null = null;

  if (hasAuthSessionCookie((n) => cookieStore.get(n))) {
    try {
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/db");
      const session = await auth();
      if (session?.user?.id) {
        const [profile, marketProfile] = await Promise.all([
          prisma.userProfile.findUnique({
            where: { userId: session.user.id },
            select: { preferredLocale: true },
          }),
          prisma.userMarketProfile.findFirst({
            where: { userId: session.user.id },
            orderBy: { updatedAt: "desc" },
            select: { marketCode: true, preferredLocale: true },
          }),
        ]);
        profileLocale =
          marketProfile?.preferredLocale ?? profile?.preferredLocale ?? null;
        profileMarket = marketProfile?.marketCode ?? null;
      }
    } catch {
      // DB / auth unavailable — cookies remain source of truth
    }
  }

  const geo =
    headerStore.get("cf-ipcountry") ??
    headerStore.get("x-vercel-ip-country") ??
    headerStore.get("x-majetio-geo-country");

  return resolveInternationalPreference({
    cookieMarket: cookieStore.get(MARKET_PREF_COOKIE)?.value,
    cookieLocale: cookieStore.get(LOCALE_PREF_COOKIE)?.value,
    cookieCurrency: cookieStore.get(CURRENCY_PREF_COOKIE)?.value,
    profileMarket,
    profileLocale,
    geoCountryHeader: geo,
  });
}
