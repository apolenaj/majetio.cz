/**
 * Cost band arithmetic — always returns low/base/high intervals.
 */

export type CostBand = {
  lowCzk: number;
  baseCzk: number;
  highCzk: number;
};

export type PartialCostBand = {
  lowCzk: number | null;
  baseCzk: number | null;
  highCzk: number | null;
};

export function roundCzk(value: number): number {
  return Math.round(value);
}

export function costBandFromUnitRates(
  low: number,
  base: number,
  high: number,
  quantity: number,
  regionalCoefficient: number,
): CostBand {
  const coef = regionalCoefficient;
  return {
    lowCzk: roundCzk(low * quantity * coef),
    baseCzk: roundCzk(base * quantity * coef),
    highCzk: roundCzk(high * quantity * coef),
  };
}

export function multiplyBandByRates(
  constructionBase: CostBand,
  rates: { low: number; base: number; high: number },
): CostBand {
  return {
    lowCzk: roundCzk(constructionBase.lowCzk * rates.low),
    baseCzk: roundCzk(constructionBase.baseCzk * rates.base),
    highCzk: roundCzk(constructionBase.highCzk * rates.high),
  };
}

export function sumBands(bands: CostBand[]): CostBand {
  return bands.reduce(
    (acc, band) => ({
      lowCzk: acc.lowCzk + band.lowCzk,
      baseCzk: acc.baseCzk + band.baseCzk,
      highCzk: acc.highCzk + band.highCzk,
    }),
    { lowCzk: 0, baseCzk: 0, highCzk: 0 },
  );
}

export function isBandComplete(band: PartialCostBand): band is CostBand {
  return (
    band.lowCzk !== null &&
    band.baseCzk !== null &&
    band.highCzk !== null
  );
}

export function assertBandOrder(band: CostBand): void {
  if (
    band.lowCzk > band.baseCzk ||
    band.baseCzk > band.highCzk
  ) {
    throw new Error(
      `Invalid cost band order: low=${band.lowCzk}, base=${band.baseCzk}, high=${band.highCzk}`,
    );
  }
}
