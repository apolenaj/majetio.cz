/**
 * FX resolution engine (Rules 128–133).
 *
 * - Historical calculations pin snapshots (reproducibility).
 * - Fresh rates preferred; stale rates may fall back with explicit status.
 * - Missing rates → UNAVAILABLE (never invent live FX).
 */

import type { CurrencyCode } from "@/domains/finance/primitives/currency";
import { assertCurrencyCode } from "@/domains/finance/primitives/currency";
import { Money } from "@/domains/finance/primitives/money";
import {
  assertValidExchangeRateSnapshot,
  convertMoneyWithSnapshot,
  identityExchangeRateSnapshot,
  invertSnapshot,
  normalizeExchangeRateSnapshot,
  type ExchangeRateSnapshot,
  type LegacyExchangeRateSnapshot,
} from "@/domains/finance/fx/exchange-rate";

/** Default: rates older than 48h are STALE. */
export const DEFAULT_FX_MAX_AGE_MS = 48 * 60 * 60 * 1000;

export type FxRateStatus = "FRESH" | "STALE" | "UNAVAILABLE" | "IDENTITY";

export type FxResolveMode =
  /** Prefer fresh; if only stale exists, return it with STALE. */
  | "ALLOW_STALE"
  /** Require fresh within maxAgeMs — otherwise UNAVAILABLE. */
  | "REQUIRE_FRESH"
  /** Use exactly the pinned snapshot (historical reproducibility). */
  | "PINNED";

export class FxUnavailableError extends Error {
  readonly code = "FX_UNAVAILABLE" as const;
  readonly pair: string;
  readonly status: FxRateStatus;

  constructor(message: string, pair: string, status: FxRateStatus = "UNAVAILABLE") {
    super(message);
    this.name = "FxUnavailableError";
    this.pair = pair;
    this.status = status;
  }
}

export type FxResolvedRate = {
  status: Exclude<FxRateStatus, "UNAVAILABLE">;
  snapshot: ExchangeRateSnapshot;
  /** Age in ms relative to `asOf` (or now). */
  ageMs: number;
  /** True when status is STALE and mode allowed fallback. */
  usedStaleFallback: boolean;
};

export type FxRateStore = {
  /**
   * Return known snapshots for the pair (either orientation).
   * Implementations may query Prisma ExchangeRateSnapshot.
   */
  listForPair(input: {
    baseCurrency: CurrencyCode;
    quoteCurrency: CurrencyCode;
  }): ExchangeRateSnapshot[];
};

/** In-memory store for tests / deterministic fixtures. */
export class InMemoryFxRateStore implements FxRateStore {
  private readonly rows: ExchangeRateSnapshot[] = [];

  seed(
    snapshots: Array<ExchangeRateSnapshot | LegacyExchangeRateSnapshot>,
  ): void {
    for (const s of snapshots) {
      const n = normalizeExchangeRateSnapshot(s);
      assertValidExchangeRateSnapshot(n);
      this.rows.push(n);
    }
  }

  listForPair(input: {
    baseCurrency: CurrencyCode;
    quoteCurrency: CurrencyCode;
  }): ExchangeRateSnapshot[] {
    const base = input.baseCurrency;
    const quote = input.quoteCurrency;
    return this.rows.filter(
      (r) =>
        (r.baseCurrency === base && r.quoteCurrency === quote) ||
        (r.baseCurrency === quote && r.quoteCurrency === base),
    );
  }
}

function pairKey(base: string, quote: string): string {
  return `${base}/${quote}`;
}

function ageMs(observedAt: string, asOf: Date): number {
  return Math.max(0, asOf.getTime() - Date.parse(observedAt));
}

function orientSnapshot(
  snapshot: ExchangeRateSnapshot,
  base: CurrencyCode,
  quote: CurrencyCode,
): ExchangeRateSnapshot | null {
  if (snapshot.baseCurrency === base && snapshot.quoteCurrency === quote) {
    return snapshot;
  }
  if (snapshot.baseCurrency === quote && snapshot.quoteCurrency === base) {
    return invertSnapshot(snapshot);
  }
  return null;
}

