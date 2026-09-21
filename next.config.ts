import type { NextConfig } from "next";

/**
 * Defense-in-depth headers for static assets (middleware covers HTML/RSC).
 * CSP with nonces lives in `src/middleware.ts` — do not duplicate full CSP here.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /** Do not ship browser source maps to clients in production. */
  productionBrowserSourceMaps: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/brand/icons/favicon.svg",
        permanent: false,
      },
      {
        source: "/obchodni-podminky",
        destination: "/podminky",
        permanent: true,
      },
      {
        source: "/ochrana-osobnich-udaju",
        destination: "/ochrana-soukromi",
        permanent: true,
      },
      {
        source: "/o-majetio",
        destination: "/o-nas",
        permanent: true,
      },
      {
        source: "/jak-odhadujeme-hodnotu",
        destination: "/metodika/odhad-hodnoty",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
