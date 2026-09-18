import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { buildLoginUrl } from "@/lib/auth/callback-url";
import { isAdminZoneRole } from "@/domains/administration/rbac/roles";
import {
  CURRENCY_PREF_COOKIE,
  LOCALE_PREF_COOKIE,
  MARKET_PREF_COOKIE,
  suggestMarketFromGeoCountry,
} from "@/domains/i18n/preference/store";
import { stripLocalePrefix } from "@/domains/i18n/locales";
import {
  INTERNATIONAL_CACHE_VERSION,
  buildInternationalCacheKey,
} from "@/domains/i18n/cache-keys";
import { HOME_MARKET_CODE, tryMarketCode } from "@/domains/markets/codes";
import {
  applySecurityHeaders,
  createRequestNonce,
} from "@/lib/security/headers";
import {
  applyPrivateCacheHeaders,
  isPrivateNoStorePath,
} from "@/lib/security/http-privacy";
import {
  REQUEST_ID_HEADER,
  resolveOrCreateRequestId,
} from "@/lib/observability/correlation";
import {
  isMaintenanceBypassPath,
  isMaintenanceMode,
  maintenanceHtmlResponse,
} from "@/lib/maintenance";

function needsAuthToken(pathname: string): boolean {
  return (
    pathname.startsWith("/ucet") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/profi") ||
    pathname.startsWith("/prihlaseni") ||
    pathname.startsWith("/registrace") ||
    (pathname.startsWith("/dev") && process.env.NODE_ENV === "production")
  );
}

function finalize(
  request: NextRequest,
  response: NextResponse,
  pathnameForKey: string,
  nonce: string,
  requestId: string,
): NextResponse {
  const market =
    tryMarketCode(request.cookies.get(MARKET_PREF_COOKIE)?.value) ??
    HOME_MARKET_CODE;
  const locale = request.cookies.get(LOCALE_PREF_COOKIE)?.value ?? "cs-CZ";
  const currency =
    request.cookies.get(CURRENCY_PREF_COOKIE)?.value?.toUpperCase() ?? "CZK";

  const geo =
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country");
  const suggested = suggestMarketFromGeoCountry(geo);

  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set("x-majetio-market", market);
  response.headers.set("x-majetio-locale", locale);
  response.headers.set("x-majetio-currency", currency);
  response.headers.set("x-majetio-cache-version", INTERNATIONAL_CACHE_VERSION);
  response.headers.set(
    "x-majetio-cache-key",
    buildInternationalCacheKey({
      market,
      locale,
      currency,
      resource: pathnameForKey,
    }),
  );
  if (suggested) {
    response.headers.set("x-majetio-market-suggest", suggested);
  }

  applySecurityHeaders(response.headers, {
    nonce,
    // Dev: Report-Only so Next/Turbopack inline scripts don't break local UI.
    enforceCsp: process.env.NODE_ENV === "production",
  });

  // Privacy-by-Default: never allow shared CDN cache for account / admin /
  // broker / checkout / payment & integration APIs (profiles, analyses, leads).
  if (
    isPrivateNoStorePath(pathnameForKey) ||
    isPrivateNoStorePath(request.nextUrl.pathname)
  ) {
    applyPrivateCacheHeaders(response.headers);
  }

  return response;
}

