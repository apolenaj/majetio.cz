/**
 * i18n domain — locales, SEO routing, translations, formatters (Prompt 17.2).
 */

export {
  SUPPORTED_LANGUAGE_TAGS,
  LOCALE_DEFINITIONS,
  getLocaleDefinition,
  languageFromLocale,
  resolveLocaleForMarket,
  buildSeoLocaleRoutes,
  stripLocalePrefix,
  type LanguageTag,
  type LocaleDefinition,
  type SeoLocaleRoute,
} from "./locales";

export {
  TRANSLATION_CONTENT_STATUSES,
  LEGAL_TRANSLATION_NAMESPACES,
  TRANSLATION_KEY_CATALOG,
  isLegalNamespace,
  isTranslationPublicallyShippable,
  translationKey,
  type TranslationContentStatus,
  type TranslationNamespace,
  type TranslationEntry,
} from "./translation";

export {
  formatNumber,
  formatMoneyMajor,
  formatMoneyMinor,
  formatDateUtc,
  formatDateTimeUtc,
  formatInstantForTimezone,
  toE164,
  formatPhoneE164,
  formatArea,
  formatAddressLines,
  getLocaleDir,
} from "./format";

export {
  MARKET_PREF_COOKIE,
  LOCALE_PREF_COOKIE,
  CURRENCY_PREF_COOKIE,
  MARKET_PREF_STORAGE_KEY,
  LOCALE_PREF_STORAGE_KEY,
  CURRENCY_PREF_STORAGE_KEY,
  buildPreferenceCookies,
  suggestMarketFromGeoCountry,
  resolveInternationalPreference,
  readGuestPrefsFromStorage,
  writeGuestPrefsToStorage,
  htmlLangFromLocale,
  type InternationalPreference,
  type PreferenceCookieBag,
} from "./preference/store";

export {
  INTERNATIONAL_CACHE_VERSION,
  buildInternationalCacheKey,
  internationalCacheVaryHeaders,
  type InternationalCacheKeyParts,
} from "./cache-keys";

export {
  loadMessageCatalog,
  resolveMessage,
  translateMessage,
  csMessages,
  type MessageCatalog,
} from "./messages";
