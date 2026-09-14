"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useTransition } from "react";

import { setLocaleOnlyPreference } from "@/lib/i18n/preference-actions";
import { writeGuestPrefsToStorage } from "@/domains/i18n/preference/store";
import { getLocaleDefinition } from "@/domains/i18n/locales";
import { cn } from "@/lib/utils";

export type LanguageSelectorProps = {
  /** BCP 47 locales available for the active market. */
  locales: readonly string[];
  currentLocale: string;
  currentMarketCode: string;
  currentCurrency: string;
  className?: string;
  /** Header: text + chevron, no heavy chrome. */
  variant?: "default" | "minimal";
};

/**
 * Accessible language selector with correct lang attributes on options.
 * Keyboard support via native select; Escape handled by browser.
 */
export function LanguageSelector({
  locales,
  currentLocale,
  currentMarketCode,
  currentCurrency,
  className,
  variant = "default",
}: LanguageSelectorProps) {
  const id = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const minimal = variant === "minimal";

  return (
    <div
      className={cn(
        "relative inline-flex items-center",
        minimal ? "min-h-9" : "min-h-11 gap-2",
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        Language / Jazyk
      </label>
      <select
        id={id}
        name="locale"
        className={cn(
          "cursor-pointer text-sm whitespace-nowrap transition-colors disabled:opacity-60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-primary)]",
          minimal
            ? "appearance-none max-w-[8.5rem] border-0 bg-transparent py-1.5 pr-6 pl-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            : "min-h-11 max-w-[10rem] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-2 text-[var(--text-primary)]",
        )}
        value={currentLocale}
        disabled={pending}
        aria-busy={pending}
        onChange={(e) => {
          const next = e.target.value;
          startTransition(async () => {
            const result = await setLocaleOnlyPreference(next);
            if (result.ok) {
              writeGuestPrefsToStorage({
                marketCode: result.marketCode || currentMarketCode,
                locale: result.locale,
                currency: result.currency || currentCurrency,
              });
              router.refresh();
            }
          });
        }}
      >
        {locales.map((locale) => {
          const def = getLocaleDefinition(locale);
          return (
            <option key={locale} value={locale} lang={def?.htmlLang ?? locale}>
              {def?.labelNative ?? locale}
            </option>
          );
        })}
      </select>
      {minimal ? (
        <ChevronDown
          className="pointer-events-none absolute right-0.5 size-3.5 text-[var(--text-muted)]"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
