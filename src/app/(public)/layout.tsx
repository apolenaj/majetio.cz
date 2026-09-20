import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { HomeDesignTopBar } from "@/components/marketing/home/home-design-top-bar";
import { MarketSuggestBanner } from "@/components/i18n/market-suggest-banner";
import { buildHeaderLocaleOptions } from "@/lib/i18n/header-locale-options";
import { getRequestInternationalPreference } from "@/lib/i18n/request-preference";
import { marketRegistry } from "@/domains/markets/registry/market-registry";

export default async function PublicSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pref = await getRequestInternationalPreference();
  const { markets, locales } = buildHeaderLocaleOptions(pref.marketCode);
  const suggested = pref.suggestedMarketCode
    ? marketRegistry.get(pref.suggestedMarketCode)
    : null;

  return (
    <>
      <HomeDesignTopBar />
      {suggested ? (
        <MarketSuggestBanner
          suggestedMarketCode={suggested.marketCode}
          suggestedLabel={suggested.displayNameLocal}
          currentLocale={pref.locale}
        />
      ) : null}
      <SiteHeader
        marketCode={pref.marketCode}
        locale={pref.locale}
        currency={pref.currency}
        markets={markets}
        locales={locales}
      />
      <main id="main-content" className="flex-1 overflow-x-clip">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
