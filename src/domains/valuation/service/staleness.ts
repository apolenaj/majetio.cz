/**
 * Valuation staleness / recalculation triggers (Prompt 10 Part 3).
 * Do NOT recompute on every page view — reuse cache unless a trigger fires.
 */

export const DEFAULT_VALUATION_MAX_AGE_DAYS = 14;

export type CachedValuationRef = {
  calculatedAt: string | Date;
  /** Asking / listing price used when the valuation was computed. */
  inputAskingPriceCzk: number | null;
  /** Fingerprint of subject attributes that affect comps (area, layout, condition…). */
  subjectFingerprint: string;
  modelVersion: string;
  status?: string;
};

export type RecalculationContext = {
  now?: Date;
  currentAskingPriceCzk: number | null;
  currentSubjectFingerprint: string;
  currentModelVersion: string;
  /** Explicit user/staff request. */
  manualRequest?: boolean;
  /** Max age before forced refresh. */
  maxAgeDays?: number;
  /** Relative price change that forces refresh (default 3 %). */
  priceChangeRatio?: number;
};

export type RecalculationDecision = {
  shouldRecalculate: boolean;
  reasons: string[];
  useCache: boolean;
};

export function buildSubjectFingerprint(input: {
  usableArea: number | null | undefined;
  layout: string | null | undefined;
  condition: string | null | undefined;
  floor: number | null | undefined;
  hasBalcony?: boolean | null;
  hasElevator?: boolean | null;
  city?: string | null;
  district?: string | null;
}): string {
  return [
    input.usableArea ?? "",
    (input.layout ?? "").trim().toLowerCase(),
    (input.condition ?? "").trim().toUpperCase(),
    input.floor ?? "",
    input.hasBalcony === true ? "1" : input.hasBalcony === false ? "0" : "",
    input.hasElevator === true ? "1" : input.hasElevator === false ? "0" : "",
    (input.city ?? "").trim().toLowerCase(),
    (input.district ?? "").trim().toLowerCase(),
  ].join("|");
}

function ageDays(from: string | Date, now: Date): number | null {
  const d = typeof from === "string" ? new Date(from) : from;
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86_400_000));
}

/**
 * Decide whether to recompute or serve cached valuation.
 */
export function shouldRecalculateValuation(
  cached: CachedValuationRef | null | undefined,
  ctx: RecalculationContext,
): RecalculationDecision {
  const reasons: string[] = [];
  const now = ctx.now ?? new Date();

  if (ctx.manualRequest) {
    reasons.push("Ruční požadavek na přepočet.");
  }

  if (!cached) {
    reasons.push("Žádný uložený odhad v cache.");
    return { shouldRecalculate: true, reasons, useCache: false };
  }

  const maxAge = ctx.maxAgeDays ?? DEFAULT_VALUATION_MAX_AGE_DAYS;
  const age = ageDays(cached.calculatedAt, now);
  if (age != null && age >= maxAge) {
    reasons.push(
      `Odhad je starší než ${maxAge} dní (aktuálně ${age} dní) — je potřeba refresh.`,
    );
  }

  const ratio = ctx.priceChangeRatio ?? 0.03;
  if (
    cached.inputAskingPriceCzk != null &&
    ctx.currentAskingPriceCzk != null &&
    cached.inputAskingPriceCzk > 0
  ) {
    const delta =
      Math.abs(ctx.currentAskingPriceCzk - cached.inputAskingPriceCzk) /
      cached.inputAskingPriceCzk;
    if (delta >= ratio) {
      reasons.push(
        `Nabídková cena se změnila o ${(delta * 100).toFixed(1)} % (práh ${ratio * 100} %).`,
      );
    }
  } else if (
    cached.inputAskingPriceCzk == null &&
    ctx.currentAskingPriceCzk != null
  ) {
    reasons.push("Objevila se nabídková cena, která při posledním odhadu chyběla.");
  } else if (
    cached.inputAskingPriceCzk != null &&
    ctx.currentAskingPriceCzk == null
  ) {
    reasons.push("Nabídková cena byla odstraněna — vstup odhadu se změnil.");
  }

  if (cached.subjectFingerprint !== ctx.currentSubjectFingerprint) {
    reasons.push(
      "Změnily se vstupní atributy nemovitosti (plocha/dispozice/stav/lokalita).",
    );
  }

  if (cached.modelVersion !== ctx.currentModelVersion) {
    reasons.push(
      `Verze modelu se změnila (${cached.modelVersion} → ${ctx.currentModelVersion}).`,
    );
  }

  if (cached.status === "OUTDATED" || cached.status === "FAILED") {
    reasons.push(`Uložený odhad má status ${cached.status}.`);
  }

  const shouldRecalculate = reasons.length > 0;
  return {
    shouldRecalculate,
    reasons,
    useCache: !shouldRecalculate,
  };
}
