"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { setMarketLocalePreference } from "@/lib/i18n/preference-actions";
import { writeGuestPrefsToStorage } from "@/domains/i18n/preference/store";

/**
 * Soft geo suggestion banner — never auto-redirects (Rule 175).
 */
export function MarketSuggestBanner(props: {
  suggestedMarketCode: string;
  suggestedLabel: string;
  currentLocale: string;
  dismissLabel?: string;
  applyLabel?: string;
  title?: string;
  body?: string;
}) {
  const [visible, setVisible] = useState(true);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    try {
      const key = `majetio.dismiss.marketSuggest.${props.suggestedMarketCode}`;
      if (sessionStorage.getItem(key) === "1") setVisible(false);
    } catch {
      /* ignore */
    }
  }, [props.suggestedMarketCode]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="border-b border-[var(--border-default)] bg-[var(--background-secondary)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-[var(--text-primary)]">
            {props.title ?? "Navrhovaný trh"}: {props.suggestedLabel}
          </p>
          <p className="text-[var(--text-secondary)]">
            {props.body ??
              "Podle polohy navrhujeme jiný trh. Přepnutí je dobrovolné — nikdy vás nepřesměrováváme automaticky."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-[var(--radius-md)] bg-[var(--action-primary)] px-3 text-[var(--text-inverse)]"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await setMarketLocalePreference({
                  marketCode: props.suggestedMarketCode,
                  locale: props.currentLocale,
                });
                if (result.ok) {
                  writeGuestPrefsToStorage({
                    marketCode: result.marketCode,
                    locale: result.locale,
                    currency: result.currency,
                  });
                  router.refresh();
                }
              });
            }}
          >
            {props.applyLabel ?? "Přepnout trh"}
          </button>
          <button
            type="button"
            className="min-h-11 rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 text-[var(--text-primary)]"
            onClick={() => {
              try {
                sessionStorage.setItem(
                  `majetio.dismiss.marketSuggest.${props.suggestedMarketCode}`,
                  "1",
                );
              } catch {
                /* ignore */
              }
              setVisible(false);
            }}
          >
            {props.dismissLabel ?? "Zůstat zde"}
          </button>
        </div>
      </div>
    </div>
  );
}
