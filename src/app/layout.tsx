import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { DM_Sans, Noto_Sans_Arabic, Source_Serif_4 } from "next/font/google";

import { SkipLink } from "@/components/navigation/tabs";
import { ConsentBanner } from "@/components/privacy/consent-banner";
import { TooltipProvider } from "@/components/overlays/tooltip";
import { brand } from "@/config/brand";
import { getLocaleDir } from "@/domains/i18n/format";
import {
  htmlLangFromLocale,
  LOCALE_PREF_COOKIE,
} from "@/domains/i18n/preference/store";
import {
  INTERNATIONAL_CACHE_VERSION,
} from "@/domains/i18n/cache-keys";
import { getPublicAppUrl } from "@/lib/app-url";
import { REQUEST_ID_HEADER } from "@/lib/observability/correlation";
import { RequestIdCapture } from "@/components/observability/request-id-capture";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: true,
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
});

/** Licensed Google Font — Latin + Arabic for RTL-ready stack (preload off for CZ). */
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicAppUrl()),
  title: {
    default: `${brand.name} — ${brand.claims.hero}`,
    template: `%s · ${brand.name}`,
  },
  description:
    "Majetio.cz spojuje vyhledávání nemovitostí s analýzou hodnoty, výnosů, cash flow a rizik. Než koupíte, mějte jasno.",
  applicationName: brand.name,
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
  icons: {
    icon: [{ url: "/brand/icons/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: `${brand.name} — ${brand.claims.primary}`,
    description: brand.claims.secondary,
    locale: "cs_CZ",
    type: "website",
    siteName: brand.name,
    images: [
      {
        url: "/brand/social/majetio-og-brand.png",
        width: 1200,
        height: 630,
        alt: "Majetio — analytická realitní platforma",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description: brand.claims.primary,
    images: ["/brand/social/majetio-og-brand.png"],
  },
  other: {
    "x-majetio-cache-version": INTERNATIONAL_CACHE_VERSION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const nonce = headerStore.get("x-nonce") ?? undefined;
  const requestId =
    headerStore.get(REQUEST_ID_HEADER) ??
    headerStore.get("x-correlation-id") ??
    null;
  const locale = cookieStore.get(LOCALE_PREF_COOKIE)?.value ?? "cs-CZ";
  const lang = htmlLangFromLocale(locale);
  const dir = getLocaleDir(locale);

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${dmSans.variable} ${sourceSerif.variable} ${notoArabic.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased" data-nonce={nonce}>
        <RequestIdCapture requestId={requestId} />
        <TooltipProvider>
          <SkipLink />
          {children}
          <ConsentBanner />
        </TooltipProvider>
      </body>
    </html>
  );
}
