import type { MetadataRoute } from "next";

import { getSiteOrigin } from "@/domains/seo/site-origin";

/**
 * Technical robots.txt — block account, auth, admin, checkout, broker, search.
 * English aliases included for crawlers that probe /account|/login|/private.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Account / privacy center
          "/ucet",
          "/ucet/",
          "/account",
          "/account/",
          // Auth
          "/prihlaseni",
          "/login",
          "/registrace",
          "/zapomenute-heslo",
          "/obnovit-heslo",
          "/overeni-emailu",
          // Admin & ops
          "/admin",
          "/admin/",
          // Checkout
          "/checkout",
          "/checkout/",
          // Broker / onboarding
          "/profi",
          "/profi/",
          "/onboarding",
          "/onboarding/",
          // Private / internal search
          "/private",
          "/private/",
          "/hledat",
          "/hledat/",
          // Analysis workspace (user-specific) — bare + nested
          "/analyza",
          "/analyza/",
          // Design system
          "/dev",
          "/dev/",
          // API (no HTML index value)
          "/api/",
        ],
      },
    ],
    // Next.js multi-sitemap index when generateSitemaps is used
    sitemap: `${base}/sitemap.xml`,
  };
}
