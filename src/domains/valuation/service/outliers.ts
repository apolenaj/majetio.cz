/**
 * Outlier detection for comps (Prompt 10 Part 2).
 * Marks excluded + reason — never deletes from DB / candidate list.
 */

export type OutlierMark = {
  id: string;
  excluded: boolean;
  reason: string | null;
};

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0]!;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const a = sorted[base]!;
  const b = sorted[Math.min(base + 1, sorted.length - 1)]!;
  return a + rest * (b - a);
}

export function iqrBounds(values: number[]): {
  q1: number;
  q3: number;
  iqr: number;
  lower: number;
  upper: number;
  extremeUpper: number;
} | null {
  const sorted = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (sorted.length < 4) return null;
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  return {
    q1,
    q3,
    iqr,
    lower: q1 - 1.5 * iqr,
    upper: q3 + 1.5 * iqr,
    extremeUpper: q3 + 3 * iqr,
  };
}

export function meanStd(values: number[]): { mean: number; std: number } | null {
  const xs = values.filter((n) => Number.isFinite(n));
  if (xs.length < 3) return null;
  const mean = xs.reduce((s, n) => s + n, 0) / xs.length;
  const variance =
    xs.reduce((s, n) => s + (n - mean) ** 2, 0) / Math.max(1, xs.length - 1);
  return { mean, std: Math.sqrt(variance) };
}

const APARTMENT_AREA_MIN = 12;
const APARTMENT_AREA_MAX = 350;

/**
 * Flag outliers by bad area, IQR on price/m², and |z| > 3 when enough samples.
 */
export function detectOutliers(
  items: Array<{
    id: string;
    pricePerSqm: number;
    usableArea: number | null;
    propertyType?: string | null;
  }>,
): OutlierMark[] {
  const pps = items.map((i) => i.pricePerSqm);
  const bounds = iqrBounds(pps);
  const stats = meanStd(pps);

  return items.map((item) => {
    const area = item.usableArea;
    if (area == null || !Number.isFinite(area) || area <= 0) {
      return {
        id: item.id,
        excluded: true,
        reason: "Chybná nebo chybějící plocha (nelze spočítat cenu za m² spolehlivě)",
      };
    }
    const isApt =
      !item.propertyType ||
      item.propertyType.toUpperCase() === "APARTMENT";
    if (isApt && (area < APARTMENT_AREA_MIN || area > APARTMENT_AREA_MAX)) {
      return {
        id: item.id,
        excluded: true,
        reason: `Plocha mimo realistický interval pro byt (${APARTMENT_AREA_MIN}–${APARTMENT_AREA_MAX} m²)`,
      };
    }

    if (bounds) {
      if (item.pricePerSqm < bounds.lower) {
        return {
          id: item.id,
          excluded: true,
          reason: `Outlier IQR: cena/m² pod dolní mezí (${Math.round(bounds.lower)} Kč/m²)`,
        };
      }
      if (item.pricePerSqm > bounds.extremeUpper) {
        return {
          id: item.id,
          excluded: true,
          reason: `Outlier IQR (luxus/extrém): cena/m² nad 3×IQR mezí (${Math.round(bounds.extremeUpper)} Kč/m²)`,
        };
      }
      if (item.pricePerSqm > bounds.upper) {
        return {
          id: item.id,
          excluded: true,
          reason: `Outlier IQR: cena/m² nad horní mezí (${Math.round(bounds.upper)} Kč/m²)`,
        };
      }
    }

    if (stats && stats.std > 0) {
      const z = (item.pricePerSqm - stats.mean) / stats.std;
      if (Math.abs(z) > 3) {
        return {
          id: item.id,
          excluded: true,
          reason: `Outlier z-score: |z|=${Math.abs(z).toFixed(2)} > 3`,
        };
      }
    }

    return { id: item.id, excluded: false, reason: null };
  });
}
