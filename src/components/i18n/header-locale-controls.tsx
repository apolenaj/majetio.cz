"use client";

import type { MarketSelectorOption } from "@/components/i18n/market-selector-types";
import {
  MarketSelector,
} from "@/components/i18n/market-selector";
import { LanguageSelector } from "@/components/i18n/language-selector";

export function HeaderLocaleControls(props: {
  marketCode: string;
  locale: string;
  currency: string;
  markets: MarketSelectorOption[];
  locales: readonly string[];
}) {
  return (
    <div
      className="flex items-center gap-3"
      role="group"
      aria-label="Market and language"
    >
      <MarketSelector
        markets={props.markets}
        currentMarketCode={props.marketCode}
        currentLocale={props.locale}
        variant="minimal"
      />
      <LanguageSelector
        locales={props.locales}
        currentLocale={props.locale}
        currentMarketCode={props.marketCode}
        currentCurrency={props.currency}
        variant="minimal"
      />
    </div>
  );
}
