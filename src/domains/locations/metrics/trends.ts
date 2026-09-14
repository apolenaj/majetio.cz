export type MetricTimePoint = {
  period: string;
  calculatedAt: Date;
  value: number;
  sampleCount: number;
  segmentKey: string;
};

export type TrendDirection = "up" | "down" | "flat" | "unknown";

export type MetricTrend = {
  metricKey: string;
  segmentKey: string;
  basePeriod: string;
  comparePeriod: string;
  changePct: number | null;
  changeAbs: number | null;
  direction: TrendDirection;
  baseSampleCount: number;
  compareSampleCount: number;
  compositionStable: boolean;
};

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function direction(changePct: number | null): TrendDirection {
  if (changePct == null) return "unknown";
  if (Math.abs(changePct) < 0.5) return "flat";
  return changePct > 0 ? "up" : "down";
}

export function computePeriodTrend(input: {
  metricKey: string;
  segmentKey: string;
  current: MetricTimePoint;
  previous: MetricTimePoint;
}): MetricTrend {
  const compositionStable =
    input.current.segmentKey === input.previous.segmentKey;
  const changeAbs = input.current.value - input.previous.value;
  const changePct = pctChange(input.current.value, input.previous.value);

  return {
    metricKey: input.metricKey,
    segmentKey: input.segmentKey,
    basePeriod: input.previous.period,
    comparePeriod: input.current.period,
    changePct: compositionStable ? changePct : null,
    changeAbs: compositionStable ? changeAbs : null,
    direction: compositionStable ? direction(changePct) : "unknown",
    baseSampleCount: input.previous.sampleCount,
    compareSampleCount: input.current.sampleCount,
    compositionStable,
  };
}

export type TrailingTrendBundle = {
  mom: MetricTrend | null;
  qoq: MetricTrend | null;
  yoy: MetricTrend | null;
  trailing3mAvg: number | null;
  trailing12mAvg: number | null;
};

export function computeTrailingTrends(
  metricKey: string,
  segmentKey: string,
  points: MetricTimePoint[],
): TrailingTrendBundle {
  const sorted = [...points]
    .filter((p) => p.segmentKey === segmentKey)
    .sort((a, b) => a.calculatedAt.getTime() - b.calculatedAt.getTime());

  const latest = sorted.at(-1);
  const prev1 = sorted.at(-2);
  const prev3 = sorted.at(-4);
  const prev12 = sorted.at(-13);

  return {
    mom:
      latest && prev1
        ? computePeriodTrend({ metricKey, segmentKey, current: latest, previous: prev1 })
        : null,
    qoq:
      latest && prev3
        ? computePeriodTrend({ metricKey, segmentKey, current: latest, previous: prev3 })
        : null,
    yoy:
      latest && prev12
        ? computePeriodTrend({ metricKey, segmentKey, current: latest, previous: prev12 })
        : null,
    trailing3mAvg:
      sorted.slice(-3).length > 0
        ? sorted.slice(-3).reduce((s, p) => s + p.value, 0) / Math.min(3, sorted.length)
        : null,
    trailing12mAvg:
      sorted.slice(-12).length > 0
        ? sorted.slice(-12).reduce((s, p) => s + p.value, 0) / Math.min(12, sorted.length)
        : null,
  };
}
