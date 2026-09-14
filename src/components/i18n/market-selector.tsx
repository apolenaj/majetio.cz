"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useTransition } from "react";

import { setMarketLocalePreference } from "@/lib/i18n/preference-actions";
import { writeGuestPrefsToStorage } from "@/domains/i18n/preference/store";
import type { MarketSelectorOption } from "@/components/i18n/market-selector-types";
import { cn } from "@/lib/utils";

export type { MarketSelectorOption } from "@/components/i18n/market-selector-types";

export type MarketSelectorProps = {
  markets: MarketSelectorOption[];
  currentMarketCode: string;
  currentLocale: string;
  className?: string;
  /** Header: text + chevron, no heavy chrome. */
  variant?: "default" | "minimal";
};

/**
 * Accessible market selector — keyboard operable native <select>.
 * Does not auto-redirect; persists preference and refreshes in place.
 */
export function MarketSelector({
  markets,
  currentMarketCode,
  currentLocale,
  className,
  variant = "default",
}: MarketSelectorProps) {
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
        Market / Trh
      </label>
      <select
        id={id}
        name="market"
        className={cn(
          "cursor-pointer text-sm whitespace-nowrap transition-colors disabled:opacity-60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-primary)]",
          minimal
            ? "appearance-none max-w-[9.5rem] border-0 bg-transparent py-1.5 pr-6 pl-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            : "min-h-11 max-w-[11rem] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-2 text-[var(--text-primary)]",
        )}
        value={currentMarketCode}
        disabled={pending}
        aria-busy={pending}
        onChange={(e) => {
          const next = e.target.value;
          startTransition(async () => {
            const result = await setMarketLocalePreference({
              marketCode: next,
              locale: currentLocale,
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
        {markets.map((m) => {
          const selectable =
            m.publiclyActive || m.marketCode === currentMarketCode;
          const label = m.publiclyActive
            ? m.displayNameLocal
            : `${m.displayNameLocal} (${m.launchStatus})`;
          return (
            <option
              key={m.marketCode}
              value={m.marketCode}
              disabled={!selectable}
              lang={m.marketCode === "CZ" ? "cs" : "en"}
            >
              {label}
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
