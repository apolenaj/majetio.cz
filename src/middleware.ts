import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { buildLoginUrl } from "@/lib/auth/callback-url";

function isAdminRole(role: unknown): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Edge-safe protection via JWT (no Prisma).
 * Pages still re-check with requireUser / requireRole on the server.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  const isLoggedIn = Boolean(token?.sub);

  if (pathname.startsWith("/dev") && process.env.NODE_ENV === "production") {
    if (process.env.ALLOW_DESIGN_SYSTEM !== "true") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/ucet") || pathname.startsWith("/onboarding")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(buildLoginUrl(pathname + request.nextUrl.search), request.url),
      );
    }
    const response = NextResponse.next();
    response.headers.set("x-majetio-zone", pathname.startsWith("/onboarding") ? "onboarding" : "account");
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  }

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(buildLoginUrl(pathname), request.url));
    }
    if (!isAdminRole(token?.role)) {
      return NextResponse.redirect(new URL("/ucet?error=forbidden", request.url));
    }
    const response = NextResponse.next();
    response.headers.set("x-majetio-zone", "admin");
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  }

  if (pathname.startsWith("/prihlaseni") || pathname.startsWith("/registrace")) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/ucet", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/ucet/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/admin/:path*",
    "/prihlaseni",
    "/registrace",
    "/dev/:path*",
  ],
};
