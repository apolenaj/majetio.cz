/**
 * Fingerprints + stale diffs (BOD 75, 104–106).
 * Detect changes vs snapshot at T without overwriting canonical data.
 */

import type {
  PropertyPublicFingerprint,
  StaleDiff,
  ComparisonPublicPropertyMetrics,
} from "./types";

export function buildFingerprint(
  metrics: Pick<
    ComparisonPublicPropertyMetrics,
    "propertyId" | "basics" | "valuation" | "renovation" | "majetioScore"
  > & { status: string; updatedAt: string },
): PropertyPublicFingerprint {
  return {
    propertyId: metrics.propertyId,
    askingPriceCzk: metrics.basics.askingPriceCzk,
    status: metrics.status,
    valuationMidCzk: metrics.valuation.midCzk,
    renovationBaseCzk: metrics.renovation.costBaseCzk,
    majetioScore: metrics.majetioScore.score,
    updatedAt: metrics.updatedAt,
  };
}

export function detectStaleDiffs(input: {
  snapshotFingerprints: PropertyPublicFingerprint[];
  live: Array<{
    fingerprint: PropertyPublicFingerprint;
    title: string;
  }>;
}): StaleDiff[] {
  const byId = new Map(
    input.snapshotFingerprints.map((f) => [f.propertyId, f] as const),
  );
  const diffs: StaleDiff[] = [];

  for (const row of input.live) {
    const prev = byId.get(row.fingerprint.propertyId);
    if (!prev) continue;
    const cur = row.fingerprint;

    if (prev.askingPriceCzk !== cur.askingPriceCzk) {
      diffs.push({
        propertyId: cur.propertyId,
        propertyTitle: row.title,
        field: "asking_price",
        messageCs: formatAskingPriceDiffCs(
          prev.askingPriceCzk,
          cur.askingPriceCzk,
        ),
        previous: prev.askingPriceCzk,
        current: cur.askingPriceCzk,
      });
    }
    if (prev.status !== cur.status) {
      diffs.push({
        propertyId: cur.propertyId,
        propertyTitle: row.title,
        field: "status",
        messageCs: "Stav nabídky se změnil od vašeho posledního porovnání",
        previous: prev.status,
        current: cur.status,
      });
    }
    if (prev.valuationMidCzk !== cur.valuationMidCzk) {
      diffs.push({
        propertyId: cur.propertyId,
        propertyTitle: row.title,
        field: "valuation",
        messageCs: "Odhad hodnoty se změnil od vašeho posledního porovnání",
        previous: prev.valuationMidCzk,
        current: cur.valuationMidCzk,
      });
    }
    if (prev.renovationBaseCzk !== cur.renovationBaseCzk) {
      diffs.push({
        propertyId: cur.propertyId,
        propertyTitle: row.title,
        field: "renovation",
        messageCs: "Odhad rekonstrukce se změnil od vašeho posledního porovnání",
        previous: prev.renovationBaseCzk,
        current: cur.renovationBaseCzk,
      });
    }
    if (prev.majetioScore !== cur.majetioScore) {
      diffs.push({
        propertyId: cur.propertyId,
        propertyTitle: row.title,
        field: "majetio_score",
        messageCs: "Majetio Score se změnil od vašeho posledního porovnání",
        previous: prev.majetioScore,
        current: cur.majetioScore,
      });
    }
  }

  return diffs;
}

/** e.g. "Cena klesla o 300 000 Kč" — no personal financing. */
export function formatAskingPriceDiffCs(
  previousCzk: number | null,
  currentCzk: number | null,
): string {
  if (previousCzk == null || currentCzk == null) {
    return "Cena se změnila od vašeho posledního porovnání";
  }
  const delta = currentCzk - previousCzk;
  if (delta === 0) {
    return "Cena se změnila od vašeho posledního porovnání";
  }
  const abs = new Intl.NumberFormat("cs-CZ", {
    maximumFractionDigits: 0,
  }).format(Math.abs(delta));
  return delta < 0
    ? `Cena klesla o ${abs} Kč`
    : `Cena vzrostla o ${abs} Kč`;
}
