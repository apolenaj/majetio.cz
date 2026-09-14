/**
 * Cookie CMP categories — Necessary always on; others opt-in only.
 * No dark patterns: equal Accept all / Reject / Customize.
 */

export const COOKIE_POLICY_VERSION = "2026-07-22";

export const COOKIE_CONSENT_COOKIE = "majetio_cookie_consent";
export const COOKIE_VISITOR_COOKIE = "majetio_consent_vid";

export type CookieCategoryId =
  | "necessary"
  | "preferences"
  | "analytics"
  | "marketing";

export type CookieConsentChoices = {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type CookieConsentState = CookieConsentChoices & {
  v: string;
  updatedAt: string;
};

export const COOKIE_CATEGORY_META: Record<
  CookieCategoryId,
  { title: string; description: string; required: boolean }
> = {
  necessary: {
    title: "Nezbytné",
    description:
      "Technicky nutné pro přihlášení, bezpečnost, load balancing a uložení vašeho rozhodnutí o cookies.",
    required: true,
  },
  preferences: {
    title: "Preferenční",
    description:
      "Zapamatování jazyka, trhu a UI preferencí. Bez nich se nastavení neuchová mezi návštěvami.",
    required: false,
  },
  analytics: {
    title: "Analytické",
    description:
      "Agregovaná měření používání produktu (bez PII a bez finančních částek). Před souhlasem se nespouští.",
    required: false,
  },
  marketing: {
    title: "Marketingové",
    description:
      "Měření kampaní a remarketing. Před souhlasem se nespouští. Není součástí nákupu ani registrace.",
    required: false,
  },
};

export function defaultRejectedConsent(): CookieConsentState {
  return {
    v: COOKIE_POLICY_VERSION,
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
  };
}

export function acceptAllConsent(): CookieConsentState {
  return {
    v: COOKIE_POLICY_VERSION,
    necessary: true,
    preferences: true,
    analytics: true,
    marketing: true,
    updatedAt: new Date().toISOString(),
  };
}

export function parseCookieConsent(
  raw: string | undefined | null,
): CookieConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (parsed.v !== COOKIE_POLICY_VERSION) return null;
    if (parsed.necessary !== true) return null;
    return {
      v: COOKIE_POLICY_VERSION,
      necessary: true,
      preferences: Boolean(parsed.preferences),
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function needsCookieBanner(state: CookieConsentState | null): boolean {
  return state === null;
}