/**
 * Resolve FX for a currency pair.
 *
 * Historical reproducibility: pass `pinned` + mode PINNED (or just use convertMoneyWithSnapshot).
 */
export function resolveExchangeRate(input: {
  baseCurrency: string;
  quoteCurrency: string;
  store: FxRateStore;
  mode?: FxResolveMode;
  /** Wall-clock / scenario "as of" for freshness & historical lookup. */
  asOf?: Date;
  maxAgeMs?: number;
  /** Exact snapshot for PINNED / historical calc — never refreshed. */
  pinned?: ExchangeRateSnapshot | LegacyExchangeRateSnapshot | null;
}): FxResolvedRate {
  const base = assertCurrencyCode(input.baseCurrency);
  const quote = assertCurrencyCode(input.quoteCurrency);
  const asOf = input.asOf ?? new Date();
  const maxAgeMs = input.maxAgeMs ?? DEFAULT_FX_MAX_AGE_MS;
  const mode = input.mode ?? "ALLOW_STALE";
  const key = pairKey(base, quote);

  if (base === quote) {
    const snap = identityExchangeRateSnapshot(base, asOf.toISOString());
    return {
      status: "IDENTITY",
      snapshot: snap,
      ageMs: 0,
      usedStaleFallback: false,
    };
  }

  if (mode === "PINNED" || input.pinned) {
    if (!input.pinned) {
      throw new FxUnavailableError(
        `Pinned FX required for ${key} but no snapshot provided.`,
        key,
      );
    }
    const raw = normalizeExchangeRateSnapshot(input.pinned);
    const oriented = orientSnapshot(raw, base, quote);
    if (!oriented) {
      throw new FxUnavailableError(
        `Pinned snapshot does not match pair ${key}.`,
        key,
      );
    }
    assertValidExchangeRateSnapshot(oriented);
    return {
      status: "FRESH",
      snapshot: oriented,
      ageMs: ageMs(oriented.observedAt, asOf),
      usedStaleFallback: false,
    };
  }

  const candidates = input.store
    .listForPair({ baseCurrency: base, quoteCurrency: quote })
    .map((s) => orientSnapshot(s, base, quote))
    .filter((s): s is ExchangeRateSnapshot => s != null)
    .filter((s) => Date.parse(s.observedAt) <= asOf.getTime())
    .sort(
      (a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt),
    );

  const best = candidates[0];
  if (!best) {
    throw new FxUnavailableError(
      `No exchange rate available for ${key} as of ${asOf.toISOString()}.`,
      key,
    );
  }

  const age = ageMs(best.observedAt, asOf);
  const fresh = age <= maxAgeMs;

  if (fresh) {
    return {
      status: "FRESH",
      snapshot: best,
      ageMs: age,
      usedStaleFallback: false,
    };
  }

  if (mode === "REQUIRE_FRESH") {
    throw new FxUnavailableError(
      `Exchange rate for ${key} is stale (age ${age}ms > max ${maxAgeMs}ms).`,
      key,
      "STALE",
    );
  }

  // ALLOW_STALE fallback
  return {
    status: "STALE",
    snapshot: best,
    ageMs: age,
    usedStaleFallback: true,
  };
}

/**
 * Convert money via engine resolution (or throw FxUnavailableError).
 */
export function convertMoneyWithFxEngine(input: {
  amount: Money;
  targetCurrency: string;
  store: FxRateStore;
  mode?: FxResolveMode;
  asOf?: Date;
  maxAgeMs?: number;
  pinned?: ExchangeRateSnapshot | LegacyExchangeRateSnapshot | null;
}): {
  money: Money;
  resolution: FxResolvedRate;
} {
  const target = assertCurrencyCode(input.targetCurrency);
  const resolution = resolveExchangeRate({
    baseCurrency: input.amount.currency,
    quoteCurrency: target,
    store: input.store,
    mode: input.mode,
    asOf: input.asOf,
    maxAgeMs: input.maxAgeMs,
    pinned: input.pinned,
  });
  const money = convertMoneyWithSnapshot({
    amount: input.amount,
    snapshot: resolution.snapshot,
  });
  return { money, resolution };
}