function nextWithObservability(
  request: NextRequest,
  nonce: string,
  requestId: string,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

/**
 * Edge middleware:
 * - Security headers (CSP nonce, HSTS, nosniff, frame-ancestors, Referrer-Policy)
 * - Request correlation (x-request-id)
 * - Auth guards (account, admin, broker /profi)
 * - Locale prefix rewrite + international cache headers
 * - NEVER auto-redirect from IP/geo
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = createRequestNonce();
  const requestId = resolveOrCreateRequestId(
    request.headers.get(REQUEST_ID_HEADER) ??
      request.headers.get("x-correlation-id"),
  );

  // Maintenance mode — graceful 503 for public traffic (health/admin bypass).
  if (isMaintenanceMode() && !isMaintenanceBypassPath(pathname)) {
    return new NextResponse(maintenanceHtmlResponse(), {
      status: 503,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "retry-after": "3600",
        "cache-control": "no-store",
        [REQUEST_ID_HEADER]: requestId,
        "x-robots-tag": "noindex",
      },
    });
  }

  // Canonical host: apex → www (production only; localhost untouched).
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (
    process.env.NODE_ENV === "production" &&
    (host === "majetio.cz" || host === "majetio.com")
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.hostname = host === "majetio.com" ? "www.majetio.com" : "www.majetio.cz";
    const res = NextResponse.redirect(url, 308);
    res.headers.set(REQUEST_ID_HEADER, requestId);
    return res;
  }

  const stripped = stripLocalePrefix(pathname);
  if (
    stripped.locale &&
    stripped.locale.pathPrefix &&
    !pathname.startsWith("/ucet") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/profi") &&
    !pathname.startsWith("/api")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = stripped.pathname;
    const rewrite = NextResponse.rewrite(url, {
      request: {
        headers: (() => {
          const h = new Headers(request.headers);
          h.set("x-nonce", nonce);
          h.set(REQUEST_ID_HEADER, requestId);
          return h;
        })(),
      },
    });
    rewrite.cookies.set(LOCALE_PREF_COOKIE, stripped.locale.locale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    return finalize(request, rewrite, stripped.pathname, nonce, requestId);
  }

  if (!needsAuthToken(pathname)) {
    return finalize(
      request,
      nextWithObservability(request, nonce, requestId),
      pathname,
      nonce,
      requestId,
    );
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  const isLoggedIn = Boolean(token?.sub);

  if (pathname.startsWith("/dev") && process.env.NODE_ENV === "production") {
    if (process.env.ALLOW_DESIGN_SYSTEM !== "true") {
      return finalize(
        request,
        NextResponse.redirect(new URL("/", request.url)),
        pathname,
        nonce,
        requestId,
      );
    }
  }

  if (pathname.startsWith("/ucet") || pathname.startsWith("/onboarding")) {
    if (!isLoggedIn) {
      return finalize(
        request,
        NextResponse.redirect(
          new URL(buildLoginUrl(pathname + request.nextUrl.search), request.url),
        ),
        pathname,
        nonce,
        requestId,
      );
    }
    const response = nextWithObservability(request, nonce, requestId);
    response.headers.set(
      "x-majetio-zone",
      pathname.startsWith("/onboarding") ? "onboarding" : "account",
    );
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return finalize(request, response, pathname, nonce, requestId);
  }

  if (pathname.startsWith("/profi")) {
    if (!isLoggedIn) {
      return finalize(
        request,
        NextResponse.redirect(
        new URL(buildLoginUrl(pathname + request.nextUrl.search), request.url),
        ),
        pathname,
        nonce,
        requestId,
      );
    }
    const response = nextWithObservability(request, nonce, requestId);
    response.headers.set("x-majetio-zone", "broker");
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return finalize(request, response, pathname, nonce, requestId);
  }

  if (pathname.startsWith("/api/admin")) {
    if (!isLoggedIn) {
      const res = NextResponse.json(
        { ok: false, error: "Authentication required.", code: "unauthorized" },
        { status: 401 },
      );
      return finalize(request, res, pathname, nonce, requestId);
    }
    if (!isAdminZoneRole(token?.role)) {
      const res = NextResponse.json(
        { ok: false, error: "Admin zone role required.", code: "forbidden" },
        { status: 403 },
      );
      return finalize(request, res, pathname, nonce, requestId);
    }
    const response = nextWithObservability(request, nonce, requestId);
    response.headers.set("x-majetio-zone", "admin-api");
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return finalize(request, response, pathname, nonce, requestId);
  }

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return finalize(
        request,
        NextResponse.redirect(new URL(buildLoginUrl(pathname), request.url)),
        pathname,
        nonce,
        requestId,
      );
    }
    if (!isAdminZoneRole(token?.role)) {
      return finalize(
        request,
        NextResponse.redirect(new URL("/ucet?error=forbidden", request.url)),
        pathname,
        nonce,
        requestId,
      );
    }
    const response = nextWithObservability(request, nonce, requestId);
    response.headers.set("x-majetio-zone", "admin");
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return finalize(request, response, pathname, nonce, requestId);
  }

  if (pathname.startsWith("/analyza")) {
    const response = nextWithObservability(request, nonce, requestId);
    response.headers.set("x-majetio-zone", "tools");
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return finalize(request, response, pathname, nonce, requestId);
  }

  if (pathname.startsWith("/prihlaseni") || pathname.startsWith("/registrace")) {
    if (isLoggedIn) {
      return finalize(
        request,
        NextResponse.redirect(new URL("/ucet", request.url)),
        pathname,
        nonce,
        requestId,
      );
    }
  }

  return finalize(
    request,
    nextWithObservability(request, nonce, requestId),
    pathname,
    nonce,
    requestId,
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
