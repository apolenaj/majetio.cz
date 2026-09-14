"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/forms/controls";
import {
  COOKIE_CATEGORY_META,
  COOKIE_CONSENT_COOKIE,
  COOKIE_POLICY_VERSION,
  COOKIE_VISITOR_COOKIE,
  acceptAllConsent,
  defaultRejectedConsent,
  needsCookieBanner,
  parseCookieConsent,
  type CookieConsentState,
  type CookieCategoryId,
} from "@/domains/privacy/cookie-consent";
import {
  acceptAllCookiesAction,
  rejectOptionalCookiesAction,
  saveCookieConsentAction,
} from "@/domains/privacy/privacy-actions";
import { cn } from "@/lib/utils";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

function writeCookie(name: string, value: string, maxAgeSec: number) {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${secure}`;
}

function ensureVisitorId(): string {
  const existing = readCookie(COOKIE_VISITOR_COOKIE);
  if (existing && existing.length >= 8) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  writeCookie(COOKIE_VISITOR_COOKIE, id, 60 * 60 * 24 * 400);
  return id;
}

function persistState(state: CookieConsentState) {
  writeCookie(
    COOKIE_CONSENT_COOKIE,
    JSON.stringify(state),
    60 * 60 * 24 * 400,
  );
  window.dispatchEvent(
    new CustomEvent("majetio:cookie-consent", { detail: state }),
  );
}

/**
 * Cookie Consent Banner — Accept all / Reject / Customize with equal weight.
 * No pre-checked analytics or marketing.
 */
export function ConsentBanner() {
  const [open, setOpen] = React.useState(false);
  const [customize, setCustomize] = React.useState(false);
  const [prefs, setPrefs] = React.useState({
    preferences: false,
    analytics: false,
    marketing: false,
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const state = parseCookieConsent(readCookie(COOKIE_CONSENT_COOKIE));
    setOpen(needsCookieBanner(state));
  }, []);

  async function apply(
    mode: "accept" | "reject" | "custom",
  ): Promise<void> {
    setBusy(true);
    setError(null);
    const visitorId = ensureVisitorId();
    let result:
      | { ok: true; state: CookieConsentState }
      | { ok: false; error: string };

    if (mode === "accept") {
      result = await acceptAllCookiesAction({ visitorId });
      if (result.ok) persistState(result.state);
      else persistState(acceptAllConsent());
    } else if (mode === "reject") {
      result = await rejectOptionalCookiesAction({ visitorId });
      if (result.ok) persistState(result.state);
      else persistState(defaultRejectedConsent());
    } else {
      result = await saveCookieConsentAction({
        ...prefs,
        visitorId,
        source: "consent_banner_customize",
      });
      if (result.ok) persistState(result.state);
      else {
        persistState({
          v: COOKIE_POLICY_VERSION,
          necessary: true,
          ...prefs,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    if (!result.ok) setError(result.error);
    setBusy(false);
    setOpen(false);
    setCustomize(false);
  }

  if (!open) return null;

  const optionalCategories = (
    Object.keys(COOKIE_CATEGORY_META) as CookieCategoryId[]
  ).filter((id) => id !== "necessary");

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-[var(--border-default)] bg-[var(--surface-primary)] p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] sm:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div>
          <h2
            id="cookie-consent-title"
            className="text-base font-medium text-[var(--text-primary)]"
          >
            Nastavení cookies
          </h2>
          <p
            id="cookie-consent-desc"
            className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]"
          >
            Používáme nezbytné cookies pro provoz. Preferenční, analytické a
            marketingové jen se souhlasem — před ním se nespouští.{" "}
            <Link
              href="/cookies"
              className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
            >
              Zásady cookies
            </Link>
            {" · verze "}
            {COOKIE_POLICY_VERSION}
          </p>
        </div>

        {customize ? (
          <ul className="space-y-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] p-3">
            <li>
              <Switch
                checked
                disabled
                label={COOKIE_CATEGORY_META.necessary.title}
              />
              <p className="mt-1 pl-14 text-[var(--text-caption)] text-[var(--text-muted)]">
                {COOKIE_CATEGORY_META.necessary.description}
              </p>
            </li>
            {optionalCategories.map((id) => (
              <li key={id}>
                <Switch
                  checked={prefs[id]}
                  onCheckedChange={(v) =>
                    setPrefs((p) => ({ ...p, [id]: v }))
                  }
                  label={COOKIE_CATEGORY_META[id].title}
                />
                <p className="mt-1 pl-14 text-[var(--text-caption)] text-[var(--text-muted)]">
                  {COOKIE_CATEGORY_META[id].description}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        {error ? (
          <p className="text-sm text-[var(--status-danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <div
          className={cn(
            "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center",
          )}
        >
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            className="sm:min-w-[10rem]"
            onClick={() => void apply("reject")}
          >
            Odmítnout nepovinné
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            className="sm:min-w-[10rem]"
            onClick={() => setCustomize((c) => !c)}
          >
            {customize ? "Skrýt nastavení" : "Nastavit"}
          </Button>
          {customize ? (
            <Button
              type="button"
              disabled={busy}
              className="sm:min-w-[10rem]"
              onClick={() => void apply("custom")}
            >
              Uložit volbu
            </Button>
          ) : (
            <Button
              type="button"
              disabled={busy}
              className="sm:min-w-[10rem]"
              onClick={() => void apply("accept")}
            >
              Přijmout vše
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
