/**
 * Typed market extensions registry (Rules 147–152).
 * Rejects attributes that do not belong to the property's marketCode.
 */

import { z } from "zod";

import {
  czechPropertyAttributesSchema,
  parseCzechPropertyAttributes,
  type CzechPropertyAttributes,
} from "@/domains/properties/extensions/schemas/czech";
import {
  spainPropertyAttributesSchema,
  parseSpainPropertyAttributes,
  type SpainPropertyAttributes,
} from "@/domains/properties/extensions/schemas/spain";
import {
  uaePropertyAttributesSchema,
  parseUAEPropertyAttributes,
  type UAEPropertyAttributes,
} from "@/domains/properties/extensions/schemas/uae";

export type MarketPropertyAttributes =
  | CzechPropertyAttributes
  | UAEPropertyAttributes
  | SpainPropertyAttributes;

export type ExtensionMarketCode = MarketPropertyAttributes["marketCode"];

export class MarketExtensionError extends Error {
  readonly code:
    | "UNSUPPORTED_MARKET"
    | "MARKET_MISMATCH"
    | "INVALID_ATTRIBUTES";

  constructor(
    code: MarketExtensionError["code"],
    message: string,
  ) {
    super(message);
    this.name = "MarketExtensionError";
    this.code = code;
  }
}

const SCHEMAS: Record<
  ExtensionMarketCode,
  z.ZodType<MarketPropertyAttributes>
> = {
  CZ: czechPropertyAttributesSchema,
  AE: uaePropertyAttributesSchema,
  ES: spainPropertyAttributesSchema,
};

export function supportsTypedExtensions(marketCode: string): boolean {
  return marketCode.toUpperCase() in SCHEMAS;
}

export function getExtensionSchema(
  marketCode: string,
): z.ZodType<MarketPropertyAttributes> | null {
  const key = marketCode.toUpperCase() as ExtensionMarketCode;
  return SCHEMAS[key] ?? null;
}

/**
 * Parse + validate extensions for a property market.
 * Throws MarketExtensionError when:
 * - market has no typed schema and payload is non-empty
 * - payload.marketCode mismatches property market
 * - foreign-market fields / unknown keys present (strict Zod)
 */
export function parseMarketExtensions(
  marketCode: string,
  raw: unknown,
): MarketPropertyAttributes | null {
  const code = marketCode.trim().toUpperCase();
  const schema = getExtensionSchema(code);

  if (raw == null || (typeof raw === "object" && raw !== null && Object.keys(raw as object).length === 0)) {
    return null;
  }

  if (!schema) {
    throw new MarketExtensionError(
      "UNSUPPORTED_MARKET",
      `Market ${code} has no typed extension schema; refuse opaque bags.`,
    );
  }

  if (
    typeof raw === "object" &&
    raw !== null &&
    "marketCode" in raw &&
    typeof (raw as { marketCode: unknown }).marketCode === "string"
  ) {
    const declared = String((raw as { marketCode: string }).marketCode)
      .trim()
      .toUpperCase();
    if (declared !== code) {
      throw new MarketExtensionError(
        "MARKET_MISMATCH",
        `Extension marketCode ${declared} does not match property market ${code}.`,
      );
    }
  }

  // Explicit rejection of cross-market field sets (e.g. UAE furnishing on CZ).
  assertNoForeignMarketKeys(code, raw);

  try {
    switch (code) {
      case "CZ":
        return parseCzechPropertyAttributes(raw);
      case "AE":
        return parseUAEPropertyAttributes(raw);
      case "ES":
        return parseSpainPropertyAttributes(raw);
      default:
        throw new MarketExtensionError(
          "UNSUPPORTED_MARKET",
          `No parser for market ${code}.`,
        );
    }
  } catch (err) {
    if (err instanceof MarketExtensionError) throw err;
    const message =
      err instanceof z.ZodError
        ? err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
        : err instanceof Error
          ? err.message
          : "Invalid attributes";
    throw new MarketExtensionError("INVALID_ATTRIBUTES", message);
  }
}

/** Keys that unambiguously belong to another market's extension. */
const FOREIGN_MARKERS: Record<ExtensionMarketCode, readonly string[]> = {
  CZ: [
    "furnishing",
    "viewType",
    "serviceChargeAedPerSqftYear",
    "reraNumber",
    "cadastralReference",
    "ibiAnnualEur",
    "energyCertificate",
  ],
  AE: [
    "penbClass",
    "svjMonthlyFeeCzk",
    "cadastralReference",
    "ibiAnnualEur",
    "communityFeesMonthlyEur",
    "energyCertificate",
  ],
  ES: [
    "furnishing",
    "viewType",
    "serviceChargeAedPerSqftYear",
    "reraNumber",
    "penbClass",
    "svjMonthlyFeeCzk",
  ],
};

function assertNoForeignMarketKeys(marketCode: string, raw: unknown): void {
  if (typeof raw !== "object" || raw === null) return;
  const keys = Object.keys(raw);
  const foreign =
    FOREIGN_MARKERS[marketCode as ExtensionMarketCode] ?? [];
  const hit = keys.find((k) => foreign.includes(k));
  if (hit) {
    throw new MarketExtensionError(
      "MARKET_MISMATCH",
      `Attribute "${hit}" is not valid for market ${marketCode}.`,
    );
  }
}

/**
 * Safe write helper — returns JSON-ready object for Property.marketExtensions.
 */
export function serializeMarketExtensions(
  marketCode: string,
  raw: unknown,
): MarketPropertyAttributes | null {
  return parseMarketExtensions(marketCode, raw);
}

export type {
  CzechPropertyAttributes,
  SpainPropertyAttributes,
  UAEPropertyAttributes,
};
