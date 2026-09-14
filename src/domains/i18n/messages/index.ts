/**
 * Lazy / route-scoped i18n message catalogs (Rule 186–187).
 * CZ users must not download AR/EN catalogs until requested.
 */

import { languageFromLocale, type LanguageTag } from "@/domains/i18n/locales";
import csMessages from "@/domains/i18n/messages/cs";

export type MessageCatalog = Record<string, string>;

const loaders: Record<
  LanguageTag,
  () => Promise<{ default: MessageCatalog }>
> = {
  cs: () => import("@/domains/i18n/messages/cs"),
  en: () => import("@/domains/i18n/messages/en"),
  sk: () => import("@/domains/i18n/messages/sk"),
  es: () => import("@/domains/i18n/messages/es"),
  it: () => import("@/domains/i18n/messages/it"),
  hr: () => import("@/domains/i18n/messages/hr"),
  ar: () => import("@/domains/i18n/messages/ar"),
};

/**
 * Dynamically import message catalog for a locale.
 * Tree-shaking / code-splitting: each language is a separate chunk.
 */
export async function loadMessageCatalog(
  locale: string,
): Promise<MessageCatalog> {
  const lang = languageFromLocale(locale);
  const loader = loaders[lang] ?? loaders.en;
  const mod = await loader();
  return mod.default;
}

/**
 * Resolve a message key with fallback chain: primary → fallbacks → key.
 * Missing translations must not crash UI.
 */
export function resolveMessage(
  catalog: MessageCatalog,
  key: string,
  fallbacks: MessageCatalog[] = [],
): string {
  if (catalog[key]) return catalog[key];
  for (const fb of fallbacks) {
    if (fb[key]) return fb[key];
  }
  return key;
}

/**
 * Load catalog and resolve key with EN → CS fallback.
 */
export async function translateMessage(
  locale: string,
  key: string,
): Promise<string> {
  const primary = await loadMessageCatalog(locale);
  const lang = languageFromLocale(locale);
  const fallbacks: MessageCatalog[] = [];
  if (lang !== "en") {
    fallbacks.push(await loadMessageCatalog("en-GB"));
  }
  if (lang !== "cs") {
    fallbacks.push(csMessages);
  }
  return resolveMessage(primary, key, fallbacks);
}

/** Sync helper for CZ-only server paths that must not await dynamic import. */
export { default as csMessages } from "@/domains/i18n/messages/cs";
