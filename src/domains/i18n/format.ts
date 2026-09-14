/**
 * Locale-aware formatters (Prompt 17.2).
 * Timestamps stored UTC; display uses market/user timezone.
 */

import {
  currencyMinorDigits,
  type CurrencyCode,
  assertCurrencyCode,
} from "@/domains/finance/primitives/currency";
import {
  getLocaleDefinition,
  type LocaleDefinition,
} from "@/domains/i18n/locales";

function resolveIntlLocale(locale?: string | null): string {
  if (!locale) return "cs-CZ";
  return getLocaleDefinition(locale)?.intlLocale ?? locale;
}

export function formatNumber(
  value: number,
  locale?: string | null,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(resolveIntlLocale(locale), options).format(value);
}

export function formatMoneyMajor(
  amountMajor: number,
  currency: string | CurrencyCode,
  locale?: string | null,
  options?: { maximumFractionDigits?: number; minimumFractionDigits?: number },
): string {
  const code = assertCurrencyCode(currency);
  const digits = currencyMinorDigits(code);
  const max =
    options?.maximumFractionDigits ??
    (code === "IDR" || code === "CZK" ? 0 : Math.min(2, digits));
  const min = options?.minimumFractionDigits ?? 0;
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    style: "currency",
    currency: code,
    maximumFractionDigits: max,
    minimumFractionDigits: min,
  }).format(amountMajor);
}

export function formatMoneyMinor(
  amountMinor: number,
  currency: string | CurrencyCode,
  locale?: string | null,
): string {
  const code = assertCurrencyCode(currency);
  const major = amountMinor / 10 ** currencyMinorDigits(code);
  return formatMoneyMajor(major, code, locale);
}

export function formatDateUtc(
  isoOrDate: string | Date,
  locale?: string | null,
  timeZone = "UTC",
  options?: Intl.DateTimeFormatOptions,
): string {
  const date =
    typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
      timeZone,
      dateStyle: "medium",
      ...options,
    }).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
        timeZone: "UTC",
        dateStyle: "medium",
        ...options,
      }).format(date);
    } catch {
      return "—";
    }
  }
}

export function formatDateTimeUtc(
  isoOrDate: string | Date,
  locale?: string | null,
  timeZone = "UTC",
  options?: Intl.DateTimeFormatOptions,
): string {
  const date =
    typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
      ...options,
    }).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
        timeZone: "UTC",
        dateStyle: "medium",
        timeStyle: "short",
        ...options,
      }).format(date);
    } catch {
      return "—";
    }
  }
}

/**
 * Display instant in market/user timezone (storage remains UTC).
 */
export function formatInstantForTimezone(input: {
  isoUtc: string | Date;
  timeZone: string;
  locale?: string | null;
}): string {
  return formatDateTimeUtc(input.isoUtc, input.locale, input.timeZone);
}

/**
 * Normalize to E.164 when possible. Returns null if invalid.
 * Accepts already-E.164 or national numbers with defaultCountryCallingCode
 * (e.g. "420" for CZ without +).
 */
export function toE164(
  raw: string,
  defaultCountryCallingCode?: string,
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (defaultCountryCallingCode) {
    const cc = defaultCountryCallingCode.replace(/\D/g, "");
    // Drop leading 0 of national format
    const national = digits.startsWith("0") ? digits.slice(1) : digits;
    const e164 = `+${cc}${national}`;
    if (e164.length < 10 || e164.length > 16) return null;
    return e164;
  }

  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
}

export function formatPhoneE164(
  e164OrRaw: string,
  locale?: string | null,
  defaultCountryCallingCode?: string,
): string {
  const e164 = toE164(e164OrRaw, defaultCountryCallingCode) ?? e164OrRaw.trim();
  // Lightweight grouping: +420 123 456 789
  const m = e164.match(/^\+(\d{1,3})(\d+)$/);
  if (!m) return e164;
  const cc = m[1]!;
  const rest = m[2]!;
  const groups = rest.match(/.{1,3}/g)?.join(" ") ?? rest;
  void locale;
  return `+${cc} ${groups}`;
}

export function formatArea(
  value: number,
  measurementSystem: "METRIC" | "IMPERIAL",
  locale?: string | null,
): string {
  if (measurementSystem === "IMPERIAL") {
    const sqft = value * 10.76391041671;
    return `${formatNumber(sqft, locale, { maximumFractionDigits: 0 })} sq ft`;
  }
  return `${formatNumber(value, locale, { maximumFractionDigits: 0 })} m²`;
}

export type AddressFormatHints = {
  locale: string;
  /** Rough region model from MarketPlugin.property.addressModel */
  addressModel?: "EU_STREET" | "GULF" | "SEA_ISLAND" | "GENERIC";
};

/**
 * Order address lines for display (does not geocode).
 */
export function formatAddressLines(
  parts: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    region?: string | null;
    postalCode?: string | null;
    countryCode?: string | null;
  },
  hints?: AddressFormatHints,
): string[] {
  const model = hints?.addressModel ?? "GENERIC";
  const lines: string[] = [];
  if (parts.line1) lines.push(parts.line1);
  if (parts.line2) lines.push(parts.line2);

  if (model === "EU_STREET") {
    const cityLine = [parts.postalCode, parts.city].filter(Boolean).join(" ");
    if (cityLine) lines.push(cityLine);
    if (parts.region) lines.push(parts.region);
  } else if (model === "GULF") {
    if (parts.city) lines.push(parts.city);
    if (parts.region) lines.push(parts.region);
    if (parts.postalCode) lines.push(parts.postalCode);
  } else {
    const cityLine = [parts.city, parts.region, parts.postalCode]
      .filter(Boolean)
      .join(", ");
    if (cityLine) lines.push(cityLine);
  }
  if (parts.countryCode) lines.push(parts.countryCode.toUpperCase());
  return lines;
}

export function getLocaleDir(locale?: string | null): "ltr" | "rtl" {
  return getLocaleDefinition(locale ?? "cs-CZ")?.dir ?? "ltr";
}

export type { LocaleDefinition };
