"use client";

import {
  buildDualCurrencyDisplay,
  dualCurrencyDisclaimerCs,
  dualCurrencyDisclaimerEn,
  type DualCurrencyDisplay,
  type ExchangeRateSnapshot,
} from "@/domains/finance";
import { Money } from "@/domains/finance/primitives/money";
import type { CurrencyCode } from "@/domains/finance/primitives/currency";
import { formatMoneyMajor } from "@/domains/i18n/format";
import { cn } from "@/lib/utils";

/**
 * Dual currency price foundation (Rules 193–195).
 * Primary = listing/local currency; secondary = orientational FX only.
 */
export function DualCurrencyPrice(props: {
  amountMajor: number;
  currency: string;
  secondaryCurrency?: string | null;
  snapshot?: ExchangeRateSnapshot | null;
  locale?: string;
  className?: string;
  showDisclaimer?: boolean;
}) {
  const money = Money.fromMajor(props.amountMajor, props.currency);
  const display: DualCurrencyDisplay = buildDualCurrencyDisplay({
    primary: money,
    secondaryCurrency: props.secondaryCurrency as CurrencyCode | null | undefined,
    snapshot: props.snapshot,
  });

  const locale = props.locale ?? "cs-CZ";
  const primaryLabel = formatMoneyMajor(
    display.primary.amountMajor,
    display.primary.currency,
    locale,
  );

  return (
    <div className={cn("flex flex-col gap-0.5", props.className)}>
      <span className="text-base font-medium text-[var(--text-primary)] tabular-nums">
        {primaryLabel}
      </span>
      {display.secondary ? (
        <>
          <span className="text-sm text-[var(--text-secondary)] tabular-nums">
            ≈{" "}
            {formatMoneyMajor(
              display.secondary.amountMajor,
              display.secondary.currency,
              locale,
            )}
          </span>
          {props.showDisclaimer !== false ? (
            <span className="text-xs text-[var(--text-muted)]">
              {locale.startsWith("cs")
                ? dualCurrencyDisclaimerCs(display.secondary.snapshot)
                : dualCurrencyDisclaimerEn(display.secondary.snapshot)}
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
