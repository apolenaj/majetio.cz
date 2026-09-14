/**
 * Data source licensing — source must not be used outside allowed market/usage.
 */

import {
  getMarketDataSource,
  listMarketDataSources,
  type MarketDataSource,
  type MarketDataSourceAllowedUsage,
} from "@/domains/markets/data-sources/registry";

export type DataSourceUsageKind = keyof MarketDataSourceAllowedUsage;

export type DataSourceLicenseErrorCode =
  | "SOURCE_NOT_FOUND"
  | "MARKET_NOT_ALLOWED"
  | "USAGE_NOT_ALLOWED"
  | "DEMO_OR_UNVERIFIED";

export class DataSourceLicenseError extends Error {
  readonly code: DataSourceLicenseErrorCode;

  constructor(code: DataSourceLicenseErrorCode, message: string) {
    super(message);
    this.name = "DataSourceLicenseError";
    this.code = code;
  }
}

export type LicensedDataSourceRef = {
  sourceKey: string;
  /** Market where the consumer intends to use the data. */
  marketCode: string;
  usage: DataSourceUsageKind;
};

/**
 * Assert a data source may be used for this market + usage.
 * SCRAPED_RESTRICTED / unverified research sources fail closed for commercial use.
 */
export function assertDataSourceAllowedForMarket(
  input: LicensedDataSourceRef,
): MarketDataSource {
  const source = getMarketDataSource(input.sourceKey);
  if (!source) {
    throw new DataSourceLicenseError(
      "SOURCE_NOT_FOUND",
      `Unknown data source: ${input.sourceKey}`,
    );
  }

  const market = input.marketCode.toUpperCase();
  if (source.marketCode !== "*" && source.marketCode !== market) {
    throw new DataSourceLicenseError(
      "MARKET_NOT_ALLOWED",
      `Source ${source.key} is licensed for market ${source.marketCode}, not ${market}.`,
    );
  }

  if (!source.allowedUsage[input.usage]) {
    throw new DataSourceLicenseError(
      "USAGE_NOT_ALLOWED",
      `Source ${source.key} does not allow usage "${input.usage}" (license: ${source.license}).`,
    );
  }

  if (
    source.category === "SCRAPED_RESTRICTED" ||
    (input.usage !== "display" && !source.verifiedAt)
  ) {
    throw new DataSourceLicenseError(
      "DEMO_OR_UNVERIFIED",
      `Source ${source.key} is unverified or restricted — refuse non-compliant use.`,
    );
  }

  return source;
}

export function listLicensedSourcesForMarket(input: {
  marketCode: string;
  usage: DataSourceUsageKind;
}): MarketDataSource[] {
  return listMarketDataSources(input.marketCode).filter((s) => {
    try {
      assertDataSourceAllowedForMarket({
        sourceKey: s.key,
        marketCode: input.marketCode,
        usage: input.usage,
      });
      return true;
    } catch {
      return false;
    }
  });
}
