/**
 * Locale catalog — Market ≠ Language (Prompt 17.2).
 * A market can expose multiple locales (e.g. AE: en-AE + ar-AE).
 */

export const SUPPORTED_LANGUAGE_TAGS = [
  "cs",
  "en",
  "sk",
  "es",
  "it",
  "hr",
  "ar",
] as const;

export type LanguageTag = (typeof SUPPORTED_LANGUAGE_TAGS)[number];

export type LocaleDefinition = {
  /** BCP-47 locale (cs-CZ, en-GB, ar-AE, …). */
  locale: string;
  language: LanguageTag;
  /** Intl / formatting locale (usually same as locale). */
  intlLocale: string;
  /** HTML lang + dir. */
  htmlLang: string;
  dir: "ltr" | "rtl";
  /** Short label for language switcher. */
  labelEn: string;
  labelNative: string;
  /** SEO path prefix without leading slash ("" for default site language). */
  pathPrefix: string;
};

/**
 * Canonical locales Majetio prepares for (not all wired to UI yet).
 */
export const LOCALE_DEFINITIONS: readonly LocaleDefinition[] = [
  {
    locale: "cs-CZ",
    language: "cs",
    intlLocale: "cs-CZ",
    htmlLang: "cs",
    dir: "ltr",
    labelEn: "Czech",
    labelNative: "Čeština",
    pathPrefix: "",
  },
  {
    locale: "en-GB",
    language: "en",
    intlLocale: "en-GB",
    htmlLang: "en",
    dir: "ltr",
    labelEn: "English",
    labelNative: "English",
    pathPrefix: "en",
  },
  {
    locale: "sk-SK",
    language: "sk",
    intlLocale: "sk-SK",
    htmlLang: "sk",
    dir: "ltr",
    labelEn: "Slovak",
    labelNative: "Slovenčina",
    pathPrefix: "sk",
  },
  {
    locale: "es-ES",
    language: "es",
    intlLocale: "es-ES",
    htmlLang: "es",
    dir: "ltr",
    labelEn: "Spanish",
    labelNative: "Español",
    pathPrefix: "es",
  },
  {
    locale: "it-IT",
    language: "it",
    intlLocale: "it-IT",
    htmlLang: "it",
    dir: "ltr",
    labelEn: "Italian",
    labelNative: "Italiano",
    pathPrefix: "it",
  },
  {
    locale: "hr-HR",
    language: "hr",
    intlLocale: "hr-HR",
    htmlLang: "hr",
    dir: "ltr",
    labelEn: "Croatian",
    labelNative: "Hrvatski",
    pathPrefix: "hr",
  },
  {
    locale: "ar-AE",
    language: "ar",
    intlLocale: "ar-AE",
    htmlLang: "ar",
    dir: "rtl",
    labelEn: "Arabic (UAE)",
    labelNative: "العربية",
    pathPrefix: "ar",
  },
  {
    locale: "en-AE",
    language: "en",
    intlLocale: "en-AE",
    htmlLang: "en",
    dir: "ltr",
    labelEn: "English (UAE)",
    labelNative: "English",
    pathPrefix: "en",
  },
] as const;

const BY_LOCALE = new Map(LOCALE_DEFINITIONS.map((l) => [l.locale, l]));

export function getLocaleDefinition(locale: string): LocaleDefinition | null {
  if (BY_LOCALE.has(locale)) return BY_LOCALE.get(locale)!;
  // Normalize short tags: cs → cs-CZ
  const language = locale.split("-")[0]?.toLowerCase() as LanguageTag | undefined;
  if (language && (SUPPORTED_LANGUAGE_TAGS as readonly string[]).includes(language)) {
    return LOCALE_DEFINITIONS.find((l) => l.language === language) ?? null;
  }
  return null;
}

export function languageFromLocale(locale: string): LanguageTag {
  const def = getLocaleDefinition(locale);
  if (def) return def.language;
  const short = locale.split("-")[0]?.toLowerCase();
  if (short && (SUPPORTED_LANGUAGE_TAGS as readonly string[]).includes(short)) {
    return short as LanguageTag;
  }
  return "en";
}

/**
 * Resolve UI locale from market + user preference.
 * Market constrains available locales; language is independent of marketCode.
 */
export function resolveLocaleForMarket(input: {
  marketDefaultLocale: string;
  marketSupportedLocales: readonly string[];
  userPreferredLocale?: string | null;
}): LocaleDefinition {
  const preferred = input.userPreferredLocale?.trim();
  if (preferred) {
    // Exact match in market
    if (input.marketSupportedLocales.includes(preferred)) {
      return getLocaleDefinition(preferred) ?? fallbackEn();
    }
    // Language match (cs vs cs-CZ)
    const prefLang = languageFromLocale(preferred);
    const byLang = input.marketSupportedLocales.find(
      (l) => languageFromLocale(l) === prefLang,
    );
    if (byLang) return getLocaleDefinition(byLang) ?? fallbackEn();
  }
  return (
    getLocaleDefinition(input.marketDefaultLocale) ??
    getLocaleDefinition(input.marketSupportedLocales[0] ?? "en-GB") ??
    fallbackEn()
  );
}

function fallbackEn(): LocaleDefinition {
  return getLocaleDefinition("en-GB")!;
}

/**
 * SEO-safe routing strategy (prepared for App Router):
 *
 * - Default market language (CZ → cs) uses unprefixed paths: `/nemovitosti`
 * - Other languages use `/{lang}/...` where lang ∈ pathPrefix (en, sk, es, …)
 * - Market is NOT encoded in the path by default (subdomain or cookie later:
 *   cz.majetio.com / ae.majetio.com). Avoid `/ae/ar/...` duplication that
 *   splits SEO authority.
 * - hreflang: emit alternates for each supported locale of the *active* market
 * - Canonical URL always points at the language variant actually rendered
 *
 * Example AE market:
 *   - en-AE → `/en/properties` (or `/en/nemovitosti` until EN IA exists)
 *   - ar-AE → `/ar/...` with `dir=rtl`
 */
export type SeoLocaleRoute = {
  locale: string;
  pathPrefix: string;
  /** Absolute path including prefix, no origin. */
  localizedPath: string;
  hreflang: string;
  dir: "ltr" | "rtl";
};

export function buildSeoLocaleRoutes(input: {
  /** Path without locale prefix, starting with /. */
  pathname: string;
  locales: readonly string[];
}): SeoLocaleRoute[] {
  const path = input.pathname.startsWith("/")
    ? input.pathname
    : `/${input.pathname}`;

  return input.locales.map((locale) => {
    const def = getLocaleDefinition(locale) ?? fallbackEn();
    const localizedPath =
      def.pathPrefix === ""
        ? path
        : `/${def.pathPrefix}${path === "/" ? "" : path}`;
    return {
      locale: def.locale,
      pathPrefix: def.pathPrefix,
      localizedPath,
      hreflang: def.locale,
      dir: def.dir,
    };
  });
}

export function stripLocalePrefix(pathname: string): {
  locale: LocaleDefinition | null;
  pathname: string;
} {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return { locale: null, pathname: "/" };
  const maybe = parts[0]!;
  const def = LOCALE_DEFINITIONS.find((l) => l.pathPrefix === maybe);
  if (!def || def.pathPrefix === "") {
    return { locale: null, pathname: pathname.startsWith("/") ? pathname : `/${pathname}` };
  }
  const rest = "/" + parts.slice(1).join("/");
  return { locale: def, pathname: rest === "/" ? "/" : rest };
}
